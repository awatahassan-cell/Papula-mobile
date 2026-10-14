import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockLetters } from '../data/mockLetters';
import { mockStories } from '../data/mockStories';
import { getKurdishStrokeGuide } from '../data/kurdishLetterGuides';
import {
  AuthRepository,
  ChildProfile,
  ExampleWord,
  LetterItem,
  LetterScoreRecord,
  LettersRepository,
  ParentSettings,
  ProgressRepository,
  StoriesRepository,
  StoryItem,
  StrokeGuide,
  WeeklyStats,
  WritingRepository,
} from './types';

const PROFILES_STORAGE_KEY = 'papoole_child_profiles_v1';
const PARENT_SETTINGS_KEY = 'papoole_parent_settings_v1';

export const defaultChildProfile: ChildProfile = {
  id: 'child-1',
  name: 'ڕۆژین',
  avatar: '🦋',
  ageGroup: '5-6',
  stars: 12,
  streakDays: 3,
  lastActiveDate: new Date().toISOString(),
  masteredLetterIds: ['hamza', 'alif', 'ba'],
  inProgressLetterIds: ['pa', 'ta', 'jim'],
  readStoryIds: ['story-butterfly'],
  unlockedStickerIds: ['stk-butterfly', 'stk-fox', 'stk-bear'],
  savedWords: ['پەپوولە', 'ئاسک', 'باران'],
  dailyPracticeCompletedToday: false,
};

export const defaultParentSettings: ParentSettings = {
  dailyLimitMinutes: 30,
  bedtimeLockEnabled: false,
  soundFxEnabled: true,
  narrationVolume: 0.9,
  isSubscribed: false,
  activePlan: 'none',
  trialEndDate: undefined,
  language: 'sorani',
};

// ================= 1. LETTERS REPOSITORY =================
export class MobileLettersRepository implements LettersRepository {
  async getAllLetters(): Promise<LetterItem[]> {
    return [...mockLetters];
  }

  async getLetterById(id: string): Promise<LetterItem | undefined> {
    return mockLetters.find((l) => l.id === id);
  }

  async getStrokeGuide(id: string): Promise<StrokeGuide | undefined> {
    const kurdishGuide = getKurdishStrokeGuide(id);
    if (kurdishGuide) return kurdishGuide;

    const letter = mockLetters.find((l) => l.id === id);
    if (letter?.glyph) {
      const byGlyph = getKurdishStrokeGuide(letter.glyph);
      if (byGlyph) return byGlyph;
    }
    if (letter?.strokeGuide) return letter.strokeGuide;

    return undefined;
  }

  async getExampleWords(id: string): Promise<ExampleWord[]> {
    const letter = mockLetters.find((l) => l.id === id);
    return letter ? [...letter.exampleWords] : [];
  }
}

// ================= 2. STORIES REPOSITORY =================
export class MobileStoriesRepository implements StoriesRepository {
  async getAllStories(): Promise<StoryItem[]> {
    return [...mockStories];
  }

  async getStoryById(id: string): Promise<StoryItem | undefined> {
    return mockStories.find((s) => s.id === id);
  }

  async getFeaturedStory(): Promise<StoryItem> {
    return mockStories[0];
  }
}

// In-memory cache for ultra-fast sync access in RN
let cachedProfiles: ChildProfile[] | null = null;
let cachedSettings: ParentSettings | null = null;

// ================= 3. PROGRESS REPOSITORY =================
export class MobileProgressRepository implements ProgressRepository {
  private async getProfilesFromStorage(): Promise<ChildProfile[]> {
    if (cachedProfiles) return cachedProfiles;
    try {
      const data = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
      if (data) {
        cachedProfiles = JSON.parse(data);
        return cachedProfiles!;
      }
    } catch {
      // Storage fallback
    }
    cachedProfiles = [defaultChildProfile];
    return cachedProfiles;
  }

  private async saveProfilesToStorage(profiles: ChildProfile[]): Promise<void> {
    cachedProfiles = profiles;
    try {
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save child profiles to AsyncStorage:', e);
    }
  }

  async getAllProfiles(): Promise<ChildProfile[]> {
    return this.getProfilesFromStorage();
  }

  async getChildProfile(id: string): Promise<ChildProfile | undefined> {
    const profiles = await this.getProfilesFromStorage();
    return profiles.find((p) => p.id === id) || profiles[0];
  }

  async saveChildProfile(profile: ChildProfile): Promise<void> {
    const profiles = await this.getProfilesFromStorage();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    await this.saveProfilesToStorage(profiles);
  }

  async recordLetterPractice(childId: string, letterId: string, starsEarned: number): Promise<void> {
    const profiles = await this.getProfilesFromStorage();
    const profile = profiles.find((p) => p.id === childId) || profiles[0];

    profile.stars += starsEarned;
    if (starsEarned >= 2 && !profile.masteredLetterIds.includes(letterId)) {
      profile.masteredLetterIds.push(letterId);
      profile.inProgressLetterIds = profile.inProgressLetterIds.filter((id) => id !== letterId);
    } else if (!profile.inProgressLetterIds.includes(letterId) && !profile.masteredLetterIds.includes(letterId)) {
      profile.inProgressLetterIds.push(letterId);
    }

    await this.saveProfilesToStorage(profiles);
  }

