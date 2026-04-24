import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Word } from '../types';
import { formatDateShort } from '../utils/dateUtils';
import { getReviewProgress, isMastered } from '../utils/spacedRepetition';
import AudioPlayer from './AudioPlayer';

interface WordCardProps {
  word: Word;
  onPress?: () => void;
  onDelete?: () => void;
  onRecord?: () => void;
  showActions?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({
  word,
  onPress,
  onDelete,
  onRecord,
  showActions = true,
}) => {
  const progress = getReviewProgress(word);
  const mastered = isMastered(word);

  const handleDelete = () => {
    Alert.alert(
      'Delete Word',
      `Are you sure you want to delete "${word.word}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.wordContainer}>
          <Text style={styles.word}>{word.word}</Text>
          {word.pronunciation && (
            <Text style={styles.pronunciation}>{word.pronunciation}</Text>
          )}
        </View>
        <View style={styles.statusContainer}>
          {mastered ? (
            <View style={styles.masteredBadge}>
              <Text style={styles.masteredText}>Mastered</Text>
            </View>
          ) : (
            <Text style={styles.progressText}>
              {progress.current}/{progress.total}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.meaning} numberOfLines={3}>
        {word.meaning}
      </Text>

      {word.source && (
        <Text style={styles.source}>Source: {word.source}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>Added: {formatDateShort(word.dateAdded)}</Text>

        {showActions && (
          <View style={styles.actions}>
            {word.audioUri && (
              <AudioPlayer uri={word.audioUri} compact />
            )}
            {onRecord && (
              <TouchableOpacity style={styles.actionButton} onPress={onRecord}>
                <Text style={styles.actionText}>
                  {word.audioUri ? '🔄' : '🎙️'}
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wordContainer: {
    flex: 1,
  },
  word: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pronunciation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    marginLeft: 8,
  },
  masteredBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  meaning: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  source: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 18,
  },
});

export default WordCard;
