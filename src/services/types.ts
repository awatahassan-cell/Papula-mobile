/**
 * Domain types and repository interfaces for Papoole (Kurdish Kids App)
 * Designed for Phase 1 (mock data) and seamless Phase 2 (backend API swap).
 */

export interface ExampleWord {
  id: string;
  word: string;
  transliteration?: string;
  meaningEn: string;
  meaningKu: string;
  imageEmoji: string; // kid-friendly icon/emoji/svg
  imageUrl?: string;
  soundPlaceholder: string;
  verifiedByTeacher: boolean; // Flag indicating native Kurdish teacher verification status
}

export interface LetterForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface StrokePoint {
  x: number; // Normalized 0-100 coordinate
  y: number; // Normalized 0-100 coordinate
}

export interface StrokeGuide {
  outlinePath?: string; // Exact bundled-font outline in normalized board coordinates.
  componentIds?: number[]; // Separate ink components (body, dots, diacritics) for each centerline.
  letterId: string;
  strokes: StrokePoint[][]; // array of strokes, each stroke is an array of points
  instructionKu: string;
  suggestedSpeedMs?: number;
}

export interface LetterItem {
  phonemeAudioUri?: string; // Reviewed isolated sound recording, distinct from the spoken letter name.
  id: string;
  glyph: string;
  name: string;
  soundPlaceholder: string;
  phoneticAudioFreq?: number; // fallback synthetic frequency
  forms: LetterForms;
  exampleWords: [ExampleWord, ExampleWord, ExampleWord];
  isHeavySound?: boolean; // e.g. ڕ and ڵ
  strokeGuide?: StrokeGuide;
}

export interface StoryWordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface StoryQuiz {
  questionKu: string;
  options: {
    id: string;
    textKu: string;
    imageEmoji: string;
    isCorrect: boolean;
  }[];
}

export interface StoryPage {
  pageNumber: number;
  textKu: string;
  illustrationTheme: string;
  illustrationSvgId: string;
  audioDurationMs: number;
  wordTimings: StoryWordTiming[];
}

export interface StoryItem {
  practiceMode?: 'listen' | 'read';
  id: string;
  titleKu: string;
  titleEn: string;
  level: 1 | 2 | 3;
  durationMinutes: number;
  isPremium: boolean;
  coverEmoji: string;
  coverThemeColor: string;
  summaryKu: string;
  pages: StoryPage[];
  quiz: StoryQuiz;
}

export interface StickerItem {
  id: string;
  nameKu: string;
  emoji: string;
  unlockedAtStars: number;
  category: 'animals' | 'nature' | 'space' | 'kurdish_culture';
}

export interface BadgeItem {
  id: string;
  titleKu: string;
  titleEn: string;
  descriptionKu: string;
  icon: string;
  badgeColor: string;
  category: 'letters' | 'stories' | 'stars' | 'writing' | 'streak';
  targetType: 'mastered_letters' | 'read_stories' | 'total_stars' | 'streak_days' | 'saved_words';
  targetCount: number;
}

export interface DailyMission {
  id: string;
  titleKu: string;
  titleEn: string;
  descriptionKu: string;
  icon: string;
  targetType: 'trace_letters' | 'read_stories' | 'match_game' | 'save_word' | 'daily_practice';
  targetCount: number;
  currentCount: number;
  starReward: number;
  completed: boolean;
  claimed: boolean;
  actionRoute: 'writing' | 'stories' | 'match-game' | 'alphabet' | 'daily-practice';
}

