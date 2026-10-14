import { StrokePoint } from './types';

export interface DTWResult {
  rawDTW: number;
  normalizedDTW: number; // Average point distance along optimal warping path
  pathLength: number;
}

export interface HausdorffResult {
  directedUserToGuide: number; // Max distance from user point to closest guide point
  directedGuideToUser: number; // Max distance from guide point to closest user point
  maxHausdorff: number; // Classic Hausdorff distance
  modifiedUserToGuide: number; // Average min distance (Adherence / Precision)
  modifiedGuideToUser: number; // Average min distance (Coverage / Completeness)
  modifiedHausdorff: number; // Symmetric Modified Hausdorff distance
}

export interface PathSimilarityResult {
  similarityScore: number; // 0 to 100 percentage
  dtw: DTWResult;
  hausdorff: HausdorffResult;
  pathAdherenceRatio: number; // 0 to 1 (how closely user stayed on path)
  coverageRatio: number; // 0 to 1 (how much of the character guide was traced)
  minStrokeCoverage: number; // Lowest completion across strokes, including every dot.
  lengthRatio: number; // User path length / Guide path length
  averageDeviation: number; // Average distance from centerline in canvas units
  strayRatio: number; // Ratio of user points wandering far off character
  isTooShort: boolean; // True if user only drew tiny dots or short scribbles
}

/**
 * Calculates Euclidean distance between two 2D stroke points.
 */
export function pointDistance(p1: StrokePoint, p2: StrokePoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates total arc length of a polyline.
 */
export function calculatePolylineLength(points: StrokePoint[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += pointDistance(points[i], points[i + 1]);
  }
  return len;
}

/**
 * Resamples a polyline so points are evenly spaced by at most `stepSize`.
 */
export function resamplePolyline(points: StrokePoint[], stepSize: number = 2.0): StrokePoint[] {
  if (points.length < 2) return [...points];
  const sampled: StrokePoint[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = pointDistance(p1, p2);

    if (dist > stepSize) {
      const steps = Math.floor(dist / stepSize);
      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        sampled.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        });
      }
    }
    sampled.push(p2);
  }

  return sampled;
}

/**
 * Computes Dynamic Time Warping (DTW) distance between two point sequences.
 */
export function computeDTWDistance(seq1: StrokePoint[], seq2: StrokePoint[]): DTWResult {
  const n = seq1.length;
  const m = seq2.length;

  if (n === 0 || m === 0) {
    return { rawDTW: Infinity, normalizedDTW: Infinity, pathLength: 0 };
  }

  const dtw: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(Infinity)
  );

  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = pointDistance(seq1[i - 1], seq2[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],
        dtw[i][j - 1],
        dtw[i - 1][j - 1]
      );
    }
  }

  let i = n;
  let j = m;
  let pathLength = 0;

  while (i > 0 || j > 0) {
    pathLength++;
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const diag = dtw[i - 1][j - 1];
      const left = dtw[i][j - 1];
      const up = dtw[i - 1][j];

      if (diag <= left && diag <= up) {
        i--;
        j--;
      } else if (left <= up) {
        j--;
      } else {
        i--;
      }
    }
  }

  const rawDTW = dtw[n][m];
  const normalizedDTW = pathLength > 0 ? rawDTW / pathLength : rawDTW / (n + m);

  return {
    rawDTW,
    normalizedDTW,
    pathLength,
  };
}

/**
 * Computes Classic and Modified Hausdorff Distances between User and Guide point sets.
 */
export function computeHausdorffDistance(
  userPoints: StrokePoint[],
  guidePoints: StrokePoint[]
): HausdorffResult {
  if (userPoints.length === 0 || guidePoints.length === 0) {
    return {
      directedUserToGuide: Infinity,
      directedGuideToUser: Infinity,
      maxHausdorff: Infinity,
      modifiedUserToGuide: Infinity,
      modifiedGuideToUser: Infinity,
      modifiedHausdorff: Infinity,
    };
  }

  // 1. User -> Guide (Precision / Adherence)
  let maxDistUserToGuide = 0;
  let sumDistUserToGuide = 0;

  for (const uPt of userPoints) {
    let minDist = Infinity;
    for (const gPt of guidePoints) {
      const d = pointDistance(uPt, gPt);
      if (d < minDist) minDist = d;
    }
    if (minDist > maxDistUserToGuide) maxDistUserToGuide = minDist;
    sumDistUserToGuide += minDist;
  }

  const modifiedUserToGuide = sumDistUserToGuide / userPoints.length;

  // 2. Guide -> User (Coverage / Recall)
  let maxDistGuideToUser = 0;
  let sumDistGuideToUser = 0;

  for (const gPt of guidePoints) {
    let minDist = Infinity;
    for (const uPt of userPoints) {
      const d = pointDistance(gPt, uPt);
      if (d < minDist) minDist = d;
    }
    if (minDist > maxDistGuideToUser) maxDistGuideToUser = minDist;
    sumDistGuideToUser += minDist;
  }

  const modifiedGuideToUser = sumDistGuideToUser / guidePoints.length;

  const maxHausdorff = Math.max(maxDistUserToGuide, maxDistGuideToUser);
  const modifiedHausdorff = Math.max(modifiedUserToGuide, modifiedGuideToUser);

  return {
    directedUserToGuide: maxDistUserToGuide,
    directedGuideToUser: maxDistGuideToUser,
    maxHausdorff,
    modifiedUserToGuide,
    modifiedGuideToUser,
    modifiedHausdorff,
  };
}

