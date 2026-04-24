export interface ReviewSchedule {
  nextReviewDate: string;
  reviewCount: number;
  reviewHistory: string[];
}

export interface Word {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  source: string;
  dateAdded: string;
  audioUri: string | null;
  reviewSchedule: ReviewSchedule;
  listId: string;
}

export interface WordList {
  id: string;
  name: string;
  description?: string;
  dateCreated: string;
  listNo?: string;
}

export interface InstalledDictionary {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceName: string;
  targetName: string;
  sourceFlag: string;
  targetFlag: string;
}

export interface AppSettings {
  reviewIntervals: number[];
  installedDictionaries: InstalledDictionary[];
  activeDictionaryId: string;
}

export type CalendarEntries = { [date: string]: string[] };

// listId -> array of dates it has been checked on
export type CheckedListDates = { [listId: string]: string[] };

export interface AppState {
  words: Word[];
  lists: WordList[];
  settings: AppSettings;
  calendarEntries: CalendarEntries;
  checkedListDates: CheckedListDates;
}

export type AppAction =
  | { type: 'ADD_WORD'; payload: Word }
  | { type: 'UPDATE_WORD'; payload: Word }
  | { type: 'DELETE_WORD'; payload: string }
  | { type: 'LOAD_WORDS'; payload: Word[] }
  | { type: 'MARK_REVIEWED'; payload: { id: string; date: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'IMPORT_WORDS'; payload: Word[] }
  | { type: 'ADD_LIST'; payload: WordList }
  | { type: 'UPDATE_LIST'; payload: WordList }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'LOAD_LISTS'; payload: WordList[] }
  | { type: 'ADD_CALENDAR_ENTRIES'; payload: { dates: string[]; listNo: string } }
  | { type: 'REMOVE_CALENDAR_ENTRY'; payload: { date: string; listNo: string } }
  | { type: 'REMOVE_ALL_CALENDAR_ENTRIES_FOR_LIST'; payload: string }
  | { type: 'LOAD_CALENDAR_ENTRIES'; payload: CalendarEntries }
  | { type: 'TOGGLE_LIST_DATE_CHECK'; payload: { listId: string; date: string } }
  | { type: 'LOAD_CHECKED_LIST_DATES'; payload: CheckedListDates }
  | { type: 'RESET_STATE' };

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
}

export interface DictionaryResult {
  word: string;
  pronunciation: string;
  meanings: string[];
  audioUrl?: string;
}
