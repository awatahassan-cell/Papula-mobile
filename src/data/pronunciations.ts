/**
 * How a word must be written for the voice so that it is read right. The app still looks words up by their normal spelling;
 * when a hinted recording exists it is played, otherwise the plain one (so nothing goes silent while a word waits to be re-recorded).
 *
 * A bare word is read by the voice with its own guesses: «ورچ» came out as «وەرچ» and «مریشک» as «میریشک» (a vowel was added
 * between the first two letters). The spellings below are the first thing to try; listen to the recording and change the hint if it is still wrong,
 * then run `node scripts/generate-offline-audio.cjs --standalone-all-words --generate` (only the changed word is recorded again).
 */
export const SPOKEN_AS: Record<string, string> = {
  'ورچ': 'وِرچ',
  'مریشک': 'مْریشک',
};
export const spokenAs = (text: string): string => SPOKEN_AS[text.trim()] ?? text;
