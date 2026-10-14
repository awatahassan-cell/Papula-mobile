import { BadgeItem, ChildProfile } from '../services/types';

export const mockBadges: BadgeItem[] = [
  {
    id: 'badge-letters-3',
    titleKu: 'دەستپێکی فێربوون',
    titleEn: 'First Steps',
    descriptionKu: 'ماستەرکردنی ۳ پیتی زێڕینی ئەلفوبێی کوردی',
    icon: '🎖️',
    badgeColor: 'from-amber-400 to-amber-600',
    category: 'letters',
    targetType: 'mastered_letters',
    targetCount: 3,
  },
  {
    id: 'badge-letters-10',
    titleKu: 'وەستای پیتەکان',
    titleEn: 'Letter Master',
    descriptionKu: 'ماستەرکردنی ۱۰ پیتی دروست و ئازا',
    icon: '🏅',
    badgeColor: 'from-blue-400 to-indigo-600',
    category: 'letters',
    targetType: 'mastered_letters',
    targetCount: 10,
  },
  {
    id: 'badge-letters-20',
    titleKu: 'قارەمانی ئەلفوبێ',
    titleEn: 'Alphabet Hero',
    descriptionKu: 'ماستەرکردنی ۲۰ پیتی خۆشنووسی کوردی',
    icon: '🥇',
    badgeColor: 'from-purple-500 to-pink-600',
    category: 'letters',
    targetType: 'mastered_letters',
    targetCount: 20,
  },
  {
    id: 'badge-story-1',
    titleKu: 'خوێنەری بچووک',
    titleEn: 'Little Reader',
    descriptionKu: 'تەواوکردنی ۱ چیرۆکی سەرنجڕاکێشی کوردی',
    icon: '📖',
    badgeColor: 'from-emerald-400 to-teal-600',
    category: 'stories',
    targetType: 'read_stories',
    targetCount: 1,
  },
  {
    id: 'badge-story-3',
    titleKu: 'دۆستی چیرۆکەکان',
    titleEn: 'Story Collector',
    descriptionKu: 'تەواوکردنی ۳ چیرۆکی کارلێککار و دەنگدار',
    icon: '📚',
    badgeColor: 'from-sky-400 to-cyan-600',
    category: 'stories',
    targetType: 'read_stories',
    targetCount: 3,
  },
  {
    id: 'badge-story-5',
    titleKu: 'پاشای چیرۆکەکان',
    titleEn: 'Story King',
    descriptionKu: 'تەواوکردنی ۵ چیرۆکی دارستان و باخچەکان',
    icon: '👑',
    badgeColor: 'from-amber-300 to-yellow-500',
    category: 'stories',
    targetType: 'read_stories',
    targetCount: 5,
  },
  {
    id: 'badge-stars-20',
    titleKu: 'کۆکەرەوەی ئەستێرە',
    titleEn: 'Star Catcher',
    descriptionKu: 'بەدەستهێنانی ۲۰ ئەستێرەی پرشنگدار',
    icon: '⭐',
    badgeColor: 'from-yellow-400 to-amber-500',
    category: 'stars',
    targetType: 'total_stars',
    targetCount: 20,
  },
  {
    id: 'badge-stars-50',
    titleKu: 'ئەستێرەی درەوشاوە',
    titleEn: 'Superstar',
    descriptionKu: 'بەدەستهێنانی ۵۰ ئەستێرەی سەرکەوتن',
    icon: '🌟',
    badgeColor: 'from-orange-400 to-rose-500',
    category: 'stars',
    targetType: 'total_stars',
    targetCount: 50,
  },
  {
    id: 'badge-streak-3',
    titleKu: 'بەردەوامی بەهێز',
    titleEn: '3-Day Streak',
    descriptionKu: 'خوێندنی بەردەوام بۆ ۳ ڕۆژ لەسەریەک',
    icon: '🔥',
    badgeColor: 'from-red-500 to-orange-500',
    category: 'streak',
    targetType: 'streak_days',
    targetCount: 3,
  },
  {
    id: 'badge-words-5',
    titleKu: 'نووسەری زیرەک',
    titleEn: 'Smart Writer',
    descriptionKu: 'خەزنکردن و نووسینی ۵ وشەی فێرکاری',
    icon: '✍️',
    badgeColor: 'from-teal-400 to-emerald-600',
    category: 'writing',
    targetType: 'saved_words',
    targetCount: 5,
  },
];

/**
 * Calculates current progress and unlocks status for a given badge and profile.
 */
export function getBadgeStatus(
  badge: BadgeItem,
  profile: ChildProfile
): { isUnlocked: boolean; progress: number; target: number } {
  const isManuallyUnlocked = Boolean(profile.unlockedBadgeIds?.includes(badge.id));
  let currentProgress = 0;

  switch (badge.targetType) {
    case 'mastered_letters':
      currentProgress = profile.masteredLetterIds?.length || 0;
      break;
    case 'read_stories':
      currentProgress = profile.readStoryIds?.length || 0;
      break;
    case 'total_stars':
      currentProgress = profile.stars || 0;
      break;
    case 'streak_days':
      currentProgress = profile.streakDays || 0;
      break;
    case 'saved_words':
      currentProgress = profile.savedWords?.length || 0;
      break;
  }

  const isUnlocked = isManuallyUnlocked || currentProgress >= badge.targetCount;

  return {
    isUnlocked,
    progress: Math.min(currentProgress, badge.targetCount),
    target: badge.targetCount,
  };
}
