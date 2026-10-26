import { ChildProfile } from './types';
import { LEARNING_WORDS, LearningWord } from './learningEngine';
import { mockLetters } from '../data/mockLetters';
import { completedLetterIds } from './lessonPath';

export type FreePlayId = 'pairs' | 'catch' | 'match' | 'odd' | 'basket' | 'fill' | 'train';
/** Free-play games open as the child learns letters; each also needs enough known words or letters to be worth playing. */
export const FREE_PLAY: { id: FreePlayId; minLetters: number }[] = [
  { id: 'pairs', minLetters: 3 }, { id: 'catch', minLetters: 4 }, { id: 'match', minLetters: 4 }, { id: 'odd', minLetters: 5 },
  { id: 'basket', minLetters: 5 }, { id: 'fill', minLetters: 6 }, { id: 'train', minLetters: 6 },
];

/** Letters that look alike; the odd-one-out game shows three of one and one of the other. */
export const SIMILAR_LETTERS: [string, string][] = [['ر', 'ڕ'], ['ل', 'ڵ'], ['ز', 'ژ'], ['ب', 'پ'], ['ج', 'چ'], ['و', 'ۆ'], ['ی', 'ێ']];
const knownGlyphs = (profile: ChildProfile) => new Set(mockLetters.filter(letter => completedLetterIds(profile).includes(letter.id)).map(letter => letter.glyph));
/** Look-alike pairs where the child has learned both letters. */
export const similarPairs = (profile: ChildProfile) => { const known = knownGlyphs(profile); return SIMILAR_LETTERS.filter(([a, b]) => known.has(a) && known.has(b)); };

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

/** Up to four picture words with different first letters, for matching a letter to its picture. */
export function matchWords(profile: ChildProfile, canSpeak: CanSpeak = () => true, random: () => number = Math.random): LearningWord[] {
  const seen = new Set<string>(), result: LearningWord[] = [];
  for (const word of pairWords(profile, canSpeak).map(item => ({ item, key: random() })).sort((a, b) => a.key - b.key).map(entry => entry.item)) {
    if (seen.has(word.units[0])) continue;
    seen.add(word.units[0]); result.push(word);
    if (result.length === 4) break;
  }
  return result;
}

export interface FreePlayState { id: FreePlayId; open: boolean; missing: number; }
/** Which free-play games are open, and how many more letters the locked ones need. */
export function freePlayStates(profile: ChildProfile, canSpeak: CanSpeak = () => true): FreePlayState[] {
  const letters = completedLetterIds(profile).length;
  const trains = trainWords(profile, canSpeak).length >= 2;
  const enough = { pairs: pairWords(profile, canSpeak).length >= 3, catch: letters >= 2, match: matchWords(profile, canSpeak).length >= 3, odd: similarPairs(profile).length >= 1, basket: letters >= 2, fill: trains, train: trains };
  return FREE_PLAY.map(game => ({ id: game.id, open: letters >= game.minLetters && enough[game.id], missing: Math.max(0, game.minLetters - letters) }));
}
