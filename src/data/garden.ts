import { ChildProfile } from '../services/types';
import { localDay } from '../services/learningEngine';
import { completedLetterIds } from '../services/lessonPath';

export type Rarity = 'common' | 'rare' | 'legendary';
export type GoalKind = 'letters' | 'words' | 'stories' | 'streak' | 'stars';
export interface GardenButterfly { id: string; name: string; hue: number; rarity: Rarity; kind: GoalKind; n: number; }

/** The goal text shown on a locked butterfly, so a child knows what to do to meet it. */
export const GOAL_TEXT: Record<GoalKind, (n: number) => string> = {
  letters: n => n === 1 ? 'یەک پیت فێر بە' : `${n} پیت فێر بە`,
  words: n => `${n} وشە فێر بە`,
  stories: n => n === 1 ? 'یەک چیرۆک بخوێنەوە' : `${n} چیرۆک بخوێنەوە`,
  streak: n => `${n} ڕۆژ فێربە`,
  stars: n => `${n} ئەستێرە کۆ بکەرەوە`,
};
export const RARITY_TEXT: Record<Rarity, string> = { common: 'ئاسایی', rare: 'دەگمەن', legendary: 'ئەفسانەیی' };

const make = (kind: GoalKind, rows: [string, string, number, number, Rarity?][]): GardenButterfly[] =>
  rows.map(([id, name, hue, n, rarity = 'common']) => ({ id: `${kind}-${id}`, name, hue, n, kind, rarity }));

/** 25 butterflies. Hues are degrees to rotate the purple Papula wings by. Order = display order. */
export const GARDEN_BUTTERFLIES: GardenButterfly[] = [
  ...make('letters', [
    ['1', 'پەپوولەی یەکەم', 0, 1], ['3', 'ئاسمانی', -65, 3], ['5', 'گوڵی', 55, 5], ['8', 'هەنگوینی', 140, 8], ['12', 'گەڵایی', -125, 12],
    ['16', 'مەرجانی', 95, 16, 'rare'], ['20', 'دەریایی', -90, 20, 'rare'], ['26', 'ئاگری', 120, 26, 'rare'], ['32', 'ئەستێرەی شەو', -20, 32, 'legendary'],
  ]),
  ...make('words', [
    ['3', 'کەسکی بچووک', -105, 3], ['8', 'شەکری', 75, 8], ['15', 'ڕەنگاوڕەنگ', 160, 15, 'rare'], ['25', 'ئاڵتوونی', 150, 25, 'rare'], ['40', 'تاجدار', 30, 40, 'legendary'],
  ]),
  ...make('stories', [
    ['1', 'چیرۆکخوێن', -40, 1], ['3', 'خەیاڵی', 40, 3], ['6', 'ئەفسانەیی', -150, 6, 'rare'], ['10', 'ئاوازی', 110, 10, 'legendary'],
  ]),
  ...make('streak', [
    ['2', 'بەیانی', 100, 2], ['4', 'خۆرئاوا', 130, 4], ['7', 'هەفتانە', 12, 7, 'rare'], ['14', 'دووهەفتانە', -170, 14, 'legendary'],
  ]),
  ...make('stars', [
    ['10', 'ئەستێرەیی', 150, 10], ['35', 'درەوشاوە', -80, 35, 'rare'], ['100', 'پاشای باخچە', 20, 100, 'legendary'],
  ]),
];

export interface GardenCounts { letters: number; words: number; stories: number; streak: number; stars: number; }
export function gardenCounts(profile: ChildProfile): GardenCounts {
  const words = new Set([...(profile.learnedWordIds || []), ...Object.entries(profile.wordReviews || {}).filter(([, record]) => record.correct > 0).map(([id]) => id)]);
  return { letters: completedLetterIds(profile).length, words: words.size, stories: profile.readStoryIds.length, streak: Math.max(profile.streakDays, profile.activeDays || 0), stars: profile.stars };
}
export const isEarned = (butterfly: GardenButterfly, counts: GardenCounts) => counts[butterfly.kind] >= butterfly.n;
export const earnedButterflies = (profile: ChildProfile) => { const counts = gardenCounts(profile); return GARDEN_BUTTERFLIES.filter(item => isEarned(item, counts)); };
/** Earned but not yet shown in the "new butterfly" reveal. */
export const unseenButterflies = (profile: ChildProfile) => earnedButterflies(profile).filter(item => !profile.seenButterflyIds?.includes(item.id));
export const goalProgress = (butterfly: GardenButterfly, counts: GardenCounts) => Math.min(1, counts[butterfly.kind] / butterfly.n);

