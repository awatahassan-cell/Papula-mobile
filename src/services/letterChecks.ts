import { mockLetters } from '../data/mockLetters';
import { ChildProfile } from './types';
import { completedLetterIds } from './lessonPath';
import { localDay, shuffled, updateReview } from './learningEngine';
import { skillAttempt } from './foundationalLearning';

export function letterCheckDates(profile: ChildProfile, id: string): string[] {
  return [...new Set((profile.letterChecks?.[id]?.passDates || []).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)))];
}

export const letterRecognitionConfirmed = (profile: ChildProfile, id: string) => letterCheckDates(profile, id).length >= 2;

export function canCheckLetter(profile: ChildProfile, id: string, now = new Date()): boolean {
  return completedLetterIds(profile).includes(id) && !letterRecognitionConfirmed(profile, id)
    && profile.letterChecks?.[id]?.lastAttemptDate !== localDay(now);
}

/** Prefer a next-day review over a just-finished lesson. No success is inferred from old lesson saves. */
export function nextLetterCheck(profile: ChildProfile, now = new Date()) {
  return mockLetters.filter(letter => canCheckLetter(profile, letter.id, now))
    .sort((a, b) => {
      const before = profile.letterChecks?.[a.id]?.lastAttemptDate;
      const after = profile.letterChecks?.[b.id]?.lastAttemptDate;
      if (!!before !== !!after) return before ? -1 : 1;
      return (before || '').localeCompare(after || '');
    })[0];
}

export function letterCheckOptions(id: string) {
  const target = mockLetters.find(letter => letter.id === id);
  return target ? shuffled([target, ...shuffled(mockLetters.filter(letter => letter.id !== id)).slice(0, 2)]) : [];
}

export function applyLetterCheck(profile: ChildProfile, id: string, correct: boolean, now = new Date()): ChildProfile {
  if (!canCheckLetter(profile, id, now)) return profile;
  const today = localDay(now);
  const dates = letterCheckDates(profile, id);
  return { ...profile,
    letterChecks: { ...profile.letterChecks, [id]: { passDates: correct ? [...dates, today] : dates, lastAttemptDate: today } },
    letterReviews: { ...profile.letterReviews, [id]: updateReview(profile.letterReviews?.[id], correct, now) },
    skillProgress: { ...profile.skillProgress, recognition: skillAttempt(profile.skillProgress?.recognition, correct) },
  };
}
