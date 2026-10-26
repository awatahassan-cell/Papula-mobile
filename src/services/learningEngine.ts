import { mockLetters } from '../data/mockLetters';
import { DayLog, ChildProfile, ExampleWord, LetterItem, LetterReview, StoryItem } from './types';
import { completedLetterIds } from './lessonPath';

export const CONFUSABLE_GROUPS = [
  ['ba', 'pa', 'ta'], ['ra', 'rra_heavy', 'za'], ['lam', 'lla_heavy'],
  ['waw_kurt', 'o_drej', 'wwaw'], ['ya_kurt', 'e_drej'],
  ['jim', 'chim', 'ha_hezi', 'kha'], ['sin', 'shin'], ['kaf', 'gaf'],
  ['fa', 'va', 'qaf'], ['ayn', 'ghayn'],
];
export const normalizedWord = (word: string) => word.normalize('NFC').replace(/ھ/g, 'ه');
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function learningActivity(profile: ChildProfile, now=new Date()): ChildProfile {
  const previous=profile.lastActiveDate?new Date(profile.lastActiveDate):null;
  const days=previous?Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()-new Date(previous.getFullYear(),previous.getMonth(),previous.getDate()).getTime())/86400000):Infinity;
  return {...profile,lastActiveDate:now.toISOString(),dailyPracticeCompletedToday:true,activeDays:(profile.activeDays||0)+(days===0?0:1),
    streakDays:days===0?Math.max(1,profile.streakDays):days===1?profile.streakDays+1:1};
}
export function wordUnits(word: string): string[] {
  const characters = Array.from(word.normalize('NFC'));
  const units: string[] = [];
  for (let i=0; i<characters.length; i++) {
    if (characters[i] === 'و' && characters[i+1] === 'و') { units.push('وو'); i++; }
    else units.push(characters[i]);
  }
  return units;
}
export interface LearningWord extends ExampleWord { letterIds: string[]; units: string[]; }
const seen = new Set<string>();
export const LEARNING_WORDS: LearningWord[] = mockLetters.flatMap(letter => letter.exampleWords).filter(word => {
  const key=normalizedWord(word.word);
  if (seen.has(key) || /\s/.test(key)) return false;
  seen.add(key); return true;
}).map(word => {
  const units=wordUnits(word.word);
  const letterIds=units.map(unit => mockLetters.find(letter=>normalizedWord(letter.glyph)===normalizedWord(unit))?.id || '');
  return {...word,units,letterIds};
}).filter(word=>word.letterIds.every(Boolean) && word.units.length>=2 && word.units.length<=8);

