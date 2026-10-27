import { ChildProfile, LearningSkill } from './types';
import { mockLetters } from '../data/mockLetters';
import { LEARNING_WORDS, updateReview } from './learningEngine';
import { knownWordId, isVocabId } from '../data/vocabulary';
import { skillAttempt } from './foundationalLearning';

/** Supported play is still an attempt, but cannot advance independent review or mark a word learned. */
export function applyPracticeResult(base: ChildProfile, letterIds: string[], correct: boolean, wordId?: string, skill?: LearningSkill, helped = false): ChildProfile {
  const reviews = { ...base.letterReviews };
  for (const id of new Set(helped ? [] : letterIds)) {
    if (mockLetters.some(letter => letter.id === id)) reviews[id] = updateReview(reviews[id], correct);
  }
  const validWord = correct && !helped && wordId && LEARNING_WORDS.some(word => word.id === wordId);
  const first = !!validWord && !base.learnedWordIds?.includes(wordId!);
  const domain = skill || (wordId ? 'word' : 'recognition');
  const reviewable = !helped && !!wordId && knownWordId(wordId);
  const firstPicture = correct && reviewable && isVocabId(wordId) && !base.wordReviews?.[wordId!];
  return { ...base, letterReviews: reviews,
    wordReviews: reviewable ? { ...base.wordReviews, [wordId!]: updateReview(base.wordReviews?.[wordId!], correct) } : base.wordReviews,
    skillProgress: { ...base.skillProgress, [domain]: skillAttempt(base.skillProgress?.[domain], correct, helped) },
    learnedWordIds: first ? [...(base.learnedWordIds || []), wordId!] : base.learnedWordIds,
    stars: base.stars + (first || firstPicture ? 1 : 0),
  };
}
