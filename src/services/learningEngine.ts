import { mockLetters } from '../data/mockLetters';
import { ChildProfile, ExampleWord, LetterItem, LetterReview, StoryItem } from './types';

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
  return {...profile,lastActiveDate:now.toISOString(),dailyPracticeCompletedToday:true,
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
  const known=(word:LearningWord)=>word.letterIds.filter(id=>!profile.masteredLetterIds.includes(id)).length;
  return candidates.map((word,index)=>({word,index})).sort((a,b)=>
    Number(profile.learnedWordIds?.includes(a.word.id)||false)-Number(profile.learnedWordIds?.includes(b.word.id)||false)
    || known(a.word)-known(b.word) || a.word.units.length-b.word.units.length || a.index-b.index).slice(0,count).map(item=>item.word);
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
