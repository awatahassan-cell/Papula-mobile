import { LEARNING_WORDS } from './learningEngine';
import { mockLetters } from '../data/mockLetters';

export const INTRO_WORD_COUNT = 5;
/** Up to five picture words that contain the letter, taken from the lesson's own words first. */
export function introWords(letter: (typeof mockLetters)[number], canSpeak: (text: string) => boolean = () => true) {
  const own = letter.exampleWords.map(item => ({ id: item.id, word: item.word, picture: item.imageEmoji }));
  const more = LEARNING_WORDS.filter(item => item.letterIds.includes(letter.id)).map(item => ({ id: item.id, word: item.word, picture: item.imageEmoji }));
  const seen = new Set<string>();
  return [...own, ...more].filter(item => !!item.picture && canSpeak(item.word) && !seen.has(item.word) && !!seen.add(item.word)).slice(0, INTRO_WORD_COUNT);
}
