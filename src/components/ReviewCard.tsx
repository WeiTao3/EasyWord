import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Word } from '../types';
import { getReviewProgress } from '../utils/spacedRepetition';
import AudioPlayer from './AudioPlayer';

interface ReviewCardProps {
  word: Word;
  onMarkReviewed: () => void;
  onSkip: () => void;
}

const { width } = Dimensions.get('window');

const ReviewCard: React.FC<ReviewCardProps> = ({
  word,
  onMarkReviewed,
  onSkip,
}) => {
  const [showMeaning, setShowMeaning] = useState(false);
  const progress = getReviewProgress(word);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Review {progress.current + 1} of {progress.total}
          </Text>
        </View>

        <View style={styles.wordSection}>
          <Text style={styles.word}>{word.word}</Text>
          {word.pronunciation && (
            <Text style={styles.pronunciation}>{word.pronunciation}</Text>
          )}
        </View>

        {word.audioUri && (
          <View style={styles.audioSection}>
            <AudioPlayer uri={word.audioUri} />
          </View>
        )}

        <TouchableOpacity
          style={styles.revealButton}
          onPress={() => setShowMeaning(!showMeaning)}
        >
          <Text style={styles.revealButtonText}>
            {showMeaning ? 'Hide Meaning' : 'Show Meaning'}
          </Text>
        </TouchableOpacity>

        {showMeaning && (
          <View style={styles.meaningSection}>
            <Text style={styles.meaning}>{word.meaning}</Text>
            {word.source && (
              <Text style={styles.source}>Source: {word.source}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviewedButton}
          onPress={onMarkReviewed}
        >
          <Text style={styles.reviewedText}>I Know This</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  word: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  pronunciation: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  revealButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  revealButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  meaningSection: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
  },
  meaning: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    textAlign: 'center',
  },
  source: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 16,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewedButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewCard;
