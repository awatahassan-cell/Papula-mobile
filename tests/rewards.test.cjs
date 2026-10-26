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

test('stickers: one list decides what is unlocked, and nothing is ever taken away', () => {
  assert.deepEqual(stickers.stickerIdsFor(0, []), []);
  const at20 = stickers.stickerIdsFor(20, []);
  assert.ok(at20.includes('stk-mountain') && !at20.includes('stk-sun'));
  const all = stickers.stickerIdsFor(1000, []);
  assert.equal(all.length, stickers.mockStickers.length, 'every sticker is reachable, not only the first four');
  assert.deepEqual(stickers.stickerIdsFor(0, ['stk-fox']), ['stk-fox'], 'owned stickers stay');
});

test('star goals are reachable and nectar never goes below zero', () => {
  const top = Math.max(...stickers.mockStickers.map(s => s.unlockedAtStars), ...garden.GARDEN_BUTTERFLIES.filter(b => b.kind === 'stars').map(b => b.n));
  assert.ok(top <= 100, 'star goals stay within reach of a few weeks of play');
  assert.equal(garden.nectarOf({ ...child(), stars: 0, pet: { fed: 3, bonus: 0 } }), 0);
});
