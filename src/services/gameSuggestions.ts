import { ChildProfile, LearningSkill } from './types';
import { localDay } from './learningEngine';
import { completedLetterIds } from './lessonPath';

export type GameId = 'sound' | 'phonics' | 'similar' | 'syllables' | 'word' | 'vocab' | 'quests';
/** Games in the order a child grows into them, with the skill each one practises. */
export const GAME_LEVELS: { level: 1 | 2 | 3; id: GameId; skill: LearningSkill }[] = [
  { level: 1, id: 'sound', skill: 'recognition' }, { level: 1, id: 'phonics', skill: 'phonics' }, { level: 1, id: 'similar', skill: 'forms' },
  { level: 2, id: 'syllables', skill: 'syllables' }, { level: 2, id: 'word', skill: 'word' }, { level: 2, id: 'vocab', skill: 'word' },
  { level: 1, id: 'quests', skill: 'word' },
];

/** Hard levels stay hidden until a child knows enough letters, so a new child sees only easy games. */
export const allowedLevel = (profile: ChildProfile): 1 | 2 | 3 => {
  const known = completedLetterIds(profile).length;
  return known < 4 ? 1 : known < 12 ? 2 : 3;
};

/**
 * Two games for today: from the child's level, the ones practised least first, and the day of the month
 * breaks ties so the same two do not come back every time.
 */
export function suggestedGames(profile: ChildProfile, now = new Date(), count = 2): GameId[] {
  const max = allowedLevel(profile);
  const day = Number(localDay(now).slice(-2));
  const pool = GAME_LEVELS.filter(game => game.level <= max);
  const attempts = (skill: LearningSkill) => profile.skillProgress?.[skill]?.attempts || 0;
  return pool.map((game, index) => ({ game, index, order: (index + day) % pool.length }))
    .sort((a, b) => attempts(a.game.skill) - attempts(b.game.skill) || a.order - b.order)
    .slice(0, count).map(item => item.game.id);
}
