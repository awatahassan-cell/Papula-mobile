import { StrokeGuide, StrokePoint } from './types';
import {
  computePathSimilarity,
  DTWResult,
  HausdorffResult,
  PathSimilarityResult,
  resamplePolyline,
} from './pathSimilarity';

export interface TracingScoreResult {
  score: number; // 0 to 100
  stars: 1 | 2 | 3;
  mastered: boolean;
  coverageRatio: number; // 0 to 1 (path completion)
  averageDeviation: number; // in canvas units (0-100 scale)
  accuracyRatio: number; // 0 to 1 (points staying on-line)
  lengthRatio: number; // User path length vs Guide path length
  feedbackKu: string;
  dtw: DTWResult;
  hausdorff: HausdorffResult;
  breakdown: {
    pathSimilarityScore: number; // DTW + Hausdorff path similarity percentage (0-100)
    dtwNormalizedDistance: number; // DTW warping distance per point
    hausdorffDistance: number; // Symmetric Modified Hausdorff distance
    pathAdherenceScore: number; // 0 to 100 based on low deviation from centerline
    pathCoverageScore: number; // 0 to 100 based on stroke progress
    offPathPenalty: number; // penalty deducted for stray scribbles
    averageDeviationPx: number; // formatted average deviation
  };
}

/**
 * Normalize guide input into an array of stroke polylines: StrokePoint[][]
 */
function normalizeGuideStrokes(guide: StrokePoint[] | StrokePoint[][]): StrokePoint[][] {
  if (!guide || guide.length === 0) return [];
  if (Array.isArray(guide[0])) {
    return guide as StrokePoint[][];
  }
  return [guide as StrokePoint[]];
}

/**
 * Evaluate the displayed writing guide, including every small stroke and dot.
 * Three stars grant mastery; partial or stray traces remain practice attempts.
 */
export function evaluateTracing(
  guide: StrokePoint[] | StrokePoint[][] | StrokeGuide,
  userStrokes: StrokePoint[][],
  toleranceRadius: number = 9.5,
  glyphText?: string,
  canvasWidth: number = 300,
  canvasHeight: number = 300
): TracingScoreResult {
  const guideStrokes = Array.isArray(guide) ? normalizeGuideStrokes(guide) : guide.strokes;
  const componentIds = Array.isArray(guide) ? undefined : guide.componentIds;

  // Use the board's vector geometry consistently across web and native.
  const pathSim: PathSimilarityResult = computePathSimilarity(
    userStrokes,
    guideStrokes,
    glyphText,
    canvasWidth,
    canvasHeight,
    componentIds
  );

  // If user made no stroke or empty input
  if (userStrokes.length === 0 || userStrokes.every((s) => s.length === 0)) {
    return {
      score: 0,
      stars: 1,
      mastered: false,
      coverageRatio: 0,
      averageDeviation: 0,
      accuracyRatio: 0,
      lengthRatio: 0,
      feedbackKu: 'پەنجەت بەسەر هێڵەکاندا بخشێنە بۆ نووسین ✍️',
      dtw: pathSim.dtw,
      hausdorff: pathSim.hausdorff,
      breakdown: {
        pathSimilarityScore: 0,
        dtwNormalizedDistance: 0,
        hausdorffDistance: 0,
        pathAdherenceScore: 0,
        pathCoverageScore: 0,
        offPathPenalty: 0,
        averageDeviationPx: 0,
      },
    };
  }

  const score = pathSim.similarityScore;

  // Determine Stars and Pedagogical Kurdish Feedback
  let stars: 1 | 2 | 3 = 1;
  let feedbackKu = '';

  if (pathSim.isTooShort) {
    stars = 1;
    feedbackKu = 'تەنها چەند خاڵێک یان هێڵێکی کورت بوو! دەبێت تەواوی پیتەکە بنووسیت ✍️';
  } else if (score >= 82 && pathSim.coverageRatio >= 0.85 && pathSim.minStrokeCoverage >= 0.8 && pathSim.pathAdherenceRatio >= 0.85 && pathSim.strayRatio <= 0.1 && pathSim.lengthRatio <= 1.65) {
    stars = 3;
    if (pathSim.averageDeviation <= 4.0) {
      feedbackKu = 'دەستەکانت زێڕینن! تەواو لەسەر هێڵە سەرەکییەکە نووسیت ⭐⭐⭐';
    } else {
      feedbackKu = 'زۆر نایابە! بە شێوەیەکی ناوازە لەسەر ڕێڕەوی پیتەکە بوو ⭐⭐⭐';
    }
  } else if (score >= 55 && pathSim.coverageRatio >= 0.50) {
    stars = 2;
    if (pathSim.minStrokeCoverage < 0.8) {
      feedbackKu = 'باشە! هەموو هێڵ و خاڵەکانی پیتەکە تەواو بکە، پاشان دووبارە تاقی بکەرەوە ✍️';
    } else if (pathSim.coverageRatio < 0.65) {
      feedbackKu = 'زۆر باشە! لەسەر هێڵەکە بوویت، تەواوی پیتەکە تەواو بکە ⭐⭐';
    } else {
      feedbackKu = 'دەستت خۆش بێت! کەمێک لادانت هەبوو، زیاتر ڕێکی بخە ⭐⭐';
    }
  } else {
    stars = 1;
    if (pathSim.coverageRatio < 0.50) {
      feedbackKu = 'هێڵەکان تەواو بکە و بەسەر تەواوی ڕێڕەوی پیتەکەدا بخشێنە ✍️';
    } else if (pathSim.strayRatio > 0.35) {
      feedbackKu = 'هەوڵبدە لەسەر هێڵی سەرەکی پیتەکە بڕۆیت و دەرنەچیت ✍️';
    } else {
      feedbackKu = 'هەنگاو بە هەنگاو فێر دەبیت! جارێکی تر لەسەر خەت تاقی بکەرەوە ⭐';
    }
  }

  return {
    score,
    stars,
    mastered: stars === 3,
    coverageRatio: pathSim.coverageRatio,
    averageDeviation: pathSim.averageDeviation,
    accuracyRatio: Math.round(pathSim.pathAdherenceRatio * 100) / 100,
    lengthRatio: pathSim.lengthRatio,
    feedbackKu,
    dtw: pathSim.dtw,
    hausdorff: pathSim.hausdorff,
    breakdown: {
      pathSimilarityScore: score,
      dtwNormalizedDistance: Math.round(pathSim.dtw.normalizedDTW * 10) / 10,
      hausdorffDistance: Math.round(pathSim.hausdorff.modifiedHausdorff * 10) / 10,
      pathAdherenceScore: Math.round(pathSim.pathAdherenceRatio * 100),
      pathCoverageScore: Math.round(pathSim.coverageRatio * 100),
      offPathPenalty: Math.round(pathSim.strayRatio * 30),
      averageDeviationPx: pathSim.averageDeviation,
    },
  };
}

