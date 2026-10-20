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
