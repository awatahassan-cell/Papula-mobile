import { WRITING_SENTENCES } from '../data/writingSentences';
import { getKurdishStrokeGuide } from '../data/kurdishLetterGuides';
import { mockLetters } from '../data/mockLetters';
import { assessWriting } from './foundationalLearning';
import { LEARNING_WORDS, LearningWord, normalizedWord, wordUnits } from './learningEngine';
import { isLessonComplete } from './lessonPath';
import { ChildProfile, LetterItem, StrokeGuide, StrokePoint } from './types';
import { TracingScoreResult } from './tracingScorer';

export interface WritingSlot { wordIndex: number; unitIndex: number; letter: LetterItem; guide: StrokeGuide; }
export interface WritingTask { id: string; kind: 'word' | 'sentence'; title: string; emoji: string; words: string[]; slots: WritingSlot[]; learningWord?: LearningWord; }

const MAX_UNITS = 5;

function slotsFor(words: string[]): WritingSlot[] | null {
  const slots: WritingSlot[] = [];
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const units = wordUnits(words[wordIndex]);
    if (units.length < 2 || units.length > MAX_UNITS) return null;
    for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
      const letter = mockLetters.find(item => normalizedWord(item.glyph) === normalizedWord(units[unitIndex]));
      const guide = letter && getKurdishStrokeGuide(letter.id);
      if (!letter || !guide) return null;
      slots.push({ wordIndex, unitIndex, letter, guide });
    }
  }
  return slots;
}

/** A letter counts as known for word writing once its lesson is done or its tracing stage passed. */
export const knowsLetterForWriting = (profile: ChildProfile, id: string) =>
  isLessonComplete(profile, id) || !!profile.writingProgress?.[id]?.tracePassed;

const allKnown = (profile: ChildProfile, slots: WritingSlot[]) => slots.every(slot => knowsLetterForWriting(profile, slot.letter.id));

export function wordWritingTasks(profile: ChildProfile, count = 5): WritingTask[] {
  const tasks = LEARNING_WORDS.flatMap(word => {
    const slots = slotsFor([word.word]);
    return slots ? [{ id: word.id, kind: 'word' as const, title: word.word, emoji: word.imageEmoji, words: [word.word], slots, learningWord: word }] : [];
  }).filter(task => allKnown(profile, task.slots));
  const written = new Set(profile.learnedWordIds || []);
  return tasks.sort((a, b) => Number(written.has(a.id)) - Number(written.has(b.id)) || a.slots.length - b.slots.length).slice(0, count);
}

export function sentenceWritingTasks(profile: ChildProfile): WritingTask[] {
  return WRITING_SENTENCES.flatMap(sentence => {
    const words = sentence.text.split(/\s+/);
    const slots = slotsFor(words);
    return slots && allKnown(profile, slots) ? [{ id: 'sentence-' + sentence.id, kind: 'sentence' as const, title: sentence.text, emoji: sentence.emoji, words, slots }] : [];
  });
}

export interface SlotResult { slot: number; passed: boolean; attempts: number; helped: boolean; score: number; }
export interface WritingSession { task: WritingTask; index: number; attempts: number; results: SlotResult[]; }
export const startSession = (task: WritingTask): WritingSession => ({ task, index: 0, attempts: 0, results: [] });
export const sessionDone = (session: WritingSession) => session.index >= session.task.slots.length;

/** Checks the current letter. Passing moves to the next slot; a miss keeps the child on the same letter. */
export function submitSlot(session: WritingSession, strokes: StrokePoint[][], helped: boolean): { session: WritingSession; assessment: TracingScoreResult; passed: boolean } {
  const slot = session.task.slots[session.index];
  const assessment = assessWriting(slot.guide, strokes, helped ? 'trace' : 'copy');
  const passed = assessment.mastered;
  const attempts = session.attempts + 1;
  if (!passed) return { session: { ...session, attempts }, assessment, passed };
  const result: SlotResult = { slot: session.index, passed, attempts, helped, score: assessment.score };
  return { session: { ...session, index: session.index + 1, attempts: 0, results: [...session.results, result] }, assessment, passed };
}

export function sessionSummary(session: WritingSession) {
  const total = session.results.length;
  const average = total ? Math.round(session.results.reduce((sum, r) => sum + r.score, 0) / total) : 0;
  const unaided = session.results.filter(r => !r.helped && r.attempts === 1).length;
  return { total, average, unaided, retried: session.results.filter(r => r.attempts > 1).map(r => session.task.slots[r.slot].letter) };
}
