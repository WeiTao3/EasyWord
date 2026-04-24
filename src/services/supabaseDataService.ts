import { supabase } from '../config/supabase';
import { Word, WordList, AppSettings, CalendarEntries, CheckedListDates } from '../types';
import { createInitialReviewSchedule } from '../utils/spacedRepetition';
import { getToday } from '../utils/dateUtils';

// ── Mappers ──────────────────────────────────────────────────────────────────

const mapRowToWord = (row: any): Word => ({
  id: row.id,
  word: row.word,
  meaning: row.meaning,
  pronunciation: row.pronunciation ?? '',
  source: row.source ?? '',
  dateAdded: row.date_added,
  audioUri: row.audio_uri ?? null,
  listId: row.list_id ?? '',
  reviewSchedule: {
    reviewCount: row.review_count ?? 0,
    nextReviewDate: row.next_review_date ?? '',
    reviewHistory: row.review_history ?? [],
  },
});

const mapWordToRow = (word: Word, userId: string) => ({
  user_id: userId,
  list_id: word.listId || null,
  word: word.word,
  meaning: word.meaning,
  pronunciation: word.pronunciation,
  source: word.source,
  date_added: word.dateAdded,
  audio_uri: word.audioUri,
  review_count: word.reviewSchedule.reviewCount,
  next_review_date: word.reviewSchedule.nextReviewDate || null,
  review_history: word.reviewSchedule.reviewHistory,
});

const mapRowToList = (row: any): WordList => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  dateCreated: row.date_created,
  listNo: row.list_no ?? undefined,
});

const mapListToRow = (list: WordList, userId: string) => ({
  user_id: userId,
  name: list.name,
  description: list.description ?? null,
  date_created: list.dateCreated,
  list_no: list.listNo ?? null,
});

// ── Words ─────────────────────────────────────────────────────────────────────

export const loadWords = async (userId: string): Promise<Word[]> => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(mapRowToWord);
};

export const insertWord = async (word: Word, userId: string): Promise<Word> => {
  const { data, error } = await supabase
    .from('words')
    .insert(mapWordToRow(word, userId))
    .select()
    .single();
  if (error) throw error;
  return mapRowToWord(data);
};

export const updateWord = async (word: Word, userId: string): Promise<void> => {
  const { id, ...row } = mapWordToRow(word, userId) as any;
  const { error } = await supabase
    .from('words')
    .update(row)
    .eq('id', word.id)
    .eq('user_id', userId);
  if (error) throw error;
};

export const deleteWord = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
};

export const reassignWords = async (fromListId: string, toListId: string | null, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('words')
    .update({ list_id: toListId })
    .eq('list_id', fromListId)
    .eq('user_id', userId);
  if (error) throw error;
};

// ── Lists ─────────────────────────────────────────────────────────────────────

export const loadLists = async (userId: string): Promise<WordList[]> => {
  const { data, error } = await supabase
    .from('word_lists')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(mapRowToList);
};

export const insertList = async (list: WordList, userId: string): Promise<WordList> => {
  const { data, error } = await supabase
    .from('word_lists')
    .insert(mapListToRow(list, userId))
    .select()
    .single();
  if (error) throw error;
  return mapRowToList(data);
};

export const updateList = async (list: WordList, userId: string): Promise<void> => {
  const { id, ...row } = mapListToRow(list, userId) as any;
  const { error } = await supabase
    .from('word_lists')
    .update(row)
    .eq('id', list.id)
    .eq('user_id', userId);
  if (error) throw error;
};

export const deleteList = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('word_lists')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
};

// ── Calendar entries ──────────────────────────────────────────────────────────

export const loadCalendarEntries = async (userId: string): Promise<CalendarEntries> => {
  const { data, error } = await supabase
    .from('calendar_entries')
    .select('entry_date, list_no')
    .eq('user_id', userId);
  if (error) throw error;
  const result: CalendarEntries = {};
  (data ?? []).forEach((row: any) => {
    if (!result[row.entry_date]) result[row.entry_date] = [];
    result[row.entry_date].push(row.list_no);
  });
  return result;
};

export const insertCalendarEntries = async (dates: string[], listNo: string, userId: string): Promise<void> => {
  const rows = dates.map((date) => ({ user_id: userId, entry_date: date, list_no: listNo }));
  const { error } = await supabase
    .from('calendar_entries')
    .upsert(rows, { onConflict: 'user_id,entry_date,list_no' });
  if (error) throw error;
};

export const removeCalendarEntry = async (date: string, listNo: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('calendar_entries')
    .delete()
    .eq('user_id', userId)
    .eq('entry_date', date)
    .eq('list_no', listNo);
  if (error) throw error;
};

export const removeAllCalendarEntriesForList = async (listNo: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('calendar_entries')
    .delete()
    .eq('user_id', userId)
    .eq('list_no', listNo);
  if (error) throw error;
};

// ── Checked list dates ────────────────────────────────────────────────────────

export const loadCheckedListDates = async (userId: string): Promise<CheckedListDates> => {
  const { data, error } = await supabase
    .from('checked_list_dates')
    .select('list_id, checked_date')
    .eq('user_id', userId);
  if (error) throw error;
  const result: CheckedListDates = {};
  (data ?? []).forEach((row: any) => {
    if (!result[row.list_id]) result[row.list_id] = [];
    result[row.list_id].push(row.checked_date);
  });
  return result;
};

export const insertCheckedListDate = async (listId: string, date: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('checked_list_dates')
    .insert({ user_id: userId, list_id: listId, checked_date: date });
  if (error) throw error;
};

export const removeCheckedListDate = async (listId: string, date: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('checked_list_dates')
    .delete()
    .eq('user_id', userId)
    .eq('list_id', listId)
    .eq('checked_date', date);
  if (error) throw error;
};

export const submitFeedback = async (text: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('feedback')
    .insert({ text, user_id: userId });
  if (error) throw error;
};

export const deleteUserAccount = async (): Promise<string | null> => {
  const { error } = await supabase.rpc('delete_user');
  return error?.message ?? null;
};

export async function uploadAudio(localUri: string, wordId: string, userId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `${userId}/${wordId}.m4a`;

  const { error } = await supabase.storage.from('EasyWordPremiumAudio').upload(path, blob, {
    contentType: 'audio/m4a',
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = await supabase.storage.from('EasyWordPremiumAudio').createSignedUrl(path, 60 * 60 * 24 * 365);
  if (!data?.signedUrl) throw new Error('Failed to get signed URL');
  return data.signedUrl;
}

export async function deleteAudio(wordId: string, userId: string): Promise<void> {
  const path = `${userId}/${wordId}.m4a`;
  await supabase.storage.from('EasyWordPremiumAudio').remove([path]);
  // Ignore errors — file may not exist in storage (local-only recording)
}
