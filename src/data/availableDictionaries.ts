export interface AvailableDictionary {
  id: string;
  sourceLang: string;  // MyMemory / Youdao source code
  targetLang: string;  // MyMemory / Youdao target code
  sourceName: string;
  targetName: string;
  sourceFlag: string;
  targetFlag: string;
}

// All dictionaries are backed by MyMemory (free translation API).
// The 'en-zh' pair also uses Youdao as a higher-quality primary source.
const AVAILABLE_DICTIONARIES: AvailableDictionary[] = [
  // → Chinese
  { id: 'en-zh', sourceLang: 'en', targetLang: 'zh-CN', sourceName: 'English',    targetName: 'Chinese',    sourceFlag: '🇬🇧', targetFlag: '🇨🇳' },
  { id: 'fr-zh', sourceLang: 'fr', targetLang: 'zh-CN', sourceName: 'French',     targetName: 'Chinese',    sourceFlag: '🇫🇷', targetFlag: '🇨🇳' },
  { id: 'de-zh', sourceLang: 'de', targetLang: 'zh-CN', sourceName: 'German',     targetName: 'Chinese',    sourceFlag: '🇩🇪', targetFlag: '🇨🇳' },
  { id: 'es-zh', sourceLang: 'es', targetLang: 'zh-CN', sourceName: 'Spanish',    targetName: 'Chinese',    sourceFlag: '🇪🇸', targetFlag: '🇨🇳' },
  { id: 'it-zh', sourceLang: 'it', targetLang: 'zh-CN', sourceName: 'Italian',    targetName: 'Chinese',    sourceFlag: '🇮🇹', targetFlag: '🇨🇳' },
  { id: 'pt-zh', sourceLang: 'pt', targetLang: 'zh-CN', sourceName: 'Portuguese', targetName: 'Chinese',    sourceFlag: '🇵🇹', targetFlag: '🇨🇳' },
  { id: 'ja-zh', sourceLang: 'ja', targetLang: 'zh-CN', sourceName: 'Japanese',   targetName: 'Chinese',    sourceFlag: '🇯🇵', targetFlag: '🇨🇳' },
  { id: 'ko-zh', sourceLang: 'ko', targetLang: 'zh-CN', sourceName: 'Korean',     targetName: 'Chinese',    sourceFlag: '🇰🇷', targetFlag: '🇨🇳' },
  { id: 'ru-zh', sourceLang: 'ru', targetLang: 'zh-CN', sourceName: 'Russian',    targetName: 'Chinese',    sourceFlag: '🇷🇺', targetFlag: '🇨🇳' },
  { id: 'ar-zh', sourceLang: 'ar', targetLang: 'zh-CN', sourceName: 'Arabic',     targetName: 'Chinese',    sourceFlag: '🇸🇦', targetFlag: '🇨🇳' },
  // → English
  { id: 'fr-en', sourceLang: 'fr', targetLang: 'en',    sourceName: 'French',     targetName: 'English',    sourceFlag: '🇫🇷', targetFlag: '🇬🇧' },
  { id: 'de-en', sourceLang: 'de', targetLang: 'en',    sourceName: 'German',     targetName: 'English',    sourceFlag: '🇩🇪', targetFlag: '🇬🇧' },
  { id: 'es-en', sourceLang: 'es', targetLang: 'en',    sourceName: 'Spanish',    targetName: 'English',    sourceFlag: '🇪🇸', targetFlag: '🇬🇧' },
  { id: 'ja-en', sourceLang: 'ja', targetLang: 'en',    sourceName: 'Japanese',   targetName: 'English',    sourceFlag: '🇯🇵', targetFlag: '🇬🇧' },
  { id: 'ko-en', sourceLang: 'ko', targetLang: 'en',    sourceName: 'Korean',     targetName: 'English',    sourceFlag: '🇰🇷', targetFlag: '🇬🇧' },
  { id: 'ru-en', sourceLang: 'ru', targetLang: 'en',    sourceName: 'Russian',    targetName: 'English',    sourceFlag: '🇷🇺', targetFlag: '🇬🇧' },
  { id: 'pt-en', sourceLang: 'pt', targetLang: 'en',    sourceName: 'Portuguese', targetName: 'English',    sourceFlag: '🇵🇹', targetFlag: '🇬🇧' },
  // → French
  { id: 'en-fr', sourceLang: 'en', targetLang: 'fr',    sourceName: 'English',    targetName: 'French',     sourceFlag: '🇬🇧', targetFlag: '🇫🇷' },
  { id: 'es-fr', sourceLang: 'es', targetLang: 'fr',    sourceName: 'Spanish',    targetName: 'French',     sourceFlag: '🇪🇸', targetFlag: '🇫🇷' },
  { id: 'de-fr', sourceLang: 'de', targetLang: 'fr',    sourceName: 'German',     targetName: 'French',     sourceFlag: '🇩🇪', targetFlag: '🇫🇷' },
  // → Spanish
  { id: 'en-es', sourceLang: 'en', targetLang: 'es',    sourceName: 'English',    targetName: 'Spanish',    sourceFlag: '🇬🇧', targetFlag: '🇪🇸' },
  { id: 'fr-es', sourceLang: 'fr', targetLang: 'es',    sourceName: 'French',     targetName: 'Spanish',    sourceFlag: '🇫🇷', targetFlag: '🇪🇸' },
  // → Japanese / Korean
  { id: 'en-ja', sourceLang: 'en', targetLang: 'ja',    sourceName: 'English',    targetName: 'Japanese',   sourceFlag: '🇬🇧', targetFlag: '🇯🇵' },
  { id: 'en-ko', sourceLang: 'en', targetLang: 'ko',    sourceName: 'English',    targetName: 'Korean',     sourceFlag: '🇬🇧', targetFlag: '🇰🇷' },
];

export default AVAILABLE_DICTIONARIES;
