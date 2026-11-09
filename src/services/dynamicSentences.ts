import { mockLetters } from '../data/mockLetters';

/**
 * Sentences with one changing part are never recorded whole. The fixed sentence is recorded once
 * and the changing word or letter reuses its own recording, so "ئاگر. کام پیت ون بووە؟" is read as
 * the word «ئاگر» followed by the fixed question.
 */
export type DynamicPart = { text: string; narrationText: string; kind: 'fixed' | 'word' | 'letter' };

export const FIND_TAIL = 'بدۆزەوە و دەستی لێ بدە.';
export const MISSING_TAIL = 'کام پیت ون بووە؟';
export const LISTEN = 'گوێ بگرە.';
/** The fixed pieces that have to exist as recordings. */
export const DYNAMIC_FIXED_TEXTS = [FIND_TAIL, MISSING_TAIL, LISTEN];

const fixed = (text: string): DynamicPart => ({ text, narrationText: text, kind: 'fixed' });
const word = (text: string): DynamicPart => ({ text, narrationText: text, kind: 'word' });

export function dynamicParts(raw: string): DynamicPart[] | null {
  const text = raw.trim();
  const sound = text.match(/^گوێ بگرە\. پیتی (.+) بدۆزەوە و دەستی لێ بدە\.$/u);
  if (sound) {
    const letter = mockLetters.find(item => item.glyph === sound[1] || item.name === sound[1]);
    if (!letter) return null;
    return [fixed(LISTEN), { text: 'پیتی', narrationText: 'پیتی.', kind: 'fixed' }, { text: letter.name, narrationText: letter.name, kind: 'letter' }, fixed(FIND_TAIL)];
  }
  const missing = text.match(/^(.+)\. کام پیت ون بووە؟$/u);
  if (missing) return [word(missing[1]), fixed(MISSING_TAIL)];
  const find = text.match(/^(.+) بدۆزەوە و دەستی لێ بدە\.$/u);
  if (find) return [word(find[1]), fixed(FIND_TAIL)];
  return null;
}