/**
 * Score the same normalized vector strokes rendered on the writing board.
 * Check adherence, full coverage, small strokes/dots and excessive backtracking.
 */
export function computePathSimilarity(
  userStrokes: StrokePoint[][],
  guideStrokes: StrokePoint[][],
  _glyphText?: string,
  _canvasWidth: number = 300,
  _canvasHeight: number = 300,
  componentIds?: number[]
): PathSimilarityResult {
  const valid = (p: StrokePoint) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const guides = guideStrokes.map(s => resamplePolyline(s.filter(valid), 1)).filter(s => s.length > 0);
  const users = userStrokes.map(s => resamplePolyline(s.filter(valid), 1)).filter(s => s.length > 0);
  const guidePoints = guides.flat();
  const userPoints = users.flat();
  // Ignore tiny hand tremors when measuring length, while keeping real loops/backtracking.
  const simplify = (points: StrokePoint[]) => {
    if (points.length < 3) return points;
    const keep = new Set([0, points.length - 1]);
    const stack: [number, number][] = [[0, points.length - 1]];
    while (stack.length) {
      const [start, end] = stack.pop()!;
      const a = points[start], b = points[end];
      const dx = b.x - a.x, dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      let maximum = 2, split = -1;
      for (let i = start + 1; i < end; i++) {
        const p = points[i];
        const t = lengthSq ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq)) : 0;
        const distance = pointDistance(p, { x: a.x + t * dx, y: a.y + t * dy });
        if (distance > maximum) { maximum = distance; split = i; }
      }
      if (split >= 0) { keep.add(split); stack.push([start, split], [split, end]); }
    }
    return points.filter((_, i) => keep.has(i));
  };
  const guideLength = guideStrokes.reduce((sum, s) => sum + calculatePolylineLength(simplify(s.filter(valid))), 0);
  const userLength = userStrokes.reduce((sum, s) => sum + calculatePolylineLength(simplify(s.filter(valid))), 0);
  const lengthRatio = guideLength > 0 ? userLength / guideLength : 0;
  const isTooShort = guidePoints.length === 0 || userPoints.length < 3 || lengthRatio < 0.65;
  const thin = (points: StrokePoint[]) => points.length <= 128 ? points : Array.from({ length: 128 }, (_, i) => points[Math.round(i * (points.length - 1) / 127)]);
  const dtw = computeDTWDistance(thin(userPoints), thin(guidePoints));
  const hausdorff = computeHausdorffDistance(thin(userPoints), thin(guidePoints));
  const nearest = (p: StrokePoint, targets: StrokePoint[]) => targets.reduce((best, t) => Math.min(best, pointDistance(p, t)), Infinity);
  // A single tap must not count as two neighboring dots. Match each pen stroke to one ink component.
  const assigned = new Map<number, StrokePoint[]>();
  if (componentIds?.length === guides.length) {
    const components = new Map<number, StrokePoint[]>();
    guides.forEach((stroke, i) => components.set(componentIds[i], [...(components.get(componentIds[i]) || []), ...stroke]));
    for (const stroke of users) {
      let component = -1, best = Infinity;
      for (const [id, points] of components) {
        const distance = stroke.reduce((sum, p) => sum + nearest(p, points), 0) / stroke.length;
        if (distance < best) { best = distance; component = id; }
      }
      assigned.set(component, [...(assigned.get(component) || []), ...stroke]);
    }
  }
  const distances = userPoints.map(p => nearest(p, guidePoints));
  // Evaluate the exact vector stencil shown on BOTH native and web. Never use an unrelated font mask.
  const strokeCoverages = guides.map((stroke, i) => {
    const radius = stroke.length === 1 ? 3.5 : 4.5;
    const matchingPoints = componentIds?.length === guides.length ? (assigned.get(componentIds[i]) || []) : userPoints;
    return stroke.filter(p => nearest(p, matchingPoints) <= radius).length / stroke.length;
  });
  const minStrokeCoverage = strokeCoverages.length ? Math.min(...strokeCoverages) : 0;
  const covered = guidePoints.filter(p => nearest(p, userPoints) <= 4.5).length;
  const coverageRatio = guidePoints.length ? covered / guidePoints.length : 0;
  const pathAdherenceRatio = distances.length ? distances.filter(d => d <= 4.5).length / distances.length : 0;
  const strayRatio = distances.length ? distances.filter(d => d > 8).length / distances.length : 1;
  const averageDeviation = distances.length ? distances.reduce((sum, d) => sum + d, 0) / distances.length : 0;
  // Completeness includes every dot/diacritic; repeated scribbles cannot earn mastery.
  let score = 100 * (0.45 * pathAdherenceRatio + 0.40 * coverageRatio + 0.15 * minStrokeCoverage) - strayRatio * 45;
  if (isTooShort) score = Math.min(score, 25);
  if (minStrokeCoverage < 0.8 || coverageRatio < 0.85) score = Math.min(score, 75);
  if (lengthRatio > 1.65) score = Math.min(score, 70);
  if (pathAdherenceRatio < 0.85 || strayRatio > 0.1) score = Math.min(score, 75);
  return {
    similarityScore: Math.round(Math.max(0, Math.min(100, score))), dtw, hausdorff,
    pathAdherenceRatio, coverageRatio, minStrokeCoverage, lengthRatio,
    averageDeviation: Math.round(averageDeviation * 10) / 10, strayRatio, isTooShort,
  };
}


