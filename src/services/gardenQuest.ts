import { ChildProfile } from './types';
import { mockLetters } from '../data/mockLetters';
import { wordUnits } from './learningEngine';
import { isLessonComplete, isLessonUnlocked } from './lessonPath';

export const GARDEN_STEPS = ['listen', 'find', 'build', 'write', 'story'] as const;
export type GardenStep = typeof GARDEN_STEPS[number];
export interface GardenQuestProgress { steps: GardenStep[]; flowerSpot?: number; }
export function plantedGardenFlowers(profile: ChildProfile) {
  return mockLetters.filter(letter=>gardenProgress(profile,letter.id).flowerSpot!==undefined);
}
/** One journey; old lessons and completed pilot gardens remain earned. */
export function gardenProgress(profile: ChildProfile, letterId = 'ba'): GardenQuestProgress {
  const stored = profile.gardenQuests?.[letterId] || (letterId === 'ba' ? profile.gardenQuest : undefined);
  const old = profile.lessonProgress?.[letterId];
  const legacy: Partial<Record<GardenStep,boolean>> = {
    listen: !!old?.listened, find: (old?.recognizedExampleIds?.length || 0) >= 3,
    build: !!old?.formsPassed && (old?.seenExampleIds?.length || 0) >= 3,
    write: !!profile.writingProgress?.[letterId]?.tracePassed,
  };
  const completed = isLessonComplete(profile,letterId);
  const steps: GardenStep[] = [];
  for (const step of GARDEN_STEPS) {
    if (!completed && !stored?.steps?.includes(step) && !legacy[step]) break;
    steps.push(step);
  }
  const spot = stored?.flowerSpot;
  return { steps, flowerSpot: steps.length === GARDEN_STEPS.length && Number.isInteger(spot) && spot! >= 0 && spot! < 3 ? spot : undefined };
}
export function finishGardenStep(profile: ChildProfile, step: GardenStep, letterId = 'ba'): ChildProfile {
  if (!mockLetters.some(letter => letter.id === letterId)) return profile;
  if (!isLessonUnlocked(profile,letterId)) return profile;
  const progress = gardenProgress(profile, letterId);
  if (GARDEN_STEPS[progress.steps.length] !== step) return profile;
  const next = {...profile, gardenQuests: {...profile.gardenQuests, [letterId]: {...progress, steps: [...progress.steps, step]}}};
  if (step !== 'story') return next;
  // One completion record and one lesson reward, shared by the path and garden.
  return {...next, stars: profile.stars + 2, lessonProgress: {...profile.lessonProgress, [letterId]: {
    listened:false,formsPassed:false,seenExampleIds:[],recognizedExampleIds:[],...profile.lessonProgress?.[letterId],completedAt:new Date().toISOString(),
  }}};
}
export function plantGardenFlower(profile: ChildProfile, spot: number, letterId = 'ba'): ChildProfile {
  if (!mockLetters.some(letter => letter.id === letterId)) return profile;
  const progress = gardenProgress(profile, letterId);
  if (progress.steps.length !== GARDEN_STEPS.length || progress.flowerSpot !== undefined || !Number.isInteger(spot) || spot < 0 || spot > 2) return profile;
  return {...profile, gardenQuests: {...profile.gardenQuests, [letterId]: {...progress, flowerSpot: spot}}};
}

const normalized = (text: string) => text.replace(/ھ/g, 'ه');
/** Deterministic choices, stable across resumes. Repeated letters retain individual tile identities. */
/** `known`: ids of finished letters; when given, the wrong choices come from them first (a child is not shown letters not yet taught). */
export function gardenChallenge(letterId: string, known?: string[]) {
  const index = mockLetters.findIndex(letter => letter.id === letterId);
  const letter = mockLetters[index < 0 ? 0 : index];
  const target = letter.exampleWords.find(word => !/\s/u.test(word.word)) || letter.exampleWords[0];
  const others = mockLetters.filter(item => normalized(item.glyph) !== normalized(letter.glyph));
  const rotate = <T,>(items: T[], offset: number) => [...items.slice(offset), ...items.slice(0,offset)];
  const knownFirst = known ? [...others.filter(item => known.includes(item.id)), ...others.filter(item => !known.includes(item.id))] : null;
  const choices = knownFirst ? [knownFirst[0], knownFirst[1]] : [others[(Math.max(0,index)+1)%others.length], others[(Math.max(0,index)+2)%others.length]];
  const letters = rotate([choices[0], letter, choices[1]], Math.max(0,index)%3);
  const wrong = mockLetters.flatMap(item=>item.exampleWords).filter(item=>item.word!==target.word && !normalized(item.word).includes(normalized(letter.glyph)));
  const distinct = wrong.filter((item,i)=>wrong.findIndex(other=>other.word===item.word)===i);
  const taught = (item: { word: string }) => !known || !wordUnits(item.word).some(unit => mockLetters.some(l => normalized(l.glyph) === normalized(unit) && !known.includes(l.id) && l.id !== letter.id));
  const unique = known ? [...distinct.filter(taught), ...distinct.filter(item => !taught(item))] : distinct;
  const pictures = rotate([unique[Math.max(0,index)%unique.length],target,unique[(Math.max(0,index)+1)%unique.length]], (Math.max(0,index)+1)%3);
  const tiles = wordUnits(target.word).filter(character=>!/[\s\u200c\u200d]/u.test(character)).map((glyph,id)=>({glyph,id})).reverse();
  return {letter,target,letters,pictures,tiles,word:tiles.slice().reverse().map(tile=>tile.glyph).join('')};
}
