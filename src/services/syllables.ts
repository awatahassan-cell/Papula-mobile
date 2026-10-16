import { SYLLABLE_WORDS } from '../data/syllableWords';
import { ChildProfile } from './types';
import { LEARNING_WORDS, LearningWord, normalizedWord, shuffled } from './learningEngine';

export interface SyllableTile { id: number; text: string; }
export interface SyllableRound { word: LearningWord; syllables: string[]; tiles: SyllableTile[]; }

/** Longest word (in syllables) a child is asked to build, from age group or placement result. */
export function maxSyllables(profile: ChildProfile): number {
  const level = profile.placement?.recommendedLevel;
  if (level === 1) return 2;
  if (level === 2) return 3;
  if (profile.ageGroup === '3-4') return 2;
  if (profile.ageGroup === '5-6') return 3;
  return 4;
}

const lookup = () => new Map(LEARNING_WORDS.map(word => [normalizedWord(word.word), word]));

/** Words that can be split into syllables and have bundled narration. */
export function syllableWords(): { word: LearningWord; syllables: string[] }[] {
  const words = lookup();
  return SYLLABLE_WORDS.flatMap(item => {
    const word = words.get(normalizedWord(item.word));
    return word ? [{ word, syllables: item.syllables }] : [];
  });
}

/** Easy words first, preferring words the child has already learned the letters of. */
export function syllableRounds(profile: ChildProfile, count = 4, random: () => number = Math.random): SyllableRound[] {
  const max = maxSyllables(profile);
  const unknown = (word: LearningWord) => word.letterIds.filter(id => !profile.masteredLetterIds.includes(id)).length;
  const pool = syllableWords().filter(item => item.syllables.length <= max);
  const ordered = shuffled(pool, random)
    .sort((a, b) => a.syllables.length - b.syllables.length || unknown(a.word) - unknown(b.word))
    .slice(0, count);
  return ordered.map(({ word, syllables }) => {
    const base = syllables.map((text, id) => ({ id, text }));
    let tiles = shuffled(base, random);
    for (let attempt = 0; attempt < 5 && tiles.every((tile, index) => tile.id === index); attempt++) tiles = shuffled(base, random);
    return { word, syllables, tiles };
  });
}

export const assembleSyllables = (round: SyllableRound, selectedIds: number[]) =>
  selectedIds.map(id => round.tiles.find(tile => tile.id === id)?.text ?? '').join('');

/** Compares the chosen order with the word; identical syllables are interchangeable. */
export function checkSyllableOrder(round: SyllableRound, selectedIds: number[]): boolean {
  return selectedIds.length === round.syllables.length
    && normalizedWord(assembleSyllables(round, selectedIds)) === normalizedWord(round.word.word)
    && selectedIds.every((id, index) => round.tiles.find(tile => tile.id === id)?.text === round.syllables[index]);
}
