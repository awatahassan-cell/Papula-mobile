/**
 * The reward economy in one place. A child who plays about ten minutes a day (one letter journey, two games, one story)
 * earns about TYPICAL_DAILY_STARS, so star goals are spaced to be reached over roughly a month, not in two days.
 */
export const REWARDS = {
  startingStars: 5,
  lessonComplete: 2,
  writingMastery: 2,
  firstStory: 3,
  firstWord: 1,
  gamePerKindPerDay: 2,
  dailyPractice: 3,
  allMissionsBonus: 3,
} as const;
/** A child who plays three days out of seven averages about this many stars per calendar day. */
export const IRREGULAR_DAILY_STARS = 4;
export const TYPICAL_DAILY_STARS = REWARDS.lessonComplete + 2 * REWARDS.gamePerKindPerDay + REWARDS.firstStory;

const DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const kurdishDigits = (n: number) => String(n).replace(/\d/g, d => DIGITS[Number(d)]);