// ---- The growing companion ----
export interface PetStage { id: 'egg' | 'caterpillar' | 'cocoon' | 'baby' | 'butterfly' | 'royal'; name: string; from: number; size: number; }
export const PET_STAGES: PetStage[] = [
  { id: 'egg', name: 'هێلکە', from: 0, size: 0.55 },
  { id: 'caterpillar', name: 'کرمۆلە', from: 3, size: 0.7 },
  { id: 'cocoon', name: 'پیلە', from: 8, size: 0.8 },
  { id: 'baby', name: 'پەپوولەی بچووک', from: 18, size: 0.7 },
  { id: 'butterfly', name: 'پەپوولە', from: 35, size: 0.85 },
  { id: 'royal', name: 'پەپوولەی شا', from: 70, size: 1 },
];
export const petFed = (profile: ChildProfile) => profile.pet?.fed || 0;
export function petStage(fed: number) { return [...PET_STAGES].reverse().find(stage => fed >= stage.from) || PET_STAGES[0]; }
export function nextStage(fed: number) { return PET_STAGES.find(stage => stage.from > fed); }
/** 0..1 progress towards the next stage (1 at the last stage). */
export function stageProgress(fed: number) {
  const current = petStage(fed), next = nextStage(fed);
  return next ? (fed - current.from) / (next.from - current.from) : 1;
}
/** Every star earned is one drop of nectar; feeding costs one. Daily gifts add extra. */
export const nectarOf = (profile: ChildProfile) => Math.max(0, profile.stars + (profile.pet?.bonus || 0) - petFed(profile));
export const fedToday = (profile: ChildProfile, now = new Date()) => profile.pet?.lastFedDate === localDay(now);
export const giftReady = (profile: ChildProfile, now = new Date()) => profile.pet?.giftDate !== localDay(now);
/** 2–5 drops, the same for a given day so a quick re-open cannot reroll it. */
export function giftAmount(now = new Date()) {
  const day = localDay(now);
  let hash = 0; for (const char of day) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return 2 + (hash % 4);
}
const daysSince = (iso: string | undefined, now: Date) => iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000) : 0;
export type PetMood = 'happy' | 'calm' | 'sleepy';
/** A friend who was away only gets sleepy, never sad: coming back wakes them up. */
export function petMood(profile: ChildProfile, now = new Date()): PetMood {
  if (fedToday(profile, now)) return 'happy';
  const away = Math.min(daysSince(profile.lastActiveDate, now), profile.pet?.lastFedDate ? daysSince(profile.pet.lastFedDate + 'T12:00:00', now) : 99);
  return away >= 2 ? 'sleepy' : 'calm';
}
export function feed(profile: ChildProfile, now = new Date()): ChildProfile {
  if (nectarOf(profile) < 1) return profile;
  return { ...profile, pet: { bonus: 0, ...profile.pet, fed: petFed(profile) + 1, lastFedDate: localDay(now) } };
}
export const GIFT_STACK_DAYS = 3;
/** Days of gifts waiting: 1 normally, up to three when the child has been away (gifts keep for a few days). */
export function giftDaysOwed(profile: ChildProfile, now = new Date()): number {
  if (!giftReady(profile, now)) return 0;
  const last = profile.pet?.giftDate;
  if (!last) return 1;
  const gap = Math.round((Date.parse(localDay(now) + 'T12:00:00') - Date.parse(last + 'T12:00:00')) / 86400000);
  return Math.max(1, Math.min(GIFT_STACK_DAYS, gap));
}
export function giftTotal(profile: ChildProfile, now = new Date()): number {
  let total = 0;
  for (let i = 0; i < giftDaysOwed(profile, now); i++) total += giftAmount(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12));
  return total;
}
export function claimGift(profile: ChildProfile, now = new Date()): ChildProfile {
  if (!giftReady(profile, now)) return profile;
  return { ...profile, pet: { fed: petFed(profile), ...profile.pet, bonus: (profile.pet?.bonus || 0) + giftTotal(profile, now), giftDate: localDay(now) } };
}
