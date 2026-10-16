import { mockLetters } from '../data/mockLetters';
import { ChildProfile, LearningSkill, SkillProgress, StrokeGuide, StrokePoint, WritingMode, WritingProgress } from './types';
import { LEARNING_WORDS, shuffled, localDay, normalizedWord, reviewPlan, wordUnits } from './learningEngine';
import { evaluateTracing } from './tracingScorer';
import { resamplePolyline } from './pathSimilarity';
import { SKILL_LABELS } from './skillLabels';

export { SKILL_LABELS };
export function skillAttempt(previous: SkillProgress | undefined, correct: boolean, helped=false): SkillProgress {
  return {independentCorrect:(previous?.independentCorrect||0)+(correct&&!helped?1:0),attempts:(previous?.attempts||0)+1,correct:(previous?.correct||0)+(correct?1:0),helped:(previous?.helped||0)+(helped?1:0),lastAt:new Date().toISOString()};
}
export function advanceWriting(previous: WritingProgress | undefined, mode: WritingMode, passed: boolean, helped=false, now=new Date()): WritingProgress {
  const result: WritingProgress = {tracePassed:previous?.tracePassed||false,copyPassed:previous?.copyPassed||false,independentPassDates:[...(previous?.independentPassDates||[])]};
  if (!passed || (mode==='independent' && helped)) return result;
  if (mode==='trace') result.tracePassed=true;
  if (mode==='copy' && result.tracePassed) result.copyPassed=true;
  if (mode==='independent' && result.tracePassed && result.copyPassed && !result.independentPassDates.includes(localDay(now))) result.independentPassDates.push(localDay(now));
  return result;
}
export const writingMastered = (progress?: WritingProgress) => !!progress?.tracePassed && !!progress.copyPassed && new Set(progress.independentPassDates).size>=2;
export function suggestedWritingMode(progress?: WritingProgress): WritingMode { return !progress?.tracePassed?'trace':!progress.copyPassed?'copy':'independent'; }
export function normalizeIndependentWriting(guide: StrokeGuide, strokes: StrokePoint[][]): StrokePoint[][] {
  const bounds=(points:StrokePoint[])=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
  const all=strokes.flat();if(!all.length)return strokes;
  const user=bounds(all),reference=bounds(guide.strokes.flat());
  const span=Math.max(user.maxX-user.minX,user.maxY-user.minY);
  if(span<12)return strokes;
  const scale=Math.max(0.65,Math.min(1.5,Math.max(reference.maxX-reference.minX,reference.maxY-reference.minY)/span));
  return strokes.map(stroke=>stroke.map(point=>({x:(point.x-(user.minX+user.maxX)/2)*scale+(reference.minX+reference.maxX)/2,y:(point.y-(user.minY+user.maxY)/2)*scale+(reference.minY+reference.maxY)/2})));
}
export function assessWriting(guide:StrokeGuide, strokes:StrokePoint[][], mode:WritingMode) {
  const aligned=mode==='trace'?strokes:normalizeIndependentWriting(guide,strokes);
  const result=evaluateTracing(guide,aligned);
  if(result.mastered || !aligned.length)return result;
  const drawn=aligned.flatMap(stroke=>resamplePolyline(stroke,1));
  const components=Array.from(new Set(guide.componentIds||guide.strokes.map((_,i)=>i)));
  const missing=components.map(id=>{
    const points=guide.strokes.filter((_,i)=>(guide.componentIds?.[i]??i)===id).flatMap(stroke=>resamplePolyline(stroke,1));
    const covered=points.filter(p=>drawn.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<8)).length/Math.max(1,points.length);
    return {points,covered};
  }).filter(item=>item.covered<0.45);
  const dots=missing.filter(item=>Math.max(...item.points.map(p=>p.x))-Math.min(...item.points.map(p=>p.x))<10 && Math.max(...item.points.map(p=>p.y))-Math.min(...item.points.map(p=>p.y))<10);
  if(dots.length && result.coverageRatio>0.55)result.feedbackKu=`بەشە سەرەکییەکەت نووسیوە؛ ${dots.length} خاڵ یان نیشانەی بچووک ماوە. نموونەکە سەیر بکە و تەواوی بکە ✍️`;
  else if(result.lengthRatio>1.65)result.feedbackKu='هێڵی زیادە زۆرە؛ جارێکی تر بە هێڵی کەمتر شێوەی پیتەکە بنووسە.';
  else if(result.coverageRatio<0.65)result.feedbackKu='بەشێکی شێوەی پیتەکە ماوە؛ نموونەکە سەیر بکە و هێڵەکە تەواو بکە.';
  return result;
}
export function startingSoundWords(profile:ChildProfile,count=5) {
  const plan=reviewPlan(profile,mockLetters.length);
  return plan.map(letter=>LEARNING_WORDS.find(word=>normalizedWord(word.units[0])===normalizedWord(letter.glyph))).filter((word):word is typeof LEARNING_WORDS[number]=>!!word).slice(0,count);
}
export function readableText(text:string,profile:ChildProfile): boolean {
  const known=new Set([...profile.masteredLetterIds,...Object.entries(profile.letterReviews||{}).filter(([,r])=>r.level>=1).map(([id])=>id),...Object.entries(profile.writingProgress||{}).filter(([,progress])=>progress.tracePassed).map(([id])=>id)]);
  const learned=new Set((profile.learnedWordIds||[]).map(id=>normalizedWord(LEARNING_WORDS.find(word=>word.id===id)?.word||'')));
  return text.split(/\s+/).filter(Boolean).every(token=>{
    const word=token.replace(/[،؛.!؟«»“”():\d]/g,'');
    if(!word || learned.has(normalizedWord(word)))return true;
    return wordUnits(word).every(unit=>{const letter=mockLetters.find(item=>normalizedWord(item.glyph)===normalizedWord(unit));return !!letter&&known.has(letter.id);});
  });
}
export function skillSummary(profile:ChildProfile) {
  return Object.entries(SKILL_LABELS).map(([skill,label])=>{const record=profile.skillProgress?.[skill as LearningSkill];return {skill:skill as LearningSkill,label,record,accuracy:record?.attempts?Math.round(record.correct/record.attempts*100):null};});
}

