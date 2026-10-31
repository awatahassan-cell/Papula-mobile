export const LETTER_HIGHLIGHT_COLOR = '#dc2626';

/** Color ranges only: preserve every original character, space, and joining boundary. */
export function letterHighlightRuns(text: string, glyph?: string): { text: string; target: boolean }[] {
  if (!glyph) return [{ text, target: false }];
  const normalized = text.replace(/ھ/g, 'ه'), target = glyph.replace(/ھ/g, 'ه');
  const runs: { text: string; target: boolean }[] = [];
  let cursor = 0, index: number;
  while ((index = normalized.indexOf(target, cursor)) !== -1) {
    if (index > cursor) runs.push({ text: text.slice(cursor, index), target: false });
    let end = index + target.length;
    // Keep vowel marks with their base letter in the same foreground-color span.
    end += text.slice(end).match(/^\p{M}+/u)?.[0].length || 0;
    runs.push({ text: text.slice(index, end), target: true });
    cursor = end;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), target: false });
  return runs;
}

// Kurdish and common Arabic joining types, Unicode ArabicShaping-17.0.0.txt.
// Alef, dal, reh, waw and Kurdish ae join only to the preceding logical letter.
const dualJoining = new Set(Array.from('ئبتثجحخسشصضطظعغفقكلمنهىيپچڤکگڵێیھ'));
const rightJoining = new Set(Array.from('آأؤإاةدذرزڕژوۆە'));
const ZWJ = '\u200d';
const edge = (text: string, last: boolean) => {
  const characters = Array.from(text);
  if (last) characters.reverse();
  return characters.find(character => !/\p{M}/u.test(character)) || '';
};
const connects = (before: string, after: string) =>
  (dualJoining.has(before) || before === 'ـ' || before === ZWJ) &&
  (dualJoining.has(after) || rightJoining.has(after) || after === 'ـ' || after === ZWJ);

/**
 * Android shapes styled fragments separately. Supply invisible joining context
 * on both sides of an existing connection, never across a natural non-join.
 * `text` remains authored text for speech, accessibility, saving and offsets;
 * only `displayText` carries the shaping controls.
 */
export function androidLetterHighlightRuns(text: string, glyph?: string) {
  const runs = letterHighlightRuns(text, glyph).map(run => ({ ...run, displayText: run.text }));
  for (let index = 1; index < runs.length; index++) {
    const previous = runs[index - 1], current = runs[index];
    if (!connects(edge(previous.text, true), edge(current.text, false))) continue;
    previous.displayText += ZWJ;
    current.displayText = ZWJ + current.displayText;
  }
  return runs;
}
