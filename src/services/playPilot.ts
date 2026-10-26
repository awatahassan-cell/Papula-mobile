import { ChildProfile } from './types';
import { isLessonComplete, isLessonUnlocked } from './lessonPath';
export const PLAY_PILOT_LETTER='dal';
export const PLAY_PILOT_STEPS=['sound','picture','missing'] as const;
export type PlayPilotStep=typeof PLAY_PILOT_STEPS[number];
export function playPilotProgress(profile:ChildProfile,letterId=PLAY_PILOT_LETTER):PlayPilotStep[] {
  const raw=profile.playJourneys?.[letterId]?.rounds||[];
  const result:PlayPilotStep[]=[];
  for(const step of PLAY_PILOT_STEPS){if(!raw.includes(step))break;result.push(step);}
  return result;
}
/** A short play journey completes a lesson, without claiming writing mastery or reading a story. */
export function finishPlayPilotRound(profile:ChildProfile,step:PlayPilotStep,letterId=PLAY_PILOT_LETTER):ChildProfile {
  if(!isLessonUnlocked(profile,letterId))return profile;
  const before=playPilotProgress(profile,letterId);
  if(PLAY_PILOT_STEPS[before.length]!==step)return profile;
  const rounds=[...before,step];
  const finished=rounds.length===PLAY_PILOT_STEPS.length;
  const completedAt=finished?new Date().toISOString():undefined;
  const next={...profile,playJourneys:{...profile.playJourneys,[letterId]:{rounds,completedAt}}};
  if(!finished||isLessonComplete(profile,letterId))return next;
  return {...next,stars:profile.stars+2,lessonProgress:{...profile.lessonProgress,[letterId]:{listened:true,formsPassed:false,seenExampleIds:[],recognizedExampleIds:[],...profile.lessonProgress?.[letterId],completedAt}}};
}
