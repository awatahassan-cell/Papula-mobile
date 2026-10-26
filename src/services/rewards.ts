/**
 * The reward economy in one place. Rewards are only for learning letters and practising: no free start, no daily gifts,
 * and no deadline, so a child who comes back after a break loses nothing.
 */
export const REWARDS = {
  startingStars: 0, // nothing is given for free: stars come from learning and practising
  lessonComplete: 2,
  writingMastery: 2,
  firstStory: 3,
  firstWord: 1,
  gamePerKindPerDay: 2,
  dailyPractice: 3,
  allMissionsBonus: 3,
} as const;

const DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const kurdishDigits = (n: number) => String(n).replace(/\d/g, d => DIGITS[Number(d)]);
