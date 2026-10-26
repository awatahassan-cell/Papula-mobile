import { mockLetters } from '../../data/mockLetters';
import { gardenChallenge } from '../../services/gardenQuest';

const normalize=(word:string)=>word.replace(/ھ/g,'ه');
/** A whole teaching entry (including وو) is removed once; the rest stays joined. */
export function playJourneyContent(letterId:string) {
  const {letter,target,letters,pictures}=gardenChallenge(letterId);
  const offset=normalize(target.word).indexOf(normalize(letter.glyph));
  if(offset<0)throw new Error(`Missing teaching entry ${letter.id} in ${target.word}`);
  const masked=target.word.slice(0,offset)+'▢'+target.word.slice(offset+letter.glyph.length);
  const sound=`گوێ بگرە. پیتی ${letter.glyph} بدۆزەوە و دەستی لێ بدە.`;
  const picture=`${target.word} بدۆزەوە و دەستی لێ بدە.`;
  const missing=`${target.word}. کام پیت لە وشەکەدا ون بووە؟ پیتی دروست هەڵبژێرە.`;
  const targetId=letter.id==='dal'?'tree':target.id;
  const rounds=[
    {title:'پیت بدۆزەوە',instruction:sound,options:letters.map(item=>({id:item.id,glyph:item.glyph,label:`پیتی ${item.glyph}`})),answer:letter.id},
    {title:`${target.word} بدۆزەوە`,instruction:picture,options:pictures.map(item=>({id:item.id===target.id?targetId:item.id,glyph:item.imageEmoji,label:item.word})),answer:targetId},
    {title:'وشەکە تەواو بکە',instruction:missing,options:letters.map(item=>({id:item.id,glyph:item.glyph,label:`پیتی ${item.glyph}`})),answer:letter.id},
  ];
  return {letter,target,masked,rounds};
}
export const PLAY_JOURNEY_NARRATION=mockLetters.flatMap(letter=>playJourneyContent(letter.id).rounds.map(round=>round.instruction));
