import { finishGardenStep, plantGardenFlower, GardenStep } from '../services/gardenQuest';
import { advanceWriting, writingMastered, skillAttempt, readingPracticeStories } from '../services/foundationalLearning';
import { applyLessonStep, isLessonUnlocked, nextLessonLetter, reconcileLessons } from '../services/lessonPath';
import { usePathname, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { LEARNING_WORDS, learningActivity, localDay, logDay, updateReview, personalStories } from '../services/learningEngine';
import { knownWordId, isVocabId } from '../data/vocabulary';
import { normalizeCheckpoint } from '../services/learningContinuation';
import { mockLetters } from '../data/mockLetters';
import { authRepo, lettersRepo, progressRepo, storiesRepo, writingRepo } from '../services/repositories';
import { soundService } from '../services/soundService';
import { ChildProfile, DailyMission, LetterItem, LetterScoreRecord, ParentSettings, StoryItem, WritingMode, LearningSkill, LessonStep, LearningCheckpoint } from '../services/types';
import { generateDailyMissions, getTodayDateString } from '../data/mockMissions';
import { defaultStrings, LocaleStrings } from '../theme/strings';

export type AppRoute =
  | 'onboarding'
  | 'home'
  | 'garden-quest'
  | 'garden'
  | 'alphabet'
  | 'letter-detail'
  | 'match-game'
  | 'writing'
  | 'word-writing'
  | 'stories'
  | 'story-reader'
  | 'daily-practice'
  | 'stickers'
  | 'badges'
  | 'my-words'
  | 'parent-dashboard'
  | 'paywall';

export interface AppContextType {
  isHydrated: boolean;
  learningPaused: boolean;
  setLearningPaused: (paused: boolean) => void;
  loadError: boolean;
  retryLoad: () => void;
  saveCheckpoint: (checkpoint: LearningCheckpoint) => void;
  clearCheckpoint: () => void;
  recordScreenTime: (log: Record<string, number>, profileId?: string) => void;
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
  goBack: () => void;
  exitConfirmOpen: boolean;
  setExitConfirmOpen: (open: boolean) => void;
  registerBackHandler: (handler: (() => boolean) | null) => void;
  selectedLetter: LetterItem | null;
  setSelectedLetter: (letter: LetterItem | null) => void;
  recordLessonStep: (letterId: string, step: LessonStep, exampleId?: string) => void;
  selectedStory: StoryItem | null;
  setSelectedStory: (story: StoryItem | null) => void;

  profiles: ChildProfile[];
  currentProfile: ChildProfile;
  dailyMissions: DailyMission[];
  switchProfile: (profileId: string) => void;
  createProfile: (profile: Omit<ChildProfile, 'id' | 'stars' | 'streakDays' | 'lastActiveDate' | 'masteredLetterIds' | 'inProgressLetterIds' | 'readStoryIds' | 'unlockedStickerIds' | 'savedWords' | 'dailyPracticeCompletedToday'>) => void;
  completeGardenTask: (step: GardenStep, letterId?: string) => void;
  plantQuestFlower: (spot: number, letterId?: string) => void;
  updateCurrentProfile: (updates: Partial<ChildProfile>) => void;

  parentSettings: ParentSettings;
  updateParentSettings: (settings: Partial<ParentSettings>) => void;

  parentGateOpen: boolean;
  setParentGateOpen: (open: boolean) => void;
  openParentGateWithCallback: (onSuccess: () => void) => void;
  parentGateCallback: (() => void) | null;
  handleParentGateSuccess: () => void;

  paywallOpen: boolean;
  setPaywallOpen: (open: boolean) => void;

  addStars: (amount: number) => void;
  masterLetter: (letterId: string) => void;
  completeStory: (storyId: string) => void;
  saveWord: (word: string) => void;
  completeDailyPractice: () => number;
  recordLearningActivity: () => void;
  saveWritingScore: (letterId: string, score: number, stars: number, mode?: WritingMode, helped?: boolean, seconds?: number) => Promise<LetterScoreRecord>;
  recordPracticeResult: (letterIds: string[], correct: boolean, wordId?: string, skill?: LearningSkill, helped?: boolean) => void;
  recordSkillResult: (skill: LearningSkill, correct: boolean, helped?: boolean) => void;
  savePlacement: (correct: number, total: number, letterIds: string[]) => void;
  finishLearningGame: (kind: 'word' | 'sound' | 'similar' | 'syllables' | 'writing') => number;
  getLetterBestStars: (letterId: string) => number;
  incrementMissionProgress: (targetType: DailyMission['targetType'], amount?: number) => void;
  claimMissionReward: (missionId: string) => void;
  allMissionsCelebrationOpen: boolean;
  setAllMissionsCelebrationOpen: (open: boolean) => void;
  claimAllMissionsBonusReward: (bonusAmount?: number) => number;
  hasClaimedAllMissionsBonusToday: boolean;
  areAllMissionsCompleted: boolean;
  isStreakActiveToday: boolean;
  streakStatus: 'completed_today' | 'needs_practice_today' | 'streak_broken';

  triggerConfetti: () => void;
  strings: LocaleStrings;
}

const AppContext = createContext<AppContextType | null>(null);

const MAIN_TABS: AppRoute[] = ['home', 'alphabet', 'garden', 'stories'];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const route: AppRoute = pathname === '/' ? 'home' : (pathname.slice(1) as AppRoute);
  const historyRef = useRef<AppRoute[]>(['home']);
  const customBackRef = useRef<(() => boolean) | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const navigateInternal = (target: AppRoute) => {
    const path = target === 'home' ? '/' : (`/${target}` as never);
    if (typeof router.replace === 'function') {
      router.replace(path);
    } else {
      router.navigate(path);
    }
  };

  const setRoute = (next: AppRoute) => {
    if (next === 'paywall') return;
    if (next === 'home') {
      historyRef.current = ['home'];
    } else if (MAIN_TABS.includes(next)) {
      historyRef.current = ['home', next];
    } else {
      const withoutNext = historyRef.current.filter((r) => r !== next && r !== 'home');
      historyRef.current = ['home', ...withoutNext.slice(-2), next];
    }
    navigateInternal(next);
  };

  const registerBackHandler = (handler: (() => boolean) | null) => {
    customBackRef.current = handler;
  };

  const [selectedLetter, setSelectedLetterState] = useState<LetterItem | null>(null);
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);

  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [learningPaused, setLearningPaused] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const retryLoad = () => { setLoadError(false); setLoadAttempt(value => value + 1); };
  const [currentProfile, setCurrentProfile] = useState<ChildProfile>({
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
    dailyMissions: generateDailyMissions(),
    lastMissionsDate: getTodayDateString(),
  });

  const profileRef = useRef(currentProfile);
  useEffect(() => { profileRef.current = currentProfile; }, [currentProfile]);

  const setSelectedLetter = (letter: LetterItem | null) => {
    if (!letter || isLessonUnlocked(profileRef.current, letter.id)) setSelectedLetterState(letter);
    else { setSelectedLetterState(nextLessonLetter(profileRef.current) || mockLetters[0]); setRoute('alphabet'); }
  };

  const [parentSettings, setParentSettings] = useState<ParentSettings>({
    appearanceTheme: 'cloud',
    appearanceMode: 'auto',
    dailyLimitMinutes: 30,
    bedtimeLockEnabled: false,
    soundFxEnabled: true,
    narrationVolume: 0.9,
    isSubscribed: false,
    activePlan: 'none',
    language: 'sorani',
  });

  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [parentGateCallback, setParentGateCallback] = useState<(() => void) | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [allMissionsCelebrationOpen, setAllMissionsCelebrationOpen] = useState(false);

  const [isStreakActiveToday, setIsStreakActiveToday] = useState(false);
  const [streakStatus, setStreakStatus] = useState<
    'completed_today' | 'needs_practice_today' | 'streak_broken'
  >('needs_practice_today');

  const ensureMissionsForToday = (profile: ChildProfile): ChildProfile => {
    const todayStr = getTodayDateString();
    if (profile.lastMissionsDate === todayStr && profile.dailyMissions && profile.dailyMissions.length > 0) {
      return profile;
    }
    return {
      ...profile,
      lastMissionsDate: todayStr,
      dailyMissions: generateDailyMissions(),
    };
  };

  const evaluateStreak = (profile: ChildProfile) => {
    const withMissions = ensureMissionsForToday(profile);
    const now = new Date();
    if (!withMissions.lastActiveDate) {
      setIsStreakActiveToday(false);
      setStreakStatus('streak_broken');
      return { ...withMissions, streakDays: 0, dailyPracticeCompletedToday: false };
    }

    const lastActive = new Date(withMissions.lastActiveDate);
    const d1 = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      setIsStreakActiveToday(true);
      setStreakStatus('completed_today');
      return withMissions;
    } else if (diffDays === 1) {
      setIsStreakActiveToday(false);
      setStreakStatus('needs_practice_today');
      return { ...withMissions, dailyPracticeCompletedToday: false };
    } else {
      setIsStreakActiveToday(false);
      setStreakStatus('streak_broken');
      return { ...withMissions, streakDays: 0, dailyPracticeCompletedToday: false };
    }
  };

  useEffect(() => {
    let active = true;
    const safetyTimer = setTimeout(() => {
      if (active) {
        setIsHydrated(true);
      }
    }, 1500);

    async function loadInitialData() {
      try {
        const allProfiles = await progressRepo.getAllProfiles();
        const settings = await authRepo.getParentSettings();

        if (!active) return;

        if (allProfiles.length > 0) {
          const checked = evaluateStreak(allProfiles.find(profile => profile.id === settings.activeProfileId) || allProfiles[0]);
          profileRef.current = checked;
          setCurrentProfile(checked);
          setProfiles(allProfiles.map((p) => (p.id === checked.id ? checked : p)));
        }

        setParentSettings(settings);
        soundService.setSoundFxEnabled(settings.soundFxEnabled);
        soundService.setVolume(settings.narrationVolume);

        const chosen = profileRef.current;
        const checkpoint = chosen.checkpoint;
        const letters = await lettersRepo.getAllLetters();
        const resumeLetter = checkpoint?.kind !== 'story' ? letters.find(letter => letter.id === checkpoint?.contentId && isLessonUnlocked(chosen, letter.id)) : undefined;
        setSelectedLetter(resumeLetter || nextLessonLetter(chosen) || letters[0]);
        const stories = await storiesRepo.getAllStories();
        const resumeStory = checkpoint?.kind === 'story' ? [...stories, ...personalStories(chosen), ...readingPracticeStories(chosen)].find(story => story.id === checkpoint.contentId && (!story.isPremium || settings.isSubscribed)) : undefined;
        if (stories.length) setSelectedStory(resumeStory || stories[0]);
        if (allProfiles.length && route === 'home') {
          if (resumeLetter) navigateInternal(checkpoint?.kind === 'writing' ? 'writing' : 'letter-detail');
          else if (resumeStory) navigateInternal('story-reader');
        }
      } catch (err) {
        console.warn('loadInitialData failed:', err);
        setLoadError(true);
      } finally {
        if (active) {
          clearTimeout(safetyTimer);
          setIsHydrated(true);
        }
      }
    }

    void loadInitialData();
    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load persisted data once on mount
  }, [loadAttempt]);

  const triggerConfetti = () => {
    soundService.playSuccessFanfare();
  };

  const switchProfile = (profileId: string) => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      const checked = evaluateStreak(found);
      profileRef.current = checked;
      setCurrentProfile(checked);
      setSelectedLetterState(nextLessonLetter(checked) || mockLetters[0]);
      setSelectedStory(null);
      updateParentSettings({ activeProfileId: checked.id });
      setRoute('home');
      soundService.playPop();
    }
  };

  const createProfile = (
    newChild: Omit<
      ChildProfile,
      | 'id'
      | 'stars'
      | 'streakDays'
      | 'lastActiveDate'
      | 'masteredLetterIds'
      | 'inProgressLetterIds'
      | 'readStoryIds'
      | 'unlockedStickerIds'
      | 'savedWords'
      | 'dailyPracticeCompletedToday'
    >
  ) => {
    const profile: ChildProfile = {
      // Invoked by the parent's submit action, never during rendering.
      // eslint-disable-next-line react-hooks/purity
      id: `child-${Date.now()}`,
      ...newChild,
      stars: 5,
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      masteredLetterIds: [],
      inProgressLetterIds: [],
      readStoryIds: [],
      unlockedStickerIds: ['stk-butterfly'],
      savedWords: [],
      dailyPracticeCompletedToday: true,
    };

    const updated = [...profiles, profile];
    setProfiles(updated);
    profileRef.current = profile;
    setCurrentProfile(profile);
    updateParentSettings({ activeProfileId: profile.id });
    setIsStreakActiveToday(true);
    setStreakStatus('completed_today');
    progressRepo.saveChildProfile(profile);
    triggerConfetti();
  };

  const updateCurrentProfile = (updates: Partial<ChildProfile>) => {
    const updated = { ...profileRef.current, ...updates };
    updated.unlockedStickerIds=[...updated.unlockedStickerIds];
    for(const [threshold,sticker] of [[6,'stk-fox'],[10,'stk-bear'],[15,'stk-deer'],[20,'stk-mountain']] as const) {
      if(updated.stars>=threshold && !updated.unlockedStickerIds.includes(sticker)) updated.unlockedStickerIds.push(sticker);
    }
    // Weekly report: whatever this update earned is added to today's entry.
    const before = profileRef.current;
    const gain = { seconds: Math.max(0, (updated.practiceSeconds || 0) - (before.practiceSeconds || 0)), lessons: Math.max(0, updated.masteredLetterIds.length - before.masteredLetterIds.length), stars: Math.max(0, updated.stars - before.stars) };
    if (gain.seconds || gain.lessons || gain.stars) updated.dailyLog = logDay(before.dailyLog, localDay(), gain);
    profileRef.current = updated;
    setCurrentProfile(updated);
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    progressRepo.saveChildProfile(updated);
  };

  const updateParentSettings = (updates: Partial<ParentSettings>) => {
    const updated = { ...parentSettings, ...updates };
    setParentSettings(updated);
    if (updates.soundFxEnabled !== undefined) {
      soundService.setSoundFxEnabled(updates.soundFxEnabled);
    }
    if (updates.narrationVolume !== undefined) {
      soundService.setVolume(updates.narrationVolume);
    }
    authRepo.saveParentSettings(updated);
  };

  const saveCheckpoint = (checkpoint: LearningCheckpoint) => {
    const safe = normalizeCheckpoint(checkpoint);
    if (JSON.stringify(profileRef.current.checkpoint) !== JSON.stringify(safe)) updateCurrentProfile({ checkpoint: safe });
  };
  const clearCheckpoint = () => { if (profileRef.current.checkpoint) updateCurrentProfile({ checkpoint: undefined }); };
  const recordScreenTime = (log: Record<string, number>, profileId = profileRef.current.id) => {
    const target = profileId === profileRef.current.id ? profileRef.current : profiles.find(profile => profile.id === profileId);
    if (!target) return;
    const previous = target.screenTimeLog || {};
    const merged = { ...previous };
    for (const [date, seconds] of Object.entries(log)) if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(seconds)) merged[date] = Math.max(previous[date] || 0, Math.floor(seconds));
    const bounded = Object.fromEntries(Object.keys(merged).sort().slice(-28).map(date => [date, merged[date]]));
    if (JSON.stringify(previous) !== JSON.stringify(bounded)) {
      if (profileId === profileRef.current.id) updateCurrentProfile({ screenTimeLog: bounded });
      else { const updated = { ...target, screenTimeLog: bounded }; setProfiles(items => items.map(profile => profile.id === profileId ? updated : profile)); void progressRepo.saveChildProfile(updated); }
    }
  };

  const openParentGateWithCallback = (onSuccess: () => void) => {
    setParentGateCallback(() => onSuccess);
    setParentGateOpen(true);
  };

  const handleParentGateSuccess = () => {
    setParentGateOpen(false);
    if (parentGateCallback) {
      parentGateCallback();
      setParentGateCallback(null);
    }
  };

  const recordLearningActivity = () => {
    const now = new Date();
    const lastActive = currentProfile.lastActiveDate ? new Date(currentProfile.lastActiveDate) : null;
    let newStreak = currentProfile.streakDays;
    let streakIncremented = false;

    if (!lastActive) {
      newStreak = 1;
      streakIncremented = true;
    } else {
      const d1 = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
      const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        newStreak = Math.max(1, currentProfile.streakDays);
      } else if (diffDays === 1) {
        newStreak = (currentProfile.streakDays || 0) + 1;
        streakIncremented = true;
      } else {
        newStreak = 1;
        streakIncremented = true;
      }
    }

    setIsStreakActiveToday(true);
    setStreakStatus('completed_today');

    updateCurrentProfile({
      streakDays: newStreak,
      lastActiveDate: now.toISOString(),
      dailyPracticeCompletedToday: true,
    });

    if (streakIncremented) {
      triggerConfetti();
    }
  };

  const addStars = (amount: number) => {
    const newTotal = profileRef.current.stars + amount;
    const newUnlockedStickers = [...profileRef.current.unlockedStickerIds];
    if (newTotal >= 6 && !newUnlockedStickers.includes('stk-fox')) newUnlockedStickers.push('stk-fox');
    if (newTotal >= 10 && !newUnlockedStickers.includes('stk-bear')) newUnlockedStickers.push('stk-bear');
    if (newTotal >= 15 && !newUnlockedStickers.includes('stk-deer')) newUnlockedStickers.push('stk-deer');
    if (newTotal >= 20 && !newUnlockedStickers.includes('stk-mountain')) newUnlockedStickers.push('stk-mountain');

    updateCurrentProfile({
      stars: newTotal,
      unlockedStickerIds: newUnlockedStickers,
    });
    triggerConfetti();
  };

  const incrementMissionProgress = (
    targetType: DailyMission['targetType'],
    amount: number = 1
  ) => {
    const missions =
      currentProfile.dailyMissions && currentProfile.dailyMissions.length > 0
        ? currentProfile.dailyMissions
        : generateDailyMissions();
    let updated = false;

    const newMissions = missions.map((m) => {
      if (m.targetType === targetType && !m.claimed) {
        const newCount = Math.min(m.targetCount, m.currentCount + amount);
        const isNowCompleted = newCount >= m.targetCount;
        if (newCount !== m.currentCount || isNowCompleted !== m.completed) {
          updated = true;
          if (isNowCompleted && !m.completed) {
            soundService.playCorrect();
            triggerConfetti();
          }
          return { ...m, currentCount: newCount, completed: isNowCompleted };
        }
      }
      return m;
    });

    if (updated) {
      updateCurrentProfile({
        dailyMissions: newMissions,
        lastMissionsDate: getTodayDateString(),
      });

      const allCompleted = newMissions.length > 0 && newMissions.every((m) => m.completed);
      const todayStr = getTodayDateString();
      if (allCompleted && currentProfile.dailyMissionsBonusClaimedDate !== todayStr) {
        setTimeout(() => {
          setAllMissionsCelebrationOpen(true);
        }, 700);
      }
    }
  };

  const claimMissionReward = (missionId: string) => {
    const missions = currentProfile.dailyMissions || [];
    const target = missions.find((m) => m.id === missionId);
    if (!target || target.claimed || !target.completed) return;

    const newMissions = missions.map((m) =>
      m.id === missionId ? { ...m, claimed: true } : m
    );

    addStars(target.starReward);
    soundService.playSuccessFanfare();
    triggerConfetti();

    updateCurrentProfile({
      dailyMissions: newMissions,
    });

    const allClaimed = newMissions.length > 0 && newMissions.every((m) => m.claimed);
    const todayStr = getTodayDateString();
    if (allClaimed && currentProfile.dailyMissionsBonusClaimedDate !== todayStr) {
      setTimeout(() => {
        setAllMissionsCelebrationOpen(true);
      }, 700);
    }
  };

  const claimAllMissionsBonusReward = (bonusAmount: number = 10): number => {
    const todayStr = getTodayDateString();
    if (currentProfile.dailyMissionsBonusClaimedDate === todayStr) {
      return currentProfile.stars;
    }
    const newTotal = currentProfile.stars + bonusAmount;
    updateCurrentProfile({
      stars: newTotal,
      dailyMissionsBonusClaimedDate: todayStr,
    });
    return newTotal;
  };

  const masterLetter = (letterId: string) => {
    recordLearningActivity();
    if (!currentProfile.masteredLetterIds.includes(letterId)) {
      const updatedMastered = [...currentProfile.masteredLetterIds, letterId];
      const updatedInProgress = currentProfile.inProgressLetterIds.filter((id) => id !== letterId);
      updateCurrentProfile({
        masteredLetterIds: updatedMastered,
        inProgressLetterIds: updatedInProgress,
      });
      addStars(2);
    }
  };

  const completeStory = (storyId: string) => {
    const today=localDay();
    const base=learningActivity(ensureMissionsForToday(profileRef.current));
    const first=!base.readStoryIds.includes(storyId);
    const firstToday=base.storyPracticeDates?.[storyId]!==today;
    const updated = evaluateStreak({...base,
      readStoryIds:Array.from(new Set([...base.readStoryIds,storyId])),
      storyPracticeDates:{...base.storyPracticeDates,[storyId]:today},
      stars:base.stars+(first?3:0),
      dailyMissions:base.dailyMissions?.map(m=>m.targetType==='read_stories' && firstToday && !m.claimed
        ? {...m,currentCount:Math.min(m.targetCount,m.currentCount+1),completed:m.currentCount+1>=m.targetCount}:m),
    });
    updateCurrentProfile(selectedStory?.id === storyId && selectedStory.journeyLetterId
      ? finishGardenStep(updated, 'story', selectedStory.journeyLetterId) : updated);
  };

  const saveWord = (word: string) => {
    const base=learningActivity(ensureMissionsForToday(profileRef.current));
    const first=!base.savedWords.includes(word);
    updateCurrentProfile(evaluateStreak({...base,savedWords:Array.from(new Set([...base.savedWords,word])),
      dailyMissions:base.dailyMissions?.map(m=>m.targetType==='save_word' && first && !m.claimed
        ? {...m,currentCount:Math.min(m.targetCount,m.currentCount+1),completed:m.currentCount+1>=m.targetCount}:m),
    }));
    if(first) soundService.playCorrect();
  };

  const recordPracticeResult = (letterIds: string[], correct: boolean, wordId?: string, skill?: LearningSkill, helped=false) => {
    const base=learningActivity(ensureMissionsForToday(profileRef.current));
    const reviews={...base.letterReviews};
    for(const id of new Set(letterIds)) {
      if(mockLetters.some(letter=>letter.id===id)) reviews[id]=updateReview(reviews[id],correct);
    }
    const validWord=correct && wordId && LEARNING_WORDS.some(word=>word.id===wordId);
    const first=!!validWord && !base.learnedWordIds?.includes(wordId!);
    const domain=skill || (wordId?'word':'recognition');
    const reviewable=!!wordId && knownWordId(wordId);
    const firstPicture=correct && reviewable && isVocabId(wordId) && !base.wordReviews?.[wordId!];
    updateCurrentProfile(evaluateStreak({...base,letterReviews:reviews,
      wordReviews:reviewable?{...base.wordReviews,[wordId!]:updateReview(base.wordReviews?.[wordId!],correct)}:base.wordReviews,
      skillProgress:{...base.skillProgress,[domain]:skillAttempt(base.skillProgress?.[domain],correct,helped)},
      learnedWordIds:first?[...(base.learnedWordIds||[]),wordId!]:base.learnedWordIds,
      stars:base.stars+(first||firstPicture?1:0),
    }));
  };

  const completeGardenTask = (step: GardenStep, letterId = 'ba') => { const next = finishGardenStep(profileRef.current, step, letterId); if (next !== profileRef.current) updateCurrentProfile(next); };
  const plantQuestFlower = (spot: number, letterId = 'ba') => { const next = plantGardenFlower(profileRef.current, spot, letterId); if (next !== profileRef.current) updateCurrentProfile(next); };
  const recordSkillResult = (skill: LearningSkill, correct: boolean, helped=false) => {
    const base=learningActivity(profileRef.current);
    updateCurrentProfile({...base,skillProgress:{...base.skillProgress,[skill]:skillAttempt(base.skillProgress?.[skill],correct,helped)}});
  };
  const recordLessonStep = (letterId: string, step: LessonStep, exampleId?: string) => {
    const base = profileRef.current;
    const next = applyLessonStep(base, letterId, step, exampleId);
    if (next !== base) updateCurrentProfile(next);
  };
  const savePlacement = (correct: number, total: number, letterIds: string[]) => {
    const base=profileRef.current;
    const ratio=total?correct/total:0;
    updateCurrentProfile({...base,placement:{completedAt:new Date().toISOString(),correct,total,recommendedLevel:ratio>=0.8?3:ratio>=0.5?2:1,letterIds:[...letterIds]}});
  };
  const finishLearningGame = (kind: 'word' | 'sound' | 'similar' | 'syllables' | 'writing') => {
    const today=localDay();
    const base=learningActivity(ensureMissionsForToday(profileRef.current));
    const reward=base.gameRewardDates?.[kind]===today?0:2;
    updateCurrentProfile(evaluateStreak({...base,stars:base.stars+reward,
      gameRewardDates:{...base.gameRewardDates,[kind]:today},
      dailyMissions:base.dailyMissions?.map(m=>m.targetType==='match_game' && reward>0 && !m.claimed
        ? {...m,currentCount:Math.min(m.targetCount,m.currentCount+1),completed:m.currentCount+1>=m.targetCount}:m),
    }));
    return reward;
  };

  const completeDailyPractice = () => {
    const today=localDay();
    const base=learningActivity(ensureMissionsForToday(profileRef.current));
    const reward=base.dailyPracticeRewardDate===today?0:5;
    updateCurrentProfile(evaluateStreak({...base,stars:base.stars+reward,dailyPracticeRewardDate:today,
      dailyMissions:base.dailyMissions?.map(m=>m.targetType==='daily_practice' && reward>0 && !m.claimed
        ? {...m,currentCount:Math.min(m.targetCount,m.currentCount+1),completed:m.currentCount+1>=m.targetCount}:m),
    }));
    return reward;
  };

  const saveWritingScore = async (letterId: string, score: number, stars: number, mode: WritingMode='trace', helped=false, seconds=0) => {
    const profileId = profileRef.current.id;
    const passed = stars === 3 && score >= 82;
    const record = await writingRepo.saveBestScore(profileId, letterId, score, stars);
    if (profileRef.current.id !== profileId) return record;
    const profile = ensureMissionsForToday(profileRef.current);
    const now = new Date();
    const previousDate = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
    const daysSince = previousDate ? Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate()).getTime()) / 86400000) : Infinity;
    const writing=advanceWriting(profile.writingProgress?.[letterId],mode,passed,helped,now);
    const mastered=writingMastered(writing);
    const newStars = profile.stars + (mastered && !profile.masteredLetterIds.includes(letterId) ? 2 : 0);
    const unlockedStickerIds = [...profile.unlockedStickerIds];
    for (const [threshold, sticker] of [[6, 'stk-fox'], [10, 'stk-bear'], [15, 'stk-deer'], [20, 'stk-mountain']] as const) {
      if (newStars >= threshold && !unlockedStickerIds.includes(sticker)) unlockedStickerIds.push(sticker);
    }
    const missions = (profile.dailyMissions || []).map(mission => {
      if (!passed || mission.targetType !== 'trace_letters' || mission.claimed) return mission;
      const count = Math.min(mission.targetCount, mission.currentCount + 1);
      return { ...mission, currentCount: count, completed: count >= mission.targetCount };
    });
    const updatedProfile: ChildProfile = {
      ...profile,
      letterScores: { ...(profile.letterScores || {}), [letterId]: record },
      letterReviews: {...profile.letterReviews,[letterId]:updateReview(profile.letterReviews?.[letterId],passed,now)},
      writingProgress:{...profile.writingProgress,[letterId]:writing},
      skillProgress:{...profile.skillProgress,writing:skillAttempt(profile.skillProgress?.writing,passed,mode!=='independent'||helped)},
      practiceSeconds:(profile.practiceSeconds||0)+Math.max(0,Math.min(180,seconds)),
      masteredLetterIds: mastered ? Array.from(new Set([...profile.masteredLetterIds, letterId])) : [...profile.masteredLetterIds],
      inProgressLetterIds: mastered ? profile.inProgressLetterIds.filter(id => id !== letterId)
        : profile.masteredLetterIds.includes(letterId) ? [...profile.inProgressLetterIds] : Array.from(new Set([...profile.inProgressLetterIds, letterId])),
      stars: newStars, unlockedStickerIds,
      lastActiveDate: now.toISOString(),
      streakDays: daysSince === 0 ? Math.max(1, profile.streakDays) : daysSince === 1 ? profile.streakDays + 1 : 1,
      dailyPracticeCompletedToday: true,
      dailyMissions: missions,
    };
    // Save the score, mastery, rewards and learning activity together. Separate updates used to overwrite one another.
    updateCurrentProfile(evaluateStreak(reconcileLessons(updatedProfile)));
    return record;
  };

  const getLetterBestStars = (letterId: string): number => {
    return currentProfile.letterScores?.[letterId]?.bestStars || 0;
  };

  const activeMissions = currentProfile.dailyMissions && currentProfile.dailyMissions.length > 0
    ? currentProfile.dailyMissions
    : generateDailyMissions();

  const areAllMissionsCompleted = activeMissions.length > 0 && activeMissions.every((m) => m.completed);
  const hasClaimedAllMissionsBonusToday = currentProfile.dailyMissionsBonusClaimedDate === getTodayDateString();

  const goBack = () => {
    void soundService.stopSpeaking();
    if (parentGateOpen) {
      setParentGateOpen(false);
      return;
    }
    if (paywallOpen) {
      setPaywallOpen(false);
      return;
    }
    if (exitConfirmOpen) {
      setExitConfirmOpen(false);
      return;
    }
    if (customBackRef.current && customBackRef.current()) {
      return;
    }
    if (route === 'home') {
      setExitConfirmOpen(true);
      return;
    }
    const stack = historyRef.current.filter((r) => r !== route);
    let prev: AppRoute = stack.length > 0 ? stack[stack.length - 1] : 'home';
    if (stack.length <= 1 && prev === 'home') {
      if (route === 'writing') prev = selectedLetter ? 'letter-detail' : 'alphabet';
      else if (route === 'letter-detail') prev = 'alphabet';
      else if (route === 'story-reader') prev = 'stories';
    }
    historyRef.current = prev === 'home' ? ['home'] : [...stack.filter((r) => r !== prev), prev];
    navigateInternal(prev);
  };

  return (
    <AppContext.Provider
      value={{
        isHydrated, learningPaused, setLearningPaused, loadError, retryLoad, saveCheckpoint, clearCheckpoint, recordScreenTime,
        route,
        setRoute,
        goBack,
        exitConfirmOpen,
        setExitConfirmOpen,
        registerBackHandler,
        selectedLetter,
        setSelectedLetter,
        recordLessonStep,
        selectedStory,
        setSelectedStory,
        profiles,
        currentProfile,
        dailyMissions: activeMissions,
        switchProfile,
        createProfile,
        updateCurrentProfile,
        completeGardenTask,
        plantQuestFlower,
        parentSettings,
        updateParentSettings,
        parentGateOpen,
        setParentGateOpen,
        openParentGateWithCallback,
        parentGateCallback,
        handleParentGateSuccess,
        paywallOpen,
        setPaywallOpen,
        addStars,
        masterLetter,
        completeStory,
        saveWord,
        completeDailyPractice,
        recordLearningActivity,
        saveWritingScore,
        recordPracticeResult,
        recordSkillResult,
        savePlacement,
        finishLearningGame,
        getLetterBestStars,
        incrementMissionProgress,
        claimMissionReward,
        allMissionsCelebrationOpen,
        setAllMissionsCelebrationOpen,
        claimAllMissionsBonusReward,
        hasClaimedAllMissionsBonusToday,
        areAllMissionsCompleted,
        isStreakActiveToday,
        streakStatus,
        triggerConfetti,
        strings: defaultStrings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};