export function updateReview(previous: LetterReview | undefined, correct: boolean, now = new Date()): LetterReview {
  const today=localDay(now);
  const advance=correct && (!previous || previous.level===0 || previous.lastCorrectDate!==today);
  const level=correct ? Math.min(4, (previous?.level||0)+(advance?1:0)) : 0;
  const intervals=[0,1,3,7,14];
  return {
    attempts:(previous?.attempts||0)+1, correct:(previous?.correct||0)+(correct?1:0),
    errors:(previous?.errors||0)+(correct?0:1), level,
    lastPracticedAt:now.toISOString(), lastCorrectDate:correct?today:previous?.lastCorrectDate,
    dueAt:correct && !advance && previous?.dueAt ? previous.dueAt : new Date(now.getTime()+intervals[level]*86400000).toISOString(),
  };
}
export function reviewPlan(profile: ChildProfile, count=3, now = new Date()): LetterItem[] {
  const rank=(letter: LetterItem) => {
    const record=profile.letterReviews?.[letter.id];
    if (record?.level===0) return 0;
    if (record && new Date(record.dueAt).getTime()<=now.getTime()) return 1;
    if (!record && profile.inProgressLetterIds.includes(letter.id)) return 2;
    if (!record && profile.masteredLetterIds.includes(letter.id)) return 3;
    if (!record) return 4;
    return 5;
  };
  return mockLetters.map((letter,index)=>({letter,index})).sort((a,b)=>rank(a.letter)-rank(b.letter)
    || ((profile.letterReviews?.[a.letter.id]?.dueAt || '') < (profile.letterReviews?.[b.letter.id]?.dueAt || '') ? -1
      : (profile.letterReviews?.[a.letter.id]?.dueAt || '') > (profile.letterReviews?.[b.letter.id]?.dueAt || '') ? 1 : 0)
    || a.index-b.index).slice(0,count).map(item=>item.letter);
}
export function wordPlan(profile: ChildProfile, count=3): LearningWord[] {
  const max=profile.placement?.recommendedLevel===1?3:profile.placement?.recommendedLevel===2?5:profile.ageGroup==='3-4'?3:profile.ageGroup==='5-6'?5:8;
  const candidates=LEARNING_WORDS.filter(word=>word.units.length<=max);
  const done=new Set([...profile.masteredLetterIds,...completedLetterIds(profile)]);
  const known=(word:LearningWord)=>word.letterIds.filter(id=>!done.has(id)).length;
  const maxLetterIdx=(word:LearningWord)=>Math.max(0,...word.letterIds.map(id=>mockLetters.findIndex(l=>l.id===id)));
  return candidates.map((word,index)=>({word,index})).sort((a,b)=>
    Number(profile.learnedWordIds?.includes(a.word.id)||false)-Number(profile.learnedWordIds?.includes(b.word.id)||false)
    || known(a.word)-known(b.word) || a.word.units.length-b.word.units.length || maxLetterIdx(a.word)-maxLetterIdx(b.word) || a.index-b.index).slice(0,count).map(item=>item.word);
}
export function shuffled<T>(items: T[], random:()=>number=Math.random): T[] {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

export const PERSONAL_STORY_TEMPLATES = [
  { id:'personal-garden', title:'باخچەی بچووک', emoji:'🌳', words:['دار','گوڵ','باران'],
    pages:['دارێک لە باخچەکەدایە.','گوڵێک لە ژێر دارەکەدایە.','باران دەبارێت؛ دار و گوڵەکە گەش دەبن.'],
    question:'چی دەبارێت؟', answer:'باران', options:['باران','گوڵ','دار'] },
  { id:'personal-animals', title:'پشیلە و ماسی', emoji:'🐱', words:['پشیلە','ماسی','نان'],
    pages:['پشیلەیەک لە ماڵەکەدایە.','منداڵەکە نان دەخوات.','ماسییەک لە ئاودایە؛ پشیلەکە سەیری دەکات.'],
    question:'چی لە ئاودایە؟', answer:'ماسی', options:['پشیلە','ماسی','نان'] },
  { id:'personal-night', title:'خۆر و مانگ', emoji:'🌙', words:['خۆر','مانگ','شەو'],
    pages:['خۆر دەرکەوت. منداڵەکە یاری دەکات.','شەو داهات؛ مانگ لە ئاسمانە.','منداڵەکە دەخەوێت. شەوێکی خۆش!'],
    question:'لە شەودا چی لە ئاسمانە؟', answer:'مانگ', options:['خۆر','مانگ','دار'] },
];
export function templateWords(templateId:string): LearningWord[] {
  const template=PERSONAL_STORY_TEMPLATES.find(item=>item.id===templateId);
  return (template?.words||[]).map(word=>LEARNING_WORDS.find(item=>normalizedWord(item.word)===normalizedWord(word))!).filter(Boolean);
}
export function personalStories(profile: ChildProfile): StoryItem[] {
  return PERSONAL_STORY_TEMPLATES.filter(template=>templateWords(template.id).length===template.words.length && templateWords(template.id).every(word=>profile.learnedWordIds?.includes(word.id))).map(template=>({
    id:template.id,titleKu:template.title,titleEn:template.id,level:1,durationMinutes:1,isPremium:false,
    coverEmoji:template.emoji,coverThemeColor:'#ecfdf5',summaryKu:'چیرۆکێک بە وشە فێربووەکانی تۆ',
    pages:template.pages.map((text,index)=>({pageNumber:index+1,textKu:text,illustrationTheme:({ 'personal-garden':['🌳','🌳 🌷','🌧️ 🌳 🌷'], 'personal-animals':['🐱 🏠','👧 🥖','🐱 🐟 💧'], 'personal-night':['☀️ 🧒','🌙 ✨','🧒 🛏️'] }[template.id]||[template.emoji])[index],
      illustrationSvgId:template.id,audioDurationMs:0,wordTimings:[]})),
    quiz:{questionKu:template.question,options:template.options.map(word=>({id:word,textKu:word,
      imageEmoji:LEARNING_WORDS.find(item=>normalizedWord(item.word)===normalizedWord(word))?.imageEmoji || template.emoji,isCorrect:word===template.answer}))},
  }));
}

/** Unlocked letters that are due for spaced review now (missed last time, or their review date has come). */
export function dueReviewLetters(profile: ChildProfile, now = new Date()): LetterItem[] {
  return mockLetters.filter(letter => {
    const record = profile.letterReviews?.[letter.id];
    return !!record && (record.level === 0 || new Date(record.dueAt).getTime() <= now.getTime());
  });
}

export interface HardLetter { letter: LetterItem; errors: number; attempts: number; accuracy: number; confusedWith: LetterItem[]; }
/** Letters a child struggles with most, so parents know what to practise at home. */
export function hardLetters(profile: ChildProfile, count = 3): HardLetter[] {
  return mockLetters.flatMap(letter => {
    const record = profile.letterReviews?.[letter.id];
    if (!record || record.errors < 2 || record.attempts < 3) return [];
    const group = CONFUSABLE_GROUPS.find(ids => ids.includes(letter.id)) || [];
    return [{
      letter, errors: record.errors, attempts: record.attempts,
      accuracy: Math.round(record.correct / record.attempts * 100),
      confusedWith: mockLetters.filter(other => other.id !== letter.id && group.includes(other.id)),
    }];
  }).sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors).slice(0, count);
}

const KEEP_DAYS = 28;
/** Adds today's gain to the per-day log and forgets days older than four weeks. */
export function logDay(log: Record<string, DayLog> | undefined, day: string, gain: DayLog): Record<string, DayLog> {
  const before = log?.[day] || { seconds: 0, lessons: 0, stars: 0 };
  const next = { ...(log || {}), [day]: { seconds: before.seconds + gain.seconds, lessons: before.lessons + gain.lessons, stars: before.stars + gain.stars } };
  const cutoff = localDay(new Date(Date.parse(day + 'T12:00:00') - (KEEP_DAYS - 1) * 86400000));
  return Object.fromEntries(Object.entries(next).filter(([key]) => key >= cutoff));
}
/** The last seven days, oldest first, with totals for the parent's weekly report. */
export function weeklySummary(profile: ChildProfile, now = new Date()) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i), 12);
    const key = localDay(date), entry = profile.dailyLog?.[key] || { seconds: 0, lessons: 0, stars: 0 };
    const seconds = profile.screenTimeLog?.[key] ?? entry.seconds;
    return { key, weekday: date.getDay(), minutes: Math.round(seconds / 60), seconds, lessons: entry.lessons, stars: entry.stars };
  });
  return { days, minutes: Math.round(days.reduce((sum, d) => sum + d.seconds, 0) / 60), lessons: days.reduce((sum, d) => sum + d.lessons, 0), stars: days.reduce((sum, d) => sum + d.stars, 0), activeDays: days.filter(d => d.seconds > 0 || d.lessons > 0 || d.stars > 0).length };
}
