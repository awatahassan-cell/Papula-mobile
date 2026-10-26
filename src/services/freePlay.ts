import { ChildProfile } from './types';
import { LEARNING_WORDS, LearningWord } from './learningEngine';
import { completedLetterIds } from './lessonPath';

export type FreePlayId = 'pairs' | 'catch' | 'train';
/** Free-play games open as the child learns letters; each also needs enough known words or letters to be worth playing. */
export const FREE_PLAY: { id: FreePlayId; minLetters: number }[] = [
  { id: 'pairs', minLetters: 3 }, { id: 'catch', minLetters: 4 }, { id: 'train', minLetters: 6 },
];

const hasPicture = (word: LearningWord) => !!word.imageEmoji;
type CanSpeak = (text: string) => boolean;
/** Picture words whose first letter the child has learned (what the pairs game shows). */
export function pairWords(profile: ChildProfile, canSpeak: CanSpeak = () => true): LearningWord[] {
  const known = new Set(completedLetterIds(profile));
  return LEARNING_WORDS.filter(word => hasPicture(word) && known.has(word.letterIds[0]) && canSpeak(word.word));
}
/** Short picture words built only from letters the child has learned (what the word train builds). */
export function trainWords(profile: ChildProfile, canSpeak: CanSpeak = () => true): LearningWord[] {
  const known = new Set(completedLetterIds(profile));
  return LEARNING_WORDS.filter(word => hasPicture(word) && word.units.length <= 5 && word.letterIds.every(id => known.has(id)) && canSpeak(word.word));
}

export interface FreePlayState { id: FreePlayId; open: boolean; missing: number; }
/** Which free-play games are open, and how many more letters the locked ones need. */
export function freePlayStates(profile: ChildProfile, canSpeak: CanSpeak = () => true): FreePlayState[] {
  const letters = completedLetterIds(profile).length;
  const enough = { pairs: pairWords(profile, canSpeak).length >= 3, catch: letters >= 2, train: trainWords(profile, canSpeak).length >= 2 };
  return FREE_PLAY.map(game => ({ id: game.id, open: letters >= game.minLetters && enough[game.id], missing: Math.max(0, game.minLetters - letters) }));
}
