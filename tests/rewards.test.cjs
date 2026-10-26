const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const R = p => load(path.resolve('src', p));
const pilot = R('services/playPilot.ts'), garden = R('data/garden.ts'), lessons = R('services/lessonPath.ts');
const badges = R('data/mockBadges.ts'), stickers = R('data/mockStickers.ts'), suggestions = R('services/gameSuggestions.ts');
const engine = R('services/learningEngine.ts'), letters = R('data/mockLetters.ts').mockLetters;

const child = () => ({ id: 'x', name: 't', stars: 5, streakDays: 1, masteredLetterIds: [], inProgressLetterIds: [], readStoryIds: [], savedWords: [], unlockedStickerIds: [], lastActiveDate: new Date().toISOString() });
function playJourneys(profile, count) {
  for (const letter of letters.slice(0, count)) for (const step of ['sound', 'picture', 'missing']) profile = pilot.finishPlayPilotRound(profile, step, letter.id);
  return profile;
}

// A child who finishes flower journeys but never writes a letter has "mastered" nothing, yet has completed the lessons.
test('completed journeys count everywhere a letter count is used (butterflies, badges, game levels)', () => {
  const p = playJourneys(child(), 6);
  assert.equal(p.masteredLetterIds.length, 0, 'the journey does not claim writing mastery');
  assert.equal(lessons.completedLetterIds(p).length, 6);
  assert.equal(garden.gardenCounts(p).letters, 6);
  const ids = garden.earnedButterflies(p).map(b => b.id);
  for (const id of ['letters-1', 'letters-3', 'letters-5']) assert.ok(ids.includes(id), id);
  for (const badge of badges.mockBadges.filter(b => b.targetType === 'mastered_letters')) assert.equal(badges.getBadgeStatus(badge, p).progress, Math.min(6, badge.targetCount), badge.id);
  assert.equal(suggestions.allowedLevel(playJourneys(child(), 4)), 2, 'four finished journeys open the next games');
});

test('word games prefer words made of letters the child finished on a journey', () => {
  const p = playJourneys(child(), 4); // د ر ا و: enough for «دار»
  const plan = engine.wordPlan(p, 3).map(w => w.word);
  const known = new Set(lessons.completedLetterIds(p));
  const unknownLetters = word => engine.LEARNING_WORDS.find(w => w.word === word).letterIds.filter(id => !known.has(id)).length;
  assert.ok(plan.every(word => unknownLetters(word) <= 1), `words should be almost fully readable: ${plan.join(' ')}`);
});

test('the pilot lesson reward is given once even if the journey is replayed', () => {
  const once = playJourneys(child(), 1);
  assert.equal(once.stars, 7, '5 starting stars + 2 for the lesson');
  const twice = playJourneys(once, 1);
  assert.equal(twice.stars, 7, 'replaying does not pay again');
});

const economy = R('services/rewards.ts');

test('stickers: one list decides what is unlocked, and nothing is ever taken away', () => {
  assert.deepEqual(stickers.stickerIdsFor(0, []), []);
  const at20 = stickers.stickerIdsFor(20, []);
  assert.ok(at20.includes('stk-deer') && !at20.includes('stk-mountain'));
  const all = stickers.stickerIdsFor(1000, []);
  assert.equal(all.length, stickers.mockStickers.length, 'every sticker is reachable, not only the first four');
  assert.deepEqual(stickers.stickerIdsFor(0, ['stk-fox']), ['stk-fox'], 'owned stickers stay');
});

test('the economy suits a child who plays now and then: reachable, and never over in two days', () => {
  const daily = economy.TYPICAL_DAILY_STARS, irregular = economy.IRREGULAR_DAILY_STARS;
  const goals = [...stickers.mockStickers.map(s => s.unlockedAtStars), ...garden.GARDEN_BUTTERFLIES.filter(b => b.kind === 'stars').map(b => b.n),
    ...badges.mockBadges.filter(b => b.targetType === 'total_stars').map(b => b.targetCount)];
  const top = Math.max(...goals);
  assert.ok(top / daily >= 8, `the last star goal (${top}) must outlast a week and a half of daily play`);
  assert.ok(top / irregular <= 45, 'and be reachable in about six weeks even when the child plays three days in seven');
  const sorted = [...new Set(stickers.mockStickers.map(s => s.unlockedAtStars))].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) assert.ok((sorted[i] - sorted[i - 1]) / irregular <= 6, `no wait over six days between stickers at an irregular pace (${sorted[i - 1]}→${sorted[i]})`);
  assert.ok(sorted[0] <= economy.REWARDS.startingStars, 'the first sticker is already there on day one');
});

test('daily income stays small: missions and practice cannot flood a child with stars', () => {
  const missions = R('data/mockMissions.ts').defaultDailyMissionTemplates;
  const missionStars = missions.reduce((sum, m) => sum + m.starReward, 0) + economy.REWARDS.allMissionsBonus;
  assert.ok(missionStars <= 10, `a day of missions pays ${missionStars}`);
  assert.ok(economy.REWARDS.dailyPractice <= 3);
  assert.equal(economy.kurdishDigits(30), '٣٠');
});

test('nectar never goes below zero', () => {
  assert.equal(garden.nectarOf({ ...child(), stars: 0, pet: { fed: 3, bonus: 0 } }), 0);
});