export interface ChildProfile {
  skillProgress?: Partial<Record<LearningSkill, SkillProgress>>;
  writingProgress?: Record<string, WritingProgress>;
  placement?: { completedAt: string; correct: number; total: number; recommendedLevel: 1 | 2 | 3; letterIds: string[] };
  practiceSeconds?: number;
  letterReviews?: Record<string, LetterReview>;
  learnedWordIds?: string[];
  dailyPracticeRewardDate?: string;
  gameRewardDates?: Record<string, string>;
  storyPracticeDates?: Record<string, string>;
  id: string;
  name: string;
  avatar: string; // 🦊, 🐻, 🦁, 🐰, 🦋, 🐬
  ageGroup: '3-4' | '5-6' | '7-8';
  stars: number;
  streakDays: number;
  lastActiveDate: string;
  masteredLetterIds: string[];
  inProgressLetterIds: string[];
  readStoryIds: string[];
  unlockedStickerIds: string[];
  unlockedBadgeIds?: string[];
  savedWords: string[];
  dailyPracticeCompletedToday: boolean;
  letterScores?: Record<string, LetterScoreRecord>;
  dailyMissions?: DailyMission[];
  lastMissionsDate?: string;
  dailyMissionsBonusClaimedDate?: string;
}

export type LearningSkill = 'recognition' | 'forms' | 'phonics' | 'word' | 'writing' | 'reading';
export type WritingMode = 'trace' | 'copy' | 'independent';
export interface SkillProgress { independentCorrect?: number; attempts: number; correct: number; helped: number; lastAt: string; }
export interface WritingProgress { tracePassed: boolean; copyPassed: boolean; independentPassDates: string[]; }

export interface LetterReview {
  attempts: number;
  correct: number;
  errors: number;
  level: number;
  lastPracticedAt: string;
  lastCorrectDate?: string;
  dueAt: string;
}

export interface ParentSettings {
  dailyLimitMinutes: number;
  bedtimeLockEnabled: boolean;
  soundFxEnabled: boolean;
  narrationVolume: number; // 0 to 1
  isSubscribed: boolean;
  activePlan: 'none' | 'monthly' | 'yearly';
  trialEndDate?: string;
  language: 'sorani' | 'kurmanji';
}

export interface WeeklyStats {
  minutesSpent: number;
  lettersMasteredCount: number;
  storiesReadCount: number;
  accuracyAverage: number;
  needsPracticeLetterIds: string[];
}

// ================= REPOSITORY INTERFACES =================

export interface LetterScoreRecord {
  letterId: string;
  bestScore: number; // 0-100 score
  bestStars: number; // 1-3 stars
  updatedAt: string;
}

export interface WritingRepository {
  saveBestScore(
    childId: string,
    letterId: string,
    score: number,
    stars: number
  ): Promise<LetterScoreRecord>;
  getBestScore(childId: string, letterId: string): Promise<LetterScoreRecord | undefined>;
  getAllBestScores(childId: string): Promise<Record<string, LetterScoreRecord>>;
}

export interface LettersRepository {
  getAllLetters(): Promise<LetterItem[]>;
  getLetterById(id: string): Promise<LetterItem | undefined>;
  getStrokeGuide(id: string): Promise<StrokeGuide | undefined>;
  getExampleWords(id: string): Promise<ExampleWord[]>;
}

export interface StoriesRepository {
  getAllStories(): Promise<StoryItem[]>;
  getStoryById(id: string): Promise<StoryItem | undefined>;
  getFeaturedStory(): Promise<StoryItem>;
}

export interface ProgressRepository {
  getChildProfile(id: string): Promise<ChildProfile | undefined>;
  saveChildProfile(profile: ChildProfile): Promise<void>;
  getAllProfiles(): Promise<ChildProfile[]>;
  recordLetterPractice(childId: string, letterId: string, starsEarned: number): Promise<void>;
  recordStoryCompleted(childId: string, storyId: string): Promise<void>;
  getWeeklyStats(childId: string): Promise<WeeklyStats>;
}

export interface AuthRepository {
  getParentSettings(): Promise<ParentSettings>;
  saveParentSettings(settings: ParentSettings): Promise<void>;
  verifyParentGate(questionAnswer: number, userAnswer: number): Promise<boolean>;
  mockSubscribe(plan: 'monthly' | 'yearly'): Promise<boolean>;
  mockRestorePurchases(): Promise<boolean>;
}
