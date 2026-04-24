import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { lookupWord } from '../services/dictionaryApi';
import { DictionaryResult } from '../types';

interface DictionaryLookupProps {
  word: string;
  onResultSelect: (result: { meaning: string; pronunciation: string }) => void;
}

const DictionaryLookup: React.FC<DictionaryLookupProps> = ({
  word,
  onResultSelect,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!word.trim()) {
      setError('Please enter a word first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await lookupWord(word);
      if (data) {
        setResult(data);
      } else {
        setError('Word not found in dictionary');
      }
    } catch (err) {
      setError('Failed to look up word. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    if (result) {
      onResultSelect({
        meaning: result.meanings.join('\n'),
        pronunciation: result.pronunciation,
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.lookupButton}
        onPress={handleLookup}
        disabled={isLoading || !word.trim()}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={styles.lookupIcon}>📖</Text>
            <Text style={styles.lookupText}>Look Up</Text>
          </>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultWord}>{result.word}</Text>
            {result.pronunciation && (
              <Text style={styles.resultPronunciation}>
                {result.pronunciation}
              </Text>
            )}
          </View>

          <View style={styles.meaningsContainer}>
            {result.meanings.map((meaning, index) => (
              <Text key={index} style={styles.meaning}>
                {meaning}
              </Text>
            ))}
          </View>

          <TouchableOpacity style={styles.useButton} onPress={handleSelect}>
            <Text style={styles.useButtonText}>Use This Definition</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  lookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  lookupIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  lookupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  resultPronunciation: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  meaningsContainer: {
    marginBottom: 12,
  },
  meaning: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 6,
  },
  useButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DictionaryLookup;
