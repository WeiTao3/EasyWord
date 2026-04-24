import { Word, ReviewSchedule } from '../types';
import { addDays, getToday, isPastOrToday } from './dateUtils';

const DEFAULT_INTERVALS = [1, 2, 4, 7];

export const createInitialReviewSchedule = (dateAdded: string): ReviewSchedule => {
  return {
    nextReviewDate: addDays(dateAdded, DEFAULT_INTERVALS[0]),
    reviewCount: 0,
    reviewHistory: [],
  };
};

export const calculateNextReviewDate = (
  currentDate: string,
  reviewCount: number,
  intervals: number[] = DEFAULT_INTERVALS
): string | null => {
  if (reviewCount >= intervals.length) {
    return null;
  }
  return addDays(currentDate, intervals[reviewCount]);
};

export const markWordReviewed = (
  word: Word,
  reviewDate: string,
  intervals: number[] = DEFAULT_INTERVALS
): Word => {
  const newReviewCount = word.reviewSchedule.reviewCount + 1;
  const nextReviewDate = calculateNextReviewDate(reviewDate, newReviewCount, intervals);

  return {
    ...word,
    reviewSchedule: {
      nextReviewDate: nextReviewDate || '',
      reviewCount: newReviewCount,
      reviewHistory: [...word.reviewSchedule.reviewHistory, reviewDate],
    },
  };
};

export const getWordsDueForReview = (words: Word[]): Word[] => {
  const today = getToday();
  return words.filter((word) => {
    if (word.reviewSchedule.reviewCount >= DEFAULT_INTERVALS.length) {
      return false;
    }
    return isPastOrToday(word.reviewSchedule.nextReviewDate);
  });
};

export const isMastered = (word: Word): boolean => {
  return word.reviewSchedule.reviewCount >= DEFAULT_INTERVALS.length;
};

export const getReviewProgress = (word: Word): { current: number; total: number } => {
  return {
    current: word.reviewSchedule.reviewCount,
    total: DEFAULT_INTERVALS.length,
  };
};

export const getReviewStats = (
  words: Word[]
): {
  total: number;
  mastered: number;
  inProgress: number;
  dueToday: number;
} => {
  const mastered = words.filter(isMastered).length;
  const dueToday = getWordsDueForReview(words).length;
  const inProgress = words.length - mastered;

  return {
    total: words.length,
    mastered,
    inProgress,
    dueToday,
  };
};