/**
 * Unit test helper for verification of DTW & Hausdorff scoring
 */
export function runTracingScorerTests(): { passed: boolean; message: string }[] {
  const wawGuide = [
    [
      { x: 58, y: 46 },
      { x: 66, y: 42 },
      { x: 62, y: 34 },
      { x: 50, y: 38 },
      { x: 54, y: 48 },
      { x: 54, y: 62 },
      { x: 44, y: 76 },
      { x: 32, y: 82 },
    ],
    [
      { x: 64, y: 28 },
      { x: 56, y: 20 },
      { x: 48, y: 28 },
    ],
  ];

  // Test 1: Empty input returns gentle 1 star
  const emptyRes = evaluateTracing(wawGuide, []);
  const test1 = {
    passed: emptyRes.stars === 1 && emptyRes.score <= 25,
    message: 'Empty stroke returns gentle 1-star evaluation',
  };

  // Test 2: Random 6 dots on guide points must be penalized (1 star, <= 30 score)
  const sixDots = [
    [{ x: 58, y: 46 }],
    [{ x: 66, y: 42 }],
    [{ x: 50, y: 38 }],
    [{ x: 44, y: 76 }],
    [{ x: 64, y: 28 }],
    [{ x: 48, y: 28 }],
  ];
  const sixDotsRes = evaluateTracing(wawGuide, sixDots);
  const test2 = {
    passed: sixDotsRes.stars === 1 && sixDotsRes.score <= 30,
    message: 'Six random dots yield 1 star and score <= 30 (not 68% or 3 stars)',
  };

  // Test 3: Accurate full tracing of 'ۆ' using DTW & Hausdorff gives 3 stars (>= 85)
  const perfectTraceWaw = wawGuide.map((stroke) => resamplePolyline(stroke, 2.0));
  const wawRes = evaluateTracing(wawGuide, perfectTraceWaw);
  const test3 = {
    passed: wawRes.stars === 3 && wawRes.score >= 85,
    message: 'Accurate full tracing on ۆ using DTW & Hausdorff gives 3 stars',
  };

  return [test1, test2, test3];
}
