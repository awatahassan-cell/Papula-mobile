import { ChildProfile } from '../services/types';
import { PictureWord, VOCAB, VocabCategory, pictureDistractors, wordPlan } from './vocabulary';
import { localDay, shuffled } from '../services/learningEngine';

export interface Quest { id: string; title: string; emoji: string; sky: [string, string]; skyNight: [string, string]; pool: VocabCategory[]; steps: number; }
/** Story-framed missions: Papula needs help, the child finds pictures that are named aloud. */
export const QUESTS: Quest[] = [
  { id: 'quest-hungry', title: 'پەپوولە برسییەتی', emoji: '🍽️', sky: ['#ffe9c7', '#ffd3df'], skyNight: ['#4a2f58', '#5a3050'], pool: ['food'], steps: 5 },
  { id: 'quest-animals', title: 'ئاژەڵەکانی باخچە', emoji: '🐾', sky: ['#d6f5dc', '#d3ebff'], skyNight: ['#1f4a4a', '#233e66'], pool: ['animals'], steps: 5 },
  { id: 'quest-fruit', title: 'سەبەتەی میوە', emoji: '🧺', sky: ['#ffe0e0', '#fff3c4'], skyNight: ['#4f3030', '#4f4426'], pool: ['fruit'], steps: 5 },
  { id: 'quest-big', title: 'گەشتی گەورە', emoji: '🗺️', sky: ['#e6dcff', '#d3ebff'], skyNight: ['#3a2e70', '#233e66'], pool: ['animals', 'food', 'fruit'], steps: 6 },
];
export const QUEST_REWARD = 3;

export interface QuestStep { item: PictureWord; options: PictureWord[]; }
/** Words the child needs to practise most come first; every step shows three pictures. */
export function questSteps(quest: Quest, profile: ChildProfile, random: () => number = Math.random, now = new Date()): QuestStep[] {
  const pool = VOCAB.filter(word => quest.pool.includes(word.category as VocabCategory));
  return shuffled(wordPlan(profile, pool, quest.steps, now), random).map(item => ({ item, options: shuffled([item, ...pictureDistractors(item, random, 2)], random) }));
}
export const questDoneToday = (profile: ChildProfile, id: string, now = new Date()) => profile.questDates?.[id] === localDay(now);
