import { StrokeGuide, StrokePoint } from './types';
import { calculatePolylineLength, pointDistance, resamplePolyline } from './pathSimilarity';

export type RubricId = 'shape' | 'parts' | 'steadiness' | 'size' | 'flow' | 'tidiness';
export type RubricStatus = 'good' | 'ok' | 'fix';
export interface RubricCriterion { id: RubricId; labelKu: string; score: number; status: RubricStatus; tipKu?: string; }
export interface WritingRubric {
  overall: number;
  criteria: RubricCriterion[];
  /** Guide components (body, dots, marks) the child did not write. */
  missingComponentIds: number[];
  /** Small marks written away from every dot of the letter. */
  misplacedMarkCount: number;
  /** Tip sentences in priority order (each is one of RUBRIC_SENTENCES). */
  tipsKu: string[];
  passes: boolean;
}
/** The subset of the path-similarity result the rubric needs (keeps this module free of import cycles). */
export interface TracingSummary { score: number; mastered: boolean; lengthRatio: number; breakdown: { offPathPenalty: number } }

export const RUBRIC_LABELS: Record<RubricId, string> = {
  shape: 'شێوەی پیت', parts: 'هێڵ و خاڵەکان', steadiness: 'ڕێکی دەست', size: 'قەبارە', flow: 'ئاراستە و ڕیز', tidiness: 'پاکی نووسین',
};
const WEIGHTS: Record<RubricId, number> = { shape: 0.35, parts: 0.25, steadiness: 0.1, size: 0.1, flow: 0.1, tidiness: 0.1 };
const MARK_SIZE = 10;        // a mark/dot fits in a 10x10 box of the 100x100 board
const NEAR = 8;              // a drawn point is "on" a guide point within 8 units (matches the tracing scorer)
const MARK_NEAR = 12;
/**
 * Every sentence the rubric can show or speak. They are emoji-free single sentences so each one can have its
 * own recorded narration (see src/data/narratedExtras.ts and docs/offline-audio.md).
 */
export const RUBRIC_SENTENCES = {
  praise: 'ئافەرم! شێوە، هێڵ، خاڵ و قەبارەی پیتەکەت باشن.',
  fine: 'باشە!',
  retry: 'جارێکی تر هەوڵ بدە.',
  shape: 'شێوەی پیتەکە لە نموونەکە جیاوازە؛ نموونەکە سەیر بکە و جارێکی تر بنووسە.',
  missingBody: 'بەشێکی پیتەکە ماوە؛ هەموو هێڵەکان بنووسە.',
  missingMark: 'خاڵ یان نیشانەیەک ماوە.',
  misplaced: 'خاڵ یان نیشانەکە لە شوێنی خۆی نییە؛ سەیری شوێنی لە نموونەکەدا بکە.',
  duplicate: 'خاڵێکی زیادە نووسراوە.',
  steadiness: 'هێڵەکان کەمێک لەرزۆکن؛ بە هێواشی و بە یەک جووڵە بنووسە.',
  sizeSmall: 'پیتەکەت زۆر بچووکە؛ گەورەتر بینووسە.',
  sizeBig: 'پیتەکەت زۆر گەورەیە؛ بچووکتر بینووسە تا لە بۆردەکە بێت.',
  flowRtl: 'پیتەکە لە ڕاستەوە بۆ چەپ دەنووسرێت؛ لە لای ڕاستەوە دەست پێ بکە.',
  flowTtb: 'پیتەکە لە سەرەوە بۆ خوارەوە دەنووسرێت؛ لە سەرەوە دەست پێ بکە.',
  flowOrder: 'سەرەتا بەشە گەورەکەی پیتەکە بنووسە، پاشان خاڵ و نیشانەکان.',
  tidiness: 'هێڵی زیادە زۆرە؛ تەنها یەکجار بەسەر هەر هێڵێکدا بڕۆ.',
} as const;
const T = RUBRIC_SENTENCES;
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const status = (score: number): RubricStatus => score >= 80 ? 'good' : score >= 55 ? 'ok' : 'fix';

