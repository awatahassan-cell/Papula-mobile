import { LearningCheckpoint } from './types';
export function normalizeCheckpoint(value: unknown): LearningCheckpoint | undefined {
  if (!value || typeof value !== 'object') return;
  const item = value as Partial<LearningCheckpoint>;
  if (!['lesson', 'story', 'writing'].includes(item.kind || '') || typeof item.contentId !== 'string' || !item.contentId) return;
  const number = (input: unknown, max: number) => typeof input === 'number' && Number.isFinite(input) ? Math.max(0, Math.min(max, Math.floor(input))) : 0;
  if (item.kind === 'lesson') return { kind: 'lesson', contentId: item.contentId, step: number(item.step, 4), wordIndex: number(item.wordIndex, 2), round: number(item.round, 2), listenCount: number(item.listenCount, 5) };
  if (item.kind === 'story') return { kind: 'story', contentId: item.contentId, pageIndex: number(item.pageIndex, 999), readMode: item.readMode === 'i_read' ? 'i_read' : 'read_to_me' };
  return { kind: 'writing', contentId: item.contentId, writingMode: item.writingMode === 'copy' || item.writingMode === 'independent' ? item.writingMode : 'trace' };
}
