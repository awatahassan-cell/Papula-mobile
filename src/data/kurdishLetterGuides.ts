import { StrokeGuide } from '../services/types';
import fontLetterGuides from './fontLetterGuides.json';

/** Exact outlines and centerlines extracted from the app's bundled IBM Plex Sans Arabic font. */
export const KURDISH_STROKE_GUIDES = fontLetterGuides as Record<string, StrokeGuide & { glyph: string }>;

export function getKurdishStrokeGuide(letterIdOrGlyph: string): StrokeGuide | undefined {
  if (KURDISH_STROKE_GUIDES[letterIdOrGlyph]) return KURDISH_STROKE_GUIDES[letterIdOrGlyph];
  const glyph = letterIdOrGlyph === 'ه' ? 'ھ' : letterIdOrGlyph;
  return Object.values(KURDISH_STROKE_GUIDES).find(guide => guide.glyph === glyph);
}
