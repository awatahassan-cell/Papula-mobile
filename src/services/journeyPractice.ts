import { mockLetters } from '../data/mockLetters';
import { ChildProfile } from './types';
import { gardenChallenge } from './gardenQuest';
import { isLessonComplete } from './lessonPath';
import { CONFUSABLE_GROUPS, normalizedWord, wordUnits } from './learningEngine';
export type JourneyGameKind = 'sound' | 'missing' | 'similar';
export function journeyPracticePlan(profile:ChildProfile,letterId:string,free=false) {
  const learned=mockLetters.filter(letter=>isLessonComplete(profile,letter.id));
  const selected=mockLetters.find(letter=>letter.id===letterId)||mockLetters[0];
  const pool=free?learned:[selected];
  const kinds:JourneyGameKind[]=profile.ageGroup==='3-4'?['sound','missing']:['sound','missing','similar'];
  return pool.length?kinds.map((kind,index)=>{
    const letter=pool[index%pool.length],challenge=gardenChallenge(letter.id);
    const units=wordUnits(challenge.target.word);
    const missing=Math.max(0,units.findIndex(unit=>normalizedWord(unit)===normalizedWord(letter.glyph)));
    const answer=kind==='missing'?units[missing]:letter.glyph;
    const family=CONFUSABLE_GROUPS.find(group=>group.includes(letter.id));
    const others=mockLetters.filter(item=>normalizedWord(item.glyph)!==normalizedWord(answer));
    const alternatives=kind==='similar'&&family?others.filter(item=>family.includes(item.id)):others;
    const distractors=[...alternatives,...others].filter((item,i,all)=>all.findIndex(other=>other.id===item.id)===i).slice(0,2).map(item=>item.glyph);
    const options=[answer,...distractors];
    const rotate=mockLetters.indexOf(letter)%options.length;
    return {kind,letter,word:challenge.target.word,emoji:challenge.target.imageEmoji,answer,masked:units.map((unit,i)=>i===missing?'▢':unit).join(''),options:[...options.slice(rotate),...options.slice(0,rotate)]};
  }):[];
}