function bounds(points: StrokePoint[]) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
const span = (points: StrokePoint[]) => { const b = bounds(points); return { w: b.maxX - b.minX, h: b.maxY - b.minY }; };
const isMark = (points: StrokePoint[]) => { const s = span(points); return s.w < MARK_SIZE && s.h < MARK_SIZE; };
const nearest = (point: StrokePoint, cloud: StrokePoint[]) => cloud.reduce((best, q) => Math.min(best, pointDistance(point, q)), Infinity);
const centroid = (points: StrokePoint[]) => ({ x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length });
/** Keep points at least `gap` apart so touch jitter does not look like tremor. */
function thin(points: StrokePoint[], gap = 3): StrokePoint[] {
  const out: StrokePoint[] = [];
  for (const point of points) if (!out.length || pointDistance(out[out.length - 1], point) >= gap) out.push(point);
  return out;
}
/** Total absolute turning angle per unit of length. */
function turnPerLength(strokes: StrokePoint[][]): number {
  let turn = 0, length = 0;
  for (const stroke of strokes) {
    const pts = thin(stroke);
    if (pts.length < 6) continue;
    for (let i = 1; i < pts.length - 1; i++) {
      const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
      const b = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
      let d = Math.abs(b - a); if (d > Math.PI) d = 2 * Math.PI - d;
      turn += d;
    }
    length += calculatePolylineLength(pts);
  }
  return length > 0 ? turn / length : 0;
}
const longest = (strokes: StrokePoint[][]) => strokes.reduce<StrokePoint[]>((best, s) => calculatePolylineLength(s) > calculatePolylineLength(best) ? s : best, []);

