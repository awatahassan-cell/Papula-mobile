import { ChildProfile, LearningSkill } from './types';
import { mockLetters } from '../data/mockLetters';
import { reviewPlan } from './learningEngine';
import { completedLetterIds, isLessonUnlocked } from './lessonPath';

export function personalPractice(profile: ChildProfile, now = new Date()) {
  const done = new Set(completedLetterIds(profile));
  const known = (id: string) => profile.masteredLetterIds.includes(id) || done.has(id) || !!profile.lessonProgress?.[id]?.listened || !!profile.writingProgress?.[id]?.tracePassed || (profile.letterReviews?.[id]?.attempts || 0) > 0;
  return reviewPlan(profile, mockLetters.length, now).filter(letter => known(letter.id) && isLessonUnlocked(profile, letter.id)).slice(0, 3).map(letter => {
    const writing = profile.writingProgress?.[letter.id];
    const record = profile.letterReviews?.[letter.id];
    const kind = writing?.tracePassed && (!writing.copyPassed || writing.independentPassDates.length < 2) ? 'writing' as const : 'lesson' as const;
    const step = record && record.errors > 0 ? 3 : 0;
    return { letter, kind, step, minutes: 2,
      reason: kind === 'writing' ? 'با هێواش و بە پەنجە پیتەکە بنووسین' : record?.level === 0 ? 'با بە یاری ئەم پیتە دووبارە بکەینەوە' : record && new Date(record.dueAt).getTime() <= now.getTime() ? 'کاتی بیرخستنەوەی ئەم پیتەیە' : 'با پیتە فێربووەکەمان بیر بکەینەوە' };
  });
}
const skillNames: Record<LearningSkill, string> = { recognition: 'ناسینەوەی پیت', forms: 'شێوەی پیت', phonics: 'دەنگی سەرەتای وشە', syllables: 'بڕگەکان', word: 'وشەسازی', writing: 'نووسین', reading: 'خوێندنەوە' };
export function parentAdvice(profile: ChildProfile, now = new Date()) {
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  const learned = mockLetters.filter(letter => {
    const time = Date.parse(profile.lessonProgress?.[letter.id]?.completedAt || '');
    return Number.isFinite(time) && time >= since && time <= now.getTime();
  });
  const needs = (Object.entries(profile.skillProgress || {}) as [LearningSkill, NonNullable<ChildProfile['skillProgress']>[LearningSkill]][])
    .filter(([, record]) => record && record.attempts >= 3 && (record.independentCorrect || 0) / record.attempts < 0.6)
    .sort((a, b) => ((a[1]?.independentCorrect || 0) / a[1]!.attempts) - ((b[1]?.independentCorrect || 0) / b[1]!.attempts));
  const task = personalPractice(profile, now)[0];
  return { learned,
    focus: needs[0] ? `لە ${skillNames[needs[0][0]]}دا هێشتا مەشق بە یارمەتی سودبەخشە؛ ئەمە بەشێکی ئاسایی فێربوونە.` : 'هێشتا هەوڵی تۆمارکراوی بەس نییە بۆ دیاریکردنی بەشێکی پێویست بە یارمەتی.',
    homeActivity: task ? `ئەمڕۆ دوو خولەک لەگەڵی دانیشن: پیتی «${task.letter.glyph}» بڵێن، وشەیەکی لەگەڵ بدۆزنەوە و لەسەر کاغەز بینووسن. هەوڵەکەی ستایش بکەن.` : 'ئەمڕۆ دوو خولەک لەگەڵی دانیشن و لە ڕێڕەوی فێربوون پیتی یەکەم هەڵبژێرن. بەبێ پەلە گوێ بگرن و پێکەوە بیڵێنەوە.' };
}