export function readingPracticeStories(profile:ChildProfile) {
  const sentences=[['دار','دار هەیە.','🌳'],['نان','نان هەیە.','🥖'],['گوڵ','گوڵ هەیە.','🌷'],['ماسی','ماسی هەیە.','🐟'],['باران','باران دەبارێت.','🌧️'],['خۆر','خۆر دەرکەوت.','☀️'],['مانگ','مانگ دەرکەوت.','🌙']];
  return sentences.filter(([,text])=>readableText(text,profile)).map(([word,text,emoji])=>({
    id:'read-'+word,titleKu:'خۆم دەخوێنمەوە: '+word,titleEn:'Reading practice',practiceMode:'read' as const,level:1 as const,durationMinutes:1,isPremium:false,coverEmoji:emoji,coverThemeColor:'#ecfdf5',summaryKu:'دەقێکی کورت بە پیت و وشە ناسراوەکان',
    pages:[{pageNumber:1,textKu:text,illustrationTheme:emoji,illustrationSvgId:'read-'+word,audioDurationMs:0,wordTimings:[]}],
    quiz:{questionKu:'چیمان لەم ڕستەیەدا خوێندەوە؟',options:shuffled([word,...LEARNING_WORDS.filter(w=>w.word!==word&&w.units.length<=3).slice(0,2).map(w=>w.word)]).map(item=>({id:item,textKu:item,imageEmoji:LEARNING_WORDS.find(w=>w.word===item)?.imageEmoji||'📖',isCorrect:item===word}))},
  }));
}