/** How the guide expects the main stroke to travel: right-to-left for wide letters, top-to-bottom for tall ones. */
function expectedFlow(guide: StrokeGuide): 'rtl' | 'ttb' | null {
  const main = longest(guide.strokes.filter(s => !isMark(s)));
  if (main.length < 2) return null;
  const dx = main[main.length - 1].x - main[0].x, dy = main[main.length - 1].y - main[0].y;
  if (Math.abs(dx) >= 15 && Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'rtl' : null;
  if (Math.abs(dy) >= 15) return dy > 0 ? 'ttb' : null;
  return null;
}

/**
 * Multi-criteria review of a handwritten letter. `raw` are the strokes as drawn (used for size),
 * `aligned` are the strokes after free-writing alignment (used for shape and parts).
 */
export function buildWritingRubric(guide: StrokeGuide, raw: StrokePoint[][], aligned: StrokePoint[][], tracing: TracingSummary): WritingRubric {
  const drawn = aligned.flatMap(s => resamplePolyline(s, 1));
  const ids = guide.componentIds || guide.strokes.map((_, i) => i);
  const components = Array.from(new Set(ids)).map(id => {
    const strokes = guide.strokes.filter((_, i) => (ids[i] ?? i) === id);
    const points = strokes.flatMap(s => resamplePolyline(s, 1));
    const coverage = points.filter(p => nearest(p, drawn) < NEAR).length / Math.max(1, points.length);
    return { id, points, coverage, mark: isMark(points) };
  });

  // Parts: every body stroke, dot and mark must be written, in the right place, and not duplicated.
  const missingByCoverage = components.filter(c => c.coverage < 0.45);
  // Free-writing alignment stretches the body over a missing dot, so also count marks directly.
  const userMarks = aligned.filter(s => s.length && isMark(s));
  const markDeficit = Math.max(0, components.filter(c => c.mark).length - userMarks.length);
  const extraMissing = components.filter(c => c.mark && !missingByCoverage.includes(c)).sort((a, b) => a.coverage - b.coverage)
    .slice(0, Math.max(0, markDeficit - missingByCoverage.filter(c => c.mark).length));
  const missing = [...missingByCoverage, ...extraMissing];
  const guidePoints = components.flatMap(c => c.points);
  const misplaced = userMarks.filter(s => nearest(centroid(s), guidePoints) > MARK_NEAR);
  // Each small mark is credited to its nearest dot; a second mark on the same dot is a duplicate.
  const markComponents = components.filter(c => c.mark);
  const marksPerDot = new Map<number, number>();
  for (const mark of userMarks) {
    const at = centroid(mark);
    const target = markComponents.filter(c => nearest(at, c.points) <= MARK_NEAR)
      .sort((a, b) => nearest(at, a.points) - nearest(at, b.points))[0];
    if (target) marksPerDot.set(target.id, (marksPerDot.get(target.id) || 0) + 1);
  }
  const duplicates = Array.from(marksPerDot.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const parts = clamp(components.reduce((sum, c) => sum + Math.min(1, c.coverage / 0.85) * 100, 0) / Math.max(1, components.length)
    - missing.length * 30 - misplaced.length * 25 - duplicates * 20);

  // Size: compared with the model before any free-writing alignment.
  const rawPoints = raw.flat();
  const guideSpan = Math.max(...Object.values(span(guide.strokes.flat())), 1);
  const userSpan = rawPoints.length ? Math.max(...Object.values(span(rawPoints))) : 0;
  const ratio = userSpan / guideSpan;
  const size = clamp(ratio >= 0.7 && ratio <= 1.5 ? 100 : ratio < 0.7 ? (ratio - 0.3) / 0.4 * 100 : (2.6 - ratio) / 1.1 * 100);

  // Steadiness: tremor shows up as extra turning compared with the model's own curves.
  const guideTurn = Math.max(turnPerLength(guide.strokes), 0.02);
  const turnRatio = turnPerLength(aligned) / guideTurn;
  const steadiness = clamp(turnRatio <= 3 ? 100 : 100 - (turnRatio - 3) / 5 * 100);

  // Flow: direction of the main stroke and body-before-dots order. Advisory, never the only reason to fail.
  let flow = 100; let flowTip: string | undefined;
  const expected = expectedFlow(guide);
  const mainUser = longest(aligned.filter(s => !isMark(s)));
  if (expected && mainUser.length > 1) {
    const dx = mainUser[mainUser.length - 1].x - mainUser[0].x, dy = mainUser[mainUser.length - 1].y - mainUser[0].y;
    const wrong = expected === 'rtl' ? dx > 6 : dy < -6;
    if (wrong) { flow -= 40; flowTip = expected === 'rtl' ? T.flowRtl : T.flowTtb; }
  }
  const hasBody = components.some(c => !c.mark);
  if (hasBody && aligned.length > 1 && isMark(aligned[0]) && aligned.some(s => !isMark(s))) {
    flow -= 25; flowTip = flowTip || T.flowOrder;
  }
  flow = clamp(flow);

  const tidiness = clamp(100 - Math.max(0, tracing.lengthRatio - 1.3) * 90 - tracing.breakdown.offPathPenalty * 2.5);
  const shape = clamp(tracing.score);

  const missingMarks = missing.filter(c => c.mark).length, missingBody = missing.length - missingMarks;
  const tips: Record<RubricId, string[]> = {
    shape: shape < 80 ? [T.shape] : [],
    parts: [
      missingBody > 0 ? T.missingBody : '',
      missingMarks > 0 ? T.missingMark : '',
      misplaced.length > 0 ? T.misplaced : '',
      duplicates > 0 ? T.duplicate : '',
    ].filter(Boolean),
    steadiness: steadiness < 80 ? [T.steadiness] : [],
    size: size < 80 ? [ratio < 1 ? T.sizeSmall : T.sizeBig] : [],
    flow: flow < 80 && flowTip ? [flowTip] : [],
    tidiness: tidiness < 80 ? [T.tidiness] : [],
  };
  const scores: Record<RubricId, number> = { shape, parts, steadiness, size, flow, tidiness };
  const order: RubricId[] = ['parts', 'shape', 'size', 'tidiness', 'steadiness', 'flow'];
  const criteria = (Object.keys(scores) as RubricId[]).map(id => ({ id, labelKu: RUBRIC_LABELS[id], score: Math.round(scores[id]), status: status(scores[id]), tipKu: tips[id].join(' ') || undefined }));
  const overall = Math.round(criteria.reduce((sum, c) => sum + c.score * WEIGHTS[c.id], 0));
  const passes = tracing.mastered && missing.length === 0 && misplaced.length === 0 && duplicates === 0 && parts >= 80 && size >= 60 && tidiness >= 55 && overall >= 75;
  return {
    overall, criteria, passes,
    missingComponentIds: missing.map(c => c.id), misplacedMarkCount: misplaced.length,
    tipsKu: order.flatMap(id => tips[id]),
  };
}

/** The sentences to show (and speak, when recorded) for a result: praise, or the two most important tips. */
export function rubricNarration(rubric: WritingRubric, stars: 1 | 2 | 3): string[] {
  if (rubric.passes) return [T.praise];
  const tips = rubric.tipsKu.slice(0, 2);
  if (!tips.length) return [T.retry];
  return stars === 2 ? [T.fine, ...tips] : tips;
}
export function rubricFeedback(rubric: WritingRubric, stars: 1 | 2 | 3): string {
  return rubricNarration(rubric, stars).join(' ') + (rubric.passes ? ' ⭐⭐⭐' : '');
}
