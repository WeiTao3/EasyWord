import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Word, WordList } from '../types';

const EXPORT_FILENAME = 'easyword_backup.json';

export interface ExportData {
  version: string;
  exportDate: string;
  words: Word[];
}

export const exportWords = async (words: Word[]): Promise<void> => {
  try {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      words,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const file = new File(Paths.document, EXPORT_FILENAME);

    await file.write(jsonString);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export EasyWord Vocabulary',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const exportWordsAsText = async (words: Word[], lists: WordList[]): Promise<void> => {
  try {
    const date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const lines: string[] = [`EasyWord Vocabulary Export — ${date}`, ''];

    // Group words by list
    const listMap = new Map<string, WordList>();
    lists.forEach((l) => listMap.set(l.id, l));

    const byList = new Map<string, Word[]>();
    words.forEach((w) => {
      const group = byList.get(w.listId) ?? [];
      group.push(w);
      byList.set(w.listId, group);
    });

    // Words not belonging to any known list
    const knownListIds = new Set(lists.map((l) => l.id));
    const ungrouped = words.filter((w) => !knownListIds.has(w.listId));

    // Write each list section
    const orderedLists = lists.slice().sort(
      (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );

    for (const list of orderedLists) {
      const listWords = byList.get(list.id);
      if (!listWords || listWords.length === 0) continue;

      const header = list.listNo ? `${list.name}  #${list.listNo}` : list.name;
      lines.push(`=== ${header} ===`);

      listWords.forEach((w, i) => {
        const pronunciation = w.pronunciation ? `  [${w.pronunciation}]` : '';
        lines.push(`${i + 1}. ${w.word}${pronunciation}`);
        lines.push(`   ${w.meaning}`);
        if (w.source) lines.push(`   (${w.source})`);
        lines.push('');
      });
    }

    if (ungrouped.length > 0) {
      lines.push('=== Uncategorised ===');
      ungrouped.forEach((w, i) => {
        const pronunciation = w.pronunciation ? `  [${w.pronunciation}]` : '';
        lines.push(`${i + 1}. ${w.word}${pronunciation}`);
        lines.push(`   ${w.meaning}`);
        if (w.source) lines.push(`   (${w.source})`);
        lines.push('');
      });
    }

    const text = lines.join('\n');
    const file = new File(Paths.document, 'easyword_vocabulary.txt');
    await file.write(text);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Vocabulary as Text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Text export error:', error);
    throw error;
  }
};

export const importWords = async (): Promise<Word[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      throw new Error('No file selected');
    }

    const fileUri = result.assets[0].uri;
    const file = new File(fileUri);
    const content = await file.text();

    const data = JSON.parse(content);

    if (data.words && Array.isArray(data.words)) {
      return validateImportedWords(data.words);
    }

    if (Array.isArray(data)) {
      return validateImportedWords(data);
    }

    throw new Error('Invalid file format');
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
};

const validateImportedWords = (words: unknown[]): Word[] => {
  return words
    .filter((item): item is Word => {
      if (typeof item !== 'object' || item === null) return false;
      const word = item as Record<string, unknown>;
      return (
        typeof word.id === 'string' &&
        typeof word.word === 'string' &&
        typeof word.meaning === 'string'
      );
    })
    .map((word) => ({
      id: word.id,
      word: word.word,
      meaning: word.meaning,
      pronunciation: word.pronunciation || '',
      source: word.source || '',
      dateAdded: word.dateAdded || new Date().toISOString().split('T')[0],
      audioUri: word.audioUri || null,
      listId: (word.listId as string) || 'default',
      reviewSchedule: word.reviewSchedule || {
        nextReviewDate: new Date().toISOString().split('T')[0],
        reviewCount: 0,
        reviewHistory: [],
      },
    }));
};
