import { mockLetters } from '../data/mockLetters';
import { ChildProfile, LessonProgress, LessonStep } from './types';

export const isLessonComplete = (profile: ChildProfile, id: string) => {
  const garden = profile.gardenQuests?.[id] || (id === 'ba' ? profile.gardenQuest : undefined);
  const finished = ['listen','find','build','write'].every(step=>garden?.steps?.includes(step as never));
  const flower = Number.isInteger(garden?.flowerSpot) && garden!.flowerSpot! >= 0 && garden!.flowerSpot! < 3;
  return profile.masteredLetterIds.includes(id) || !!profile.lessonProgress?.[id]?.completedAt
    || (finished && (garden?.steps.includes('story') || flower));
};

export function lessonPath(profile: ChildProfile) {
  const first = mockLetters.findIndex(letter => !isLessonComplete(profile, letter.id));
  return mockLetters.map((letter, index) => ({
    letter, index,
    status: isLessonComplete(profile, letter.id) ? 'completed' as const
      : index === first ? 'current' as const : 'locked' as const,
  }));
}

export const isLessonUnlocked = (profile: ChildProfile, id: string) =>
  lessonPath(profile).some(node => node.letter.id === id && node.status !== 'locked');
export const nextLessonLetter = (profile: ChildProfile) =>
  lessonPath(profile).find(node => node.status === 'current')?.letter;

export function lessonChecklist(profile: ChildProfile, id: string) {
  const progress = profile.lessonProgress?.[id];
  const complete = isLessonComplete(profile, id);
  return [
    { label: 'گوێ لە پیتەکە بگرە', done: complete || !!progress?.listened },
    { label: 'شێوەکانی بناسە', done: complete || !!progress?.formsPassed },
    { label: 'سێ وشەکە ببینە', done: complete || (progress?.seenExampleIds.length || 0) >= 3 },
    { label: 'لە سێ وشەدا بیدۆزەوە', done: complete || (progress?.recognizedExampleIds.length || 0) >= 3 },
    { label: 'پیتەکە بنووسە', done: complete || !!profile.writingProgress?.[id]?.tracePassed },
  ];
}

export function lessonResumeStep(profile: ChildProfile, id: string) {
  if (isLessonComplete(profile, id)) return 0;
  const index = lessonChecklist(profile, id).findIndex(item => !item.done);
  return index < 0 ? 4 : index;
}

export function reconcileLessons(profile: ChildProfile, now = new Date()): ChildProfile {
  const progress = { ...profile.lessonProgress };
  let reward = 0;
  for (const letter of mockLetters) {
    const record = progress[letter.id];
    if (!record || record.completedAt || profile.masteredLetterIds.includes(letter.id)) continue;
    if (lessonChecklist({ ...profile, lessonProgress: progress }, letter.id).every(item => item.done)) {
      progress[letter.id] = { ...record, completedAt: now.toISOString() };
      reward += 2;
    }
  }
  return { ...profile, lessonProgress: progress, stars: profile.stars + reward };
}

export function applyLessonStep(profile: ChildProfile, id: string, step: LessonStep, exampleId?: string): ChildProfile {
  const letter = mockLetters.find(item => item.id === id);
  if (!letter || !isLessonUnlocked(profile, id)) return profile;
  const record: LessonProgress = profile.lessonProgress?.[id] || {
    listened: false, formsPassed: false, seenExampleIds: [], recognizedExampleIds: [],
  };
  if ((step === 'listening' && record.listened) || (step === 'forms' && record.formsPassed)) return profile;
  if (step === 'example' || step === 'recognition') {
    if (!exampleId || !letter.exampleWords.some(word => word.id === exampleId)) return profile;
    if ((step === 'example' ? record.seenExampleIds : record.recognizedExampleIds).includes(exampleId)) return profile;
  }
  const next = { ...record };
  if (step === 'listening') next.listened = true;
  if (step === 'forms') next.formsPassed = true;
  if (exampleId && letter.exampleWords.some(word => word.id === exampleId)) {
    if (step === 'example') next.seenExampleIds = [...new Set([...record.seenExampleIds, exampleId])];
    if (step === 'recognition') next.recognizedExampleIds = [...new Set([...record.recognizedExampleIds, exampleId])];
  }
  return reconcileLessons({ ...profile, lessonProgress: { ...profile.lessonProgress, [id]: next } });
}
