import { getStoryNarration } from '../data/storyNarration';

export const LEARNING_STORY_RATE = 0.7;
export const LEARNING_SENTENCE_PAUSE_MS = 1800;
export const LEARNING_PAGE_PAUSE_MS = 3200;

export type NarrationChunk = { text: string; narrationText: string; startOffset?: number };
const emotions = new Set(['weak', 'angry', 'bored', 'menacing', 'playful', 'tired', 'excited']);
const deliveries = new Set(['whispering', 'singing', 'sleepy drowsy voice', 'witch voice', 'drunken voice']);

export function learningStoryChunks(storyId: string, pageNumber: number, text: string): NarrationChunk[] {
  const narrated = getStoryNarration(storyId, pageNumber, text);
  const pieces = narrated.split(/(?:\r?\n)+|(?<=[.!?؟؛])\s+/u);
  const result: NarrationChunk[] = [];
  let emotion = '', delivery = '', cursor = 0;
  for (const piece of pieces) {
    const clean = piece.replace(/\[[a-z ]+\]\s*/g, '').trim();
    if (!clean) continue;
    // Carry the speaker's delivery into the next sentence. Reactions such as
    // door knocks belong only to the point where they were authored.
    const trimmed = piece.trim();
    const leading = trimmed.match(/^(?:\[[a-z ]+\]\s*)+/)?.[0] || '';
    const leadingTags = [...leading.matchAll(/\[([a-z ]+)\]/g)].map(match => match[1]);
    for (const tag of leadingTags) {
      if (emotions.has(tag)) emotion = tag;
      if (deliveries.has(tag)) delivery = tag;
    }
    const inherited = [...new Set([emotion, delivery, ...leadingTags].filter(Boolean))].map(tag => `[${tag}]`).join(' ');
    const script = `${inherited} ${trimmed.slice(leading.length)}`.trimStart();
    const startOffset = Math.max(cursor,text.indexOf(clean,cursor));
    result.push({ text: clean, narrationText: script, startOffset });
    cursor = startOffset + clean.length;
    for (const match of piece.matchAll(/\[([a-z ]+)\]/g)) {
      if (emotions.has(match[1])) emotion = match[1];
      if (deliveries.has(match[1])) delivery = match[1];
    }
  }
  return result;
}
