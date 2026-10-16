import { DailyMission } from '../services/types';

/**
 * Default daily mission templates assigned to young learners each day.
 */
export const defaultDailyMissionTemplates: Omit<DailyMission, 'currentCount' | 'completed' | 'claimed'>[] = [
  {
    id: 'mission-trace-letters',
    titleKu: 'نوسینەوەی ۲ پیت',
    titleEn: 'Trace 2 Letters',
    descriptionKu: 'دوو پیت بە پەنجەکانت ڕاست بنووسەرەوە ✍️',
    icon: '✍️',
    targetType: 'trace_letters',
    targetCount: 2,
    starReward: 2,
    actionRoute: 'writing',
  },
  {
    id: 'mission-read-story',
    titleKu: 'خوێندنەوەی ۱ چیرۆک',
    titleEn: 'Read 1 Story',
    descriptionKu: 'گوێ لە چیرۆکێکی جوان بگرە و بیخوێنەرەوە 📖',
    icon: '📖',
    targetType: 'read_stories',
    targetCount: 1,
    starReward: 3,
    actionRoute: 'stories',
  },
  {
    id: 'mission-match-game',
    titleKu: 'یاری یەکخستنی دەنگەکان',
    titleEn: 'Play 1 Match Game',
    descriptionKu: 'دەنگی پیتەکان بە دروستی ڕێکبخەرەوە 🎮',
    icon: '🎮',
    targetType: 'match_game',
    targetCount: 1,
    starReward: 2,
    actionRoute: 'match-game',
  },
  {
    id: 'mission-save-word',
    titleKu: 'پاشەکەوتکردنی ۱ وشە',
    titleEn: 'Save 1 Word',
    descriptionKu: 'وشەیەکی نوێ زیاد بکە بۆ فەرهەنگۆکەت 🔖',
    icon: '🔖',
    targetType: 'save_word',
    targetCount: 1,
    starReward: 2,
    actionRoute: 'alphabet',
  },
];

/**
 * Returns today's formatted ISO date string (YYYY-MM-DD).
 */
export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generates initial or refreshed daily missions for today.
 */
export function generateDailyMissions(): DailyMission[] {
  return defaultDailyMissionTemplates.map((template) => ({
    ...template,
    currentCount: 0,
    completed: false,
    claimed: false,
  }));
}