  async recordStoryCompleted(childId: string, storyId: string): Promise<void> {
    const profiles = await this.getProfilesFromStorage();
    const profile = profiles.find((p) => p.id === childId) || profiles[0];

    if (!profile.readStoryIds.includes(storyId)) {
      profile.readStoryIds.push(storyId);
      profile.stars += 3;
    }
    await this.saveProfilesToStorage(profiles);
  }

  async getWeeklyStats(childId: string): Promise<WeeklyStats> {
    const profile = (await this.getChildProfile(childId)) || defaultChildProfile;
    const allLetterIds = mockLetters.map((l) => l.id);
    const unmastered = allLetterIds.filter((id) => !profile.masteredLetterIds.includes(id));

    return {
      minutesSpent: Math.round((profile.practiceSeconds||0)/60),
      lettersMasteredCount: profile.masteredLetterIds.length,
      storiesReadCount: profile.readStoryIds.length,
      accuracyAverage: (()=>{const records=Object.values(profile.skillProgress||{}).filter(Boolean);const total=records.reduce((n,r)=>n+r.attempts,0);return total?Math.round(records.reduce((n,r)=>n+r.correct,0)/total*100):0;})(),
      needsPracticeLetterIds: unmastered.slice(0, 4),
    };
  }
}

// ================= 4. AUTH REPOSITORY =================
export class MobileAuthRepository implements AuthRepository {
  async getParentSettings(): Promise<ParentSettings> {
    if (cachedSettings) return cachedSettings;
    try {
      const data = await AsyncStorage.getItem(PARENT_SETTINGS_KEY);
      if (data) {
        cachedSettings = JSON.parse(data);
        return cachedSettings!;
      }
    } catch {
      // fallback
    }
    cachedSettings = defaultParentSettings;
    return cachedSettings;
  }

  async saveParentSettings(settings: ParentSettings): Promise<void> {
    cachedSettings = settings;
    try {
      await AsyncStorage.setItem(PARENT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save parent settings to AsyncStorage:', e);
    }
  }

  async verifyParentGate(questionAnswer: number, userAnswer: number): Promise<boolean> {
    return Number(questionAnswer) === Number(userAnswer);
  }

  async mockSubscribe(plan: 'monthly' | 'yearly'): Promise<boolean> {
    const settings = await this.getParentSettings();
    settings.isSubscribed = true;
    settings.activePlan = plan;
    settings.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await this.saveParentSettings(settings);
    return true;
  }

  async mockRestorePurchases(): Promise<boolean> {
    const settings = await this.getParentSettings();
    settings.isSubscribed = true;
    settings.activePlan = 'yearly';
    await this.saveParentSettings(settings);
    return true;
  }
}

// ================= 5. WRITING REPOSITORY =================
export class MobileWritingRepository implements WritingRepository {
  private async getProfilesFromStorage(): Promise<ChildProfile[]> {
    if (cachedProfiles) return cachedProfiles;
    try {
      const data = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
      if (data) {
        cachedProfiles = JSON.parse(data);
        return cachedProfiles!;
      }
    } catch {
      // fallback
    }
    cachedProfiles = [defaultChildProfile];
    return cachedProfiles;
  }

  private async saveProfilesToStorage(profiles: ChildProfile[]): Promise<void> {
    cachedProfiles = profiles;
    try {
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save child profiles to AsyncStorage:', e);
    }
  }

  async saveBestScore(
    childId: string,
    letterId: string,
    score: number,
    stars: number
  ): Promise<LetterScoreRecord> {
    const profiles = await this.getProfilesFromStorage();
    const profile = profiles.find((p) => p.id === childId) || profiles[0];

    if (!profile.letterScores) {
      profile.letterScores = {};
    }

    const existing = profile.letterScores[letterId];
    const bestScore = Math.max(existing?.bestScore || 0, score);
    const bestStars = Math.max(existing?.bestStars || 0, stars);

    const record: LetterScoreRecord = {
      letterId,
      bestScore,
      bestStars,
      updatedAt: new Date().toISOString(),
    };

    profile.letterScores[letterId] = record;

    if (!profile.inProgressLetterIds.includes(letterId) && !profile.masteredLetterIds.includes(letterId)) profile.inProgressLetterIds.push(letterId);

    await this.saveProfilesToStorage(profiles);
    return record;
  }

  async getBestScore(childId: string, letterId: string): Promise<LetterScoreRecord | undefined> {
    const profiles = await this.getProfilesFromStorage();
    const profile = profiles.find((p) => p.id === childId) || profiles[0];
    return profile.letterScores?.[letterId];
  }

  async getAllBestScores(childId: string): Promise<Record<string, LetterScoreRecord>> {
    const profiles = await this.getProfilesFromStorage();
    const profile = profiles.find((p) => p.id === childId) || profiles[0];
    return profile.letterScores || {};
  }
}

// Export singletons
export const lettersRepo: LettersRepository = new MobileLettersRepository();
export const storiesRepo: StoriesRepository = new MobileStoriesRepository();
export const progressRepo: ProgressRepository = new MobileProgressRepository();
export const authRepo: AuthRepository = new MobileAuthRepository();
export const writingRepo: WritingRepository = new MobileWritingRepository();
