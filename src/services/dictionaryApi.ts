import { DictionaryResult } from '../types';

// Youdao Dictionary – English to Chinese
const YOUDAO_API = 'https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4';

// Google Translate unofficial endpoint – no API key, works for any word/phrase
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

// MyMemory – free translation API, used for non-en-zh pairs
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

interface YoudaoResponse {
  ec?: {
    word?: Array<{
      trs?: Array<{
        pos?: string;
        tr: Array<{
          l: { i: string[] };
        }>;
      }>;
      ukphone?: string;
      usphone?: string;
      phone?: string;
    }>;
  };
}

interface MyMemoryResponse {
  responseData: {
    translatedText: string;
  };
  matches?: Array<{
    translation: string;
    segment: string;
    quality: number;
  }>;
}

export const lookupWord = async (
  word: string,
  sourceLang: string = 'en',
  targetLang: string = 'zh-CN'
): Promise<DictionaryResult | null> => {
  // English → Chinese: Youdao (structured dictionary) → Google Translate (neural, any word)
  if (sourceLang === 'en' && targetLang === 'zh-CN') {
    const youdao = await youdaoLookup(word);
    if (youdao) return youdao;
    return await googleTranslateLookup(word, 'en', 'zh-CN');
  }
  // Other pairs: Google Translate → MyMemory fallback
  const google = await googleTranslateLookup(word, sourceLang, targetLang);
  if (google) return google;
  return await myMemoryLookup(word, `${sourceLang}|${targetLang}`);
};

// Primary for en-zh: Youdao English–Chinese dictionary
const youdaoLookup = async (word: string): Promise<DictionaryResult | null> => {
  try {
    const response = await fetch(
      `${YOUDAO_API}&q=${encodeURIComponent(word.trim())}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) return null;

    const data: YoudaoResponse = await response.json();
    const ecWord = data.ec?.word?.[0];
    if (!ecWord?.trs || ecWord.trs.length === 0) return null;

    // Pronunciation
    const pronunciation = ecWord.ukphone
      ? `/${ecWord.ukphone}/`
      : ecWord.usphone
        ? `/${ecWord.usphone}/`
        : ecWord.phone
          ? `/${ecWord.phone}/`
          : '';

    // Chinese definitions, prefixed with part of speech when available
    const meanings: string[] = [];
    for (const entry of ecWord.trs) {
      const chinese = entry.tr?.[0]?.l?.i?.join('') ?? '';
      if (!chinese) continue;
      const definition = entry.pos ? `${entry.pos} ${chinese}` : chinese;
      if (!meanings.includes(definition)) {
        meanings.push(definition);
      }
    }

    if (meanings.length === 0) return null;

    return {
      word: word.trim(),
      pronunciation,
      meanings: meanings.slice(0, 8),
      audioUrl: undefined,
    };
  } catch {
    return null;
  }
};

// Google Translate unofficial endpoint – handles any word/phrase including rare/made-up words
const googleTranslateLookup = async (
  word: string,
  sourceLang: string,
  targetLang: string
): Promise<DictionaryResult | null> => {
  try {
    const url =
      `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${sourceLang}&tl=${targetLang}` +
      `&dt=t&dt=bd&q=${encodeURIComponent(word.trim())}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    // data[0]: [[translatedChunk, originalChunk, ...], ...]
    const mainTranslation: string = (data[0] as any[][])
      ?.map((chunk) => chunk[0] ?? '')
      .join('')
      .trim();

    if (!mainTranslation) return null;

    // data[5]: dictionary entries [[pos, [word, ...], ...], ...]
    const meanings: string[] = [];
    const seen = new Set<string>();

    const dictEntries = data[5] as any[][] | null;
    if (Array.isArray(dictEntries)) {
      for (const entry of dictEntries) {
        const pos: string = entry[0] ?? '';
        const words: string[] = entry[2]?.map((w: any[]) => w[0]).filter(Boolean) ?? [];
        for (const w of words.slice(0, 3)) {
          const meaning = pos ? `${pos} ${w}` : w;
          if (!seen.has(meaning)) {
            seen.add(meaning);
            meanings.push(meaning);
          }
        }
      }
    }

    // Always include the main translation
    if (!seen.has(mainTranslation)) {
      meanings.unshift(mainTranslation);
    }

    return {
      word: word.trim(),
      pronunciation: '',
      meanings: meanings.slice(0, 8),
      audioUrl: undefined,
    };
  } catch {
    return null;
  }
};

// Used as final fallback for non-en-zh language pairs
const myMemoryLookup = async (
  word: string,
  langpair: string
): Promise<DictionaryResult | null> => {
  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(word.trim())}&langpair=${langpair}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: MyMemoryResponse = await response.json();

    // Collect unique translations from matches
    const seen = new Set<string>();
    const meanings: string[] = [];

    const sorted = (data.matches ?? [])
      .filter((m) => m.quality > 50 && m.translation !== m.segment)
      .sort((a, b) => b.quality - a.quality);

    for (const match of sorted) {
      const t = match.translation.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        meanings.push(t);
        if (meanings.length >= 5) break;
      }
    }

    // Always include the primary translation if not already present
    const primary = data.responseData?.translatedText?.trim();
    if (primary && !seen.has(primary)) {
      meanings.unshift(primary);
    }

    if (meanings.length === 0) return null;

    return {
      word: word.trim(),
      pronunciation: '',
      meanings: meanings.slice(0, 6),
      audioUrl: undefined,
    };
  } catch {
    return null;
  }
};
