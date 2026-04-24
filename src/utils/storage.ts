import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word, WordList, AppSettings, CalendarEntries, CheckedListDates } from '../types';

const WORDS_KEY = '@EasyWord:words';
const LISTS_KEY = '@EasyWord:lists';
const SETTINGS_KEY = '@EasyWord:settings';
const CALENDAR_KEY = '@EasyWord:calendar';
const CHECKED_LIST_DATES_KEY = '@EasyWord:checkedListDates';

export const saveWords = async (words: Word[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(WORDS_KEY, JSON.stringify(words));
  } catch (error) {
    console.error('Error saving words:', error);
    throw error;
  }
};

export const loadWords = async (): Promise<Word[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(WORDS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading words:', error);
    return [];
  }
};

export const saveLists = async (lists: WordList[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving lists:', error);
    throw error;
  }
};

export const loadLists = async (): Promise<WordList[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LISTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading lists:', error);
    return [];
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

const EN_ZH_DICT: AppSettings['installedDictionaries'][0] = {
  id: 'en-zh', sourceLang: 'en', targetLang: 'zh-CN',
  sourceName: 'English', targetName: 'Chinese', sourceFlag: '🇬🇧', targetFlag: '🇨🇳',
};

const DEFAULT_SETTINGS: AppSettings = {
  reviewIntervals: [1, 2, 4, 7],
  installedDictionaries: [EN_ZH_DICT],
  activeDictionaryId: 'en-zh',
};

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue == null) return DEFAULT_SETTINGS;
    const parsed: any = JSON.parse(jsonValue);

    // Migrate from old dictionaryLanguage field
    if (!parsed.installedDictionaries) {
      const legacyId: string = parsed.dictionaryLanguage ?? 'en-zh';
      const FR_ZH_DICT = { id: 'fr-zh', sourceLang: 'fr', targetLang: 'zh-CN', sourceName: 'French', targetName: 'Chinese', sourceFlag: '🇫🇷', targetFlag: '🇨🇳' };
      const legacyDict = legacyId === 'fr-zh' ? FR_ZH_DICT : EN_ZH_DICT;
      const installed = legacyId === 'fr-zh' ? [EN_ZH_DICT, FR_ZH_DICT] : [EN_ZH_DICT];
      parsed.installedDictionaries = installed;
      parsed.activeDictionaryId = legacyDict.id;
      delete parsed.dictionaryLanguage;
    }

    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveCalendarEntries = async (entries: CalendarEntries): Promise<void> => {
  try {
    await AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving calendar entries:', error);
  }
};

export const loadCalendarEntries = async (): Promise<CalendarEntries> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CALENDAR_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error loading calendar entries:', error);
    return {};
  }
};

export const saveCheckedListDates = async (data: CheckedListDates): Promise<void> => {
  try {
    await AsyncStorage.setItem(CHECKED_LIST_DATES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving checked list dates:', error);
  }
};

export const loadCheckedListDates = async (): Promise<CheckedListDates> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CHECKED_LIST_DATES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error loading checked list dates:', error);
    return {};
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([WORDS_KEY, LISTS_KEY, SETTINGS_KEY, CALENDAR_KEY, CHECKED_LIST_DATES_KEY]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
