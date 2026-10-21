import { ChildProfile } from '../services/types';
import { LEARNING_WORDS, normalizedWord } from '../services/learningEngine';

export type VocabCategory = 'animals' | 'food' | 'fruit';
export interface PictureWord { id: string; word: string; emoji: string; category: VocabCategory | 'letters'; }

export const VOCAB_CATEGORIES: { id: VocabCategory; title: string; emoji: string }[] = [
  { id: 'animals', title: 'ئاژەڵەکان', emoji: '🐾' },
  { id: 'food', title: 'خواردن و خواردنەوە', emoji: '🥛' },
  { id: 'fruit', title: 'میوە و سەوزە', emoji: '🍎' },
];

const group = (category: VocabCategory, prefix: string, items: [string, string, string][]): PictureWord[] =>
  items.map(([id, word, emoji]) => ({ id: `v-${prefix}-${id}`, word, emoji, category }));

/** Everyday picture words. Short, concrete and easy to say: they get the same spaced review as letters. */
export const VOCAB: PictureWord[] = [
  ...group('animals', 'a', [
    ['cat', 'پشیلە', '🐱'], ['dog', 'سەگ', '🐶'], ['fish', 'ماسی', '🐟'], ['sheep', 'مەڕ', '🐑'], ['cow', 'مانگا', '🐄'],
    ['horse', 'ئەسپ', '🐴'], ['hen', 'مریشک', '🐔'], ['lion', 'شێر', '🦁'], ['elephant', 'فیل', '🐘'], ['butterfly', 'پەپوولە', '🦋'],
    ['rabbit', 'کەروێشک', '🐰'], ['mouse', 'مشک', '🐭'],
  ]),
  ...group('food', 'f', [
    ['bread', 'نان', '🥖'], ['milk', 'شیر', '🥛'], ['egg', 'هێلکە', '🥚'], ['cheese', 'پەنیر', '🧀'], ['rice', 'برنج', '🍚'],
    ['meat', 'گۆشت', '🍖'], ['cake', 'کێک', '🍰'], ['water', 'ئاو', '💧'], ['tea', 'چا', '🍵'],
  ]),
  ...group('fruit', 'p', [
    ['apple', 'سێو', '🍎'], ['orange', 'پرتەقاڵ', '🍊'], ['banana', 'مۆز', '🍌'], ['grape', 'ترێ', '🍇'], ['cherry', 'گێلاس', '🍒'],
    ['melon', 'شووتی', '🍉'], ['lemon', 'لێمۆ', '🍋'], ['carrot', 'گەزەر', '🥕'], ['tomato', 'تەماتە', '🍅'], ['potato', 'پتاتە', '🥔'],
  ]),
];

export interface VocabSentence { id: string; text: string; emoji: string; }
/** One short sentence each; the child reads (or hears) it and picks the matching picture. */
export const VOCAB_SENTENCES: VocabSentence[] = [
  { id: 'vs-cat-milk', text: 'پشیلە شیر دەخوات', emoji: '🐱🥛' },
  { id: 'vs-dog-bread', text: 'سەگ نان دەخوات', emoji: '🐶🥖' },
  { id: 'vs-fish-water', text: 'ماسی لە ئاودایە', emoji: '🐟💧' },
  { id: 'vs-bird-fly', text: 'کۆتر دەفڕێت', emoji: '🕊️' },
  { id: 'vs-kid-apple', text: 'منداڵەکە سێو دەخوات', emoji: '🧒🍎' },
  { id: 'vs-sheep-grass', text: 'مەڕ گیا دەخوات', emoji: '🐑🌿' },
  { id: 'vs-horse-run', text: 'ئەسپ ڕادەکات', emoji: '🐴' },
  { id: 'vs-hen-egg', text: 'مریشک هێلکە دەکات', emoji: '🐔🥚' },
];

const taken = new Set(VOCAB.map(item => normalizedWord(item.word)));
/** Words from the letter lessons, so their spaced review can run in the same picture game. */
export const LETTER_PICTURE_WORDS: PictureWord[] = LEARNING_WORDS.filter(word => !taken.has(normalizedWord(word.word)) && !!word.imageEmoji)
  .map(word => ({ id: word.id, word: word.word, emoji: word.imageEmoji, category: 'letters' as const }));
export const ALL_PICTURE_WORDS: PictureWord[] = [...VOCAB, ...LETTER_PICTURE_WORDS];
export const isVocabId = (id?: string) => !!id && /^v[s]?-/.test(id);
export const knownWordId = (id: string) => ALL_PICTURE_WORDS.some(item => item.id === id) || VOCAB_SENTENCES.some(item => item.id === id) || LEARNING_WORDS.some(word => word.id === id);

const isDue = (profile: ChildProfile, id: string, now: Date) => {
  const record = profile.wordReviews?.[id];
  return !!record && (record.level === 0 || new Date(record.dueAt).getTime() <= now.getTime());
};
/** Picture words that missed last time or whose review date has come. */
export function dueWords(profile: ChildProfile, now = new Date()): PictureWord[] {
  return ALL_PICTURE_WORDS.filter(item => isDue(profile, item.id, now));
}
export function dueSentences(profile: ChildProfile, now = new Date()): VocabSentence[] {
  return VOCAB_SENTENCES.filter(item => isDue(profile, item.id, now));
}
export const dueWordCount = (profile: ChildProfile, now = new Date()) => dueWords(profile, now).length + dueSentences(profile, now).length;

/** Missed first, then due, then never seen, then the rest by oldest due date. */
export function wordPlan<T extends { id: string }>(profile: ChildProfile, pool: T[], count: number, now = new Date()): T[] {
  const rank = (item: T) => {
    const record = profile.wordReviews?.[item.id];
    if (!record) return 2;
    if (record.level === 0) return 0;
    return new Date(record.dueAt).getTime() <= now.getTime() ? 1 : 3;
  };
  const due = (item: T) => profile.wordReviews?.[item.id]?.dueAt || '';
  return pool.map((item, index) => ({ item, index })).sort((a, b) => rank(a.item) - rank(b.item) || (due(a.item) < due(b.item) ? -1 : due(a.item) > due(b.item) ? 1 : 0) || a.index - b.index)
    .slice(0, count).map(entry => entry.item);
}

/** Two wrong answers that differ from the right one in word and picture, from the same family of words. */
export function pictureDistractors(target: PictureWord, random: () => number = Math.random, count = 2): PictureWord[] {
  const family = target.category === 'letters' ? LETTER_PICTURE_WORDS : VOCAB.filter(item => item.category === target.category);
  const pool = [...family, ...VOCAB].filter((item, index, all) => item.id !== target.id && item.emoji !== target.emoji && item.word !== target.word && all.findIndex(other => other.id === item.id) === index);
  const result: PictureWord[] = [];
  const own = pool.filter(item => family.includes(item));
  for (const source of [own, pool]) {
    const left = [...source].filter(item => !result.includes(item));
    while (result.length < count && left.length) result.push(left.splice(Math.floor(random() * left.length), 1)[0]);
  }
  return result;
}
export function sentenceDistractors(target: VocabSentence, random: () => number = Math.random, count = 2): VocabSentence[] {
  const left = VOCAB_SENTENCES.filter(item => item.id !== target.id && item.emoji !== target.emoji);
  const result: VocabSentence[] = [];
  while (result.length < count && left.length) result.push(left.splice(Math.floor(random() * left.length), 1)[0]);
  return result;
}
