import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { Word, WordList, AppState, AppAction, AppSettings, CalendarEntries, CheckedListDates } from '../types';
import * as db from '../services/supabaseDataService';
import { saveSettings, loadSettings } from '../utils/storage';
import { createInitialReviewSchedule, markWordReviewed } from '../utils/spacedRepetition';
import { generateId, getToday, getNow, addDays } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

const initialState: AppState = {
  words: [],
  lists: [],
  settings: {
    reviewIntervals: [1, 2, 4, 7],
    installedDictionaries: [
      { id: 'en-zh', sourceLang: 'en', targetLang: 'zh-CN', sourceName: 'English', targetName: 'Chinese', sourceFlag: '🇬🇧', targetFlag: '🇨🇳' },
    ],
    activeDictionaryId: 'en-zh',
  },
  calendarEntries: {},
  checkedListDates: {},
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_WORD':
      return { ...state, words: [...state.words, action.payload] };
    case 'UPDATE_WORD':
      return { ...state, words: state.words.map((w) => (w.id === action.payload.id ? action.payload : w)) };
    case 'DELETE_WORD':
      return { ...state, words: state.words.filter((w) => w.id !== action.payload) };
    case 'LOAD_WORDS':
      return { ...state, words: action.payload };
    case 'MARK_REVIEWED':
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.payload.id
            ? markWordReviewed(w, action.payload.date, state.settings.reviewIntervals)
            : w
        ),
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'IMPORT_WORDS': {
      const existingIds = new Set(state.words.map((w) => w.id));
      return { ...state, words: [...state.words, ...action.payload.filter((w) => !existingIds.has(w.id))] };
    }
    case 'ADD_LIST':
      return { ...state, lists: [...state.lists, action.payload] };
    case 'UPDATE_LIST':
      return { ...state, lists: state.lists.map((l) => (l.id === action.payload.id ? action.payload : l)) };
    case 'DELETE_LIST': {
      const remainingLists = state.lists.filter((l) => l.id !== action.payload);
      const fallbackId = remainingLists.length > 0
        ? [...remainingLists].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0].id
        : '';
      return {
        ...state,
        lists: remainingLists,
        words: state.words.map((w) => w.listId === action.payload ? { ...w, listId: fallbackId } : w),
      };
    }
    case 'LOAD_LISTS':
      return { ...state, lists: action.payload };
    case 'ADD_CALENDAR_ENTRIES': {
      const { dates, listNo } = action.payload;
      const updated = { ...state.calendarEntries };
      dates.forEach((date) => {
        const existing = updated[date] || [];
        if (!existing.includes(listNo)) updated[date] = [...existing, listNo];
      });
      return { ...state, calendarEntries: updated };
    }
    case 'REMOVE_CALENDAR_ENTRY': {
      const { date, listNo } = action.payload;
      const updated = { ...state.calendarEntries };
      updated[date] = (updated[date] || []).filter((n) => n !== listNo);
      if (updated[date].length === 0) delete updated[date];
      return { ...state, calendarEntries: updated };
    }
    case 'REMOVE_ALL_CALENDAR_ENTRIES_FOR_LIST': {
      const listNo = action.payload;
      const updated: typeof state.calendarEntries = {};
      for (const [date, nos] of Object.entries(state.calendarEntries)) {
        const filtered = nos.filter((n) => n !== listNo);
        if (filtered.length > 0) updated[date] = filtered;
      }
      return { ...state, calendarEntries: updated };
    }
    case 'LOAD_CALENDAR_ENTRIES':
      return { ...state, calendarEntries: action.payload };
    case 'TOGGLE_LIST_DATE_CHECK': {
      const { listId, date } = action.payload;
      const existing = state.checkedListDates[listId] || [];
      const alreadyChecked = existing.includes(date);
      return {
        ...state,
        checkedListDates: {
          ...state.checkedListDates,
          [listId]: alreadyChecked ? existing.filter((d) => d !== date) : [...existing, date],
        },
      };
    }
    case 'LOAD_CHECKED_LIST_DATES':
      return { ...state, checkedListDates: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

interface WordContextType {
  state: AppState;
  addWord: (wordData: Omit<Word, 'id' | 'reviewSchedule'>) => Promise<void>;
  updateWord: (word: Word) => Promise<void>;
  deleteWord: (id: string, audioUri?: string | null) => Promise<void>;
  markReviewed: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importWords: (words: Word[]) => void;
  addList: (data: Omit<WordList, 'id' | 'dateCreated'>) => Promise<WordList>;
  updateList: (list: WordList) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addCalendarEntries: (listNo: string, dates: string[]) => Promise<void>;
  moveCalendarEntry: (listNo: string, fromDate: string, toDate: string) => Promise<void>;
  removeCalendarBatch: (listNo: string, viewDate: string) => Promise<void>;
  toggleListDateCheck: (listId: string, date: string) => Promise<void>;
  refreshCalendarData: () => Promise<void>;
  cleanupOrphanedCalendarEntries: () => Promise<void>;
  refreshListsData: () => Promise<void>;
  submitFeedback: (text: string) => Promise<void>;
  isLoading: boolean;
}

const WordContext = createContext<WordContextType | undefined>(undefined);

export const WordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load settings from local storage on mount (independent of auth)
  useEffect(() => {
    loadSettings().then((settings) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    }).catch(console.error);
  }, []);

  // Load all data when user signs in; reset when signed out
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'RESET_STATE' });
      setIsLoading(false);
      return;
    }
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [words, lists, calendarEntries, checkedListDates] = await Promise.all([
          db.loadWords(user.id),
          db.loadLists(user.id),
          db.loadCalendarEntries(user.id),
          db.loadCheckedListDates(user.id),
        ]);
        dispatch({ type: 'LOAD_WORDS', payload: words });
        dispatch({ type: 'LOAD_LISTS', payload: lists });
        dispatch({ type: 'LOAD_CALENDAR_ENTRIES', payload: calendarEntries });
        dispatch({ type: 'LOAD_CHECKED_LIST_DATES', payload: checkedListDates });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const addWord = async (wordData: Omit<Word, 'id' | 'reviewSchedule'>) => {
    if (!user) return;
    const newWord: Word = {
      ...wordData,
      id: generateId(),
      reviewSchedule: createInitialReviewSchedule(wordData.dateAdded),
    };
    const saved = await db.insertWord(newWord, user.id);
    dispatch({ type: 'ADD_WORD', payload: saved });
  };

  const updateWord = async (word: Word) => {
    if (!user) return;
    await db.updateWord(word, user.id);
    dispatch({ type: 'UPDATE_WORD', payload: word });
  };

  const deleteWord = async (id: string, audioUri?: string | null) => {
    if (!user) return;
    if (audioUri?.startsWith('https://')) {
      await db.deleteAudio(id, user.id).catch(() => {});
    }
    await db.deleteWord(id, user.id);
    dispatch({ type: 'DELETE_WORD', payload: id });
  };

  const markReviewed = async (id: string) => {
    if (!user) return;
    const today = getToday();
    const word = state.words.find((w) => w.id === id);
    if (!word) return;
    const updated = markWordReviewed(word, today, state.settings.reviewIntervals);
    await db.updateWord(updated, user.id);
    dispatch({ type: 'UPDATE_WORD', payload: updated });
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    saveSettings({ ...state.settings, ...settings }).catch(console.error);
  };

  const importWords = (words: Word[]) =>
    dispatch({ type: 'IMPORT_WORDS', payload: words });

  const addList = async (data: Omit<WordList, 'id' | 'dateCreated'>): Promise<WordList> => {
    if (!user) throw new Error('Not authenticated');
    const newList: WordList = { ...data, id: generateId(), dateCreated: getNow() };
    const saved = await db.insertList(newList, user.id);
    dispatch({ type: 'ADD_LIST', payload: saved });
    return saved;
  };

  const updateList = async (list: WordList) => {
    if (!user) return;
    await db.updateList(list, user.id);
    dispatch({ type: 'UPDATE_LIST', payload: list });
  };

  const deleteList = async (id: string) => {
    if (!user) return;
    const remainingLists = state.lists.filter((l) => l.id !== id);
    const fallbackId = remainingLists.length > 0
      ? [...remainingLists].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0].id
      : null;
    await db.reassignWords(id, fallbackId, user.id);
    await db.deleteList(id, user.id);
    dispatch({ type: 'DELETE_LIST', payload: id });
  };

  const addCalendarEntries = async (listNo: string, dates: string[]) => {
    if (!user) return;
    await db.insertCalendarEntries(dates, listNo, user.id);
    dispatch({ type: 'ADD_CALENDAR_ENTRIES', payload: { listNo, dates } });
  };

  const removeCalendarBatch = async (listNo: string, viewDate: string) => {
    if (!user) return;
    const offsets = state.settings.reviewIntervals;

    // Get all dates where this listNo is scheduled
    const allListDates = Object.entries(state.calendarEntries)
      .filter(([, nos]) => nos.includes(listNo))
      .map(([date]) => date);

    // For each possible offset, compute a candidate origin and score how many
    // of its expected batch dates actually exist in the calendar
    let bestBatch: string[] = [];
    let bestScore = -1;

    for (const offset of offsets) {
      const origin = addDays(viewDate, -offset);
      const batchDates = offsets.map((o) => addDays(origin, o));
      const matched = batchDates.filter((d) => allListDates.includes(d));
      if (matched.length > bestScore) {
        bestScore = matched.length;
        bestBatch = matched;
      }
    }

    // Fallback: just remove the view date
    if (bestBatch.length === 0) bestBatch = [viewDate];

    await Promise.all(bestBatch.map((date) => db.removeCalendarEntry(date, listNo, user.id)));
    for (const date of bestBatch) {
      dispatch({ type: 'REMOVE_CALENDAR_ENTRY', payload: { date, listNo } });
    }
  };

  const moveCalendarEntry = async (listNo: string, fromDate: string, toDate: string) => {
    if (!user) return;
    await db.removeCalendarEntry(fromDate, listNo, user.id);
    await db.insertCalendarEntries([toDate], listNo, user.id);
    dispatch({ type: 'REMOVE_CALENDAR_ENTRY', payload: { date: fromDate, listNo } });
    dispatch({ type: 'ADD_CALENDAR_ENTRIES', payload: { listNo, dates: [toDate] } });
  };

  const refreshCalendarData = async () => {
    if (!user) return;
    const [calendarEntries, checkedListDates] = await Promise.all([
      db.loadCalendarEntries(user.id),
      db.loadCheckedListDates(user.id),
    ]);
    // Remove entries whose listNo no longer corresponds to any list
    const validListNos = new Set(state.lists.map((l) => l.listNo).filter(Boolean) as string[]);
    const staleListNos = new Set<string>();
    Object.values(calendarEntries).forEach((nos) =>
      nos.forEach((no) => { if (!validListNos.has(no)) staleListNos.add(no); })
    );
    if (staleListNos.size > 0) {
      await Promise.all(Array.from(staleListNos).map((no) => db.removeAllCalendarEntriesForList(no, user.id)));
      for (const date of Object.keys(calendarEntries)) {
        calendarEntries[date] = calendarEntries[date].filter((no) => !staleListNos.has(no));
        if (calendarEntries[date].length === 0) delete calendarEntries[date];
      }
    }
    dispatch({ type: 'LOAD_CALENDAR_ENTRIES', payload: calendarEntries });
    dispatch({ type: 'LOAD_CHECKED_LIST_DATES', payload: checkedListDates });
  };

  const refreshListsData = async () => {
    if (!user) return;
    const [words, lists] = await Promise.all([
      db.loadWords(user.id),
      db.loadLists(user.id),
    ]);
    dispatch({ type: 'LOAD_WORDS', payload: words });
    dispatch({ type: 'LOAD_LISTS', payload: lists });
  };

  const cleanupOrphanedCalendarEntries = async () => {
    if (!user) return;
    const validListNos = new Set(state.lists.map((l) => l.listNo).filter(Boolean) as string[]);
    const staleListNos = new Set<string>();
    Object.values(state.calendarEntries).forEach((nos) =>
      nos.forEach((no) => { if (!validListNos.has(no)) staleListNos.add(no); })
    );
    if (staleListNos.size === 0) return;
    await Promise.all(Array.from(staleListNos).map((no) => db.removeAllCalendarEntriesForList(no, user.id)));
    staleListNos.forEach((no) =>
      dispatch({ type: 'REMOVE_ALL_CALENDAR_ENTRIES_FOR_LIST', payload: no })
    );
  };

  const submitFeedback = async (text: string) => {
    if (!user) return;
    await db.submitFeedback(text, user.id);
  };

  const toggleListDateCheck = async (listId: string, date: string) => {
    if (!user) return;
    const existing = state.checkedListDates[listId] || [];
    const alreadyChecked = existing.includes(date);
    if (alreadyChecked) {
      await db.removeCheckedListDate(listId, date, user.id);
    } else {
      await db.insertCheckedListDate(listId, date, user.id);
    }
    dispatch({ type: 'TOGGLE_LIST_DATE_CHECK', payload: { listId, date } });
  };

  return (
    <WordContext.Provider value={{
      state, addWord, updateWord, deleteWord, markReviewed,
      updateSettings, importWords, addList, updateList, deleteList,
      addCalendarEntries, moveCalendarEntry, removeCalendarBatch, toggleListDateCheck,
      refreshCalendarData, cleanupOrphanedCalendarEntries, refreshListsData, submitFeedback, isLoading,
    }}>
      {children}
    </WordContext.Provider>
  );
};

export const useWords = (): WordContextType => {
  const context = useContext(WordContext);
  if (!context) throw new Error('useWords must be used within a WordProvider');
  return context;
};
