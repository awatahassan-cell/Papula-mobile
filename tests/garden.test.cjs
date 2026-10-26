const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '..'), cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} }; cache.set(file, module.exports);
  new Function('exports', 'module', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module.exports, module, p => p.startsWith('.') ? load(path.resolve(path.dirname(file), p.endsWith('.json') ? p : p + '.ts')) : require(p));
  return module.exports;
}
const g = load(root + '/src/data/garden.ts');
const { tintedButterfly } = load(root + '/src/components/tintedButterfly.ts');
const now = new Date('2026-03-10T10:00:00');
const letterIds = load(root + '/src/data/mockLetters.ts').mockLetters.map(l => l.id);
const kid = extra => ({ masteredLetterIds: [], readStoryIds: [], streakDays: 0, stars: 0, lastActiveDate: now.toISOString(), ...extra });

test('every butterfly has a unique id, a reachable goal and a hue', () => {
  assert.equal(new Set(g.GARDEN_BUTTERFLIES.map(b => b.id)).size, g.GARDEN_BUTTERFLIES.length);
  assert.ok(g.GARDEN_BUTTERFLIES.length >= 24);
  for (const b of g.GARDEN_BUTTERFLIES) assert.ok(b.n >= 1 && Number.isFinite(b.hue) && g.GOAL_TEXT[b.kind](b.n));
  assert.ok(new Set(g.GARDEN_BUTTERFLIES.map(b => b.hue)).size >= 22, 'butterflies must look different');
});

test('butterflies unlock from existing progress and are announced once', () => {
  const none = kid();
  assert.equal(g.earnedButterflies(none).length, 0);
  const some = kid({ masteredLetterIds: letterIds.slice(0, 3), readStoryIds: ['s1'], stars: 12, streakDays: 2 });
  const ids = g.earnedButterflies(some).map(b => b.id);
  for (const id of ['letters-1', 'letters-3', 'stories-1', 'streak-2', 'stars-10']) assert.ok(ids.includes(id), id);
  assert.equal(g.unseenButterflies({ ...some, seenButterflyIds: ids }).length, 0);
  assert.equal(g.unseenButterflies(some).length, ids.length);
  assert.equal(g.gardenCounts(kid({ learnedWordIds: ['w1'], wordReviews: { w1: { correct: 1 }, v1: { correct: 2 }, v2: { correct: 0 } } })).words, 2);
});

test('feeding costs nectar, grows the friend through the stages and never goes below zero', () => {
  let p = kid({ stars: 3 });
  assert.equal(g.nectarOf(p), 3);
  for (let i = 0; i < 5; i++) p = g.feed(p, now);
  assert.equal(g.petFed(p), 3, 'only three drops were available');
  assert.equal(g.nectarOf(p), 0);
  assert.equal(g.feed(p, now), p);
  assert.equal(g.petStage(0).id, 'egg');
  assert.equal(g.petStage(3).id, 'caterpillar');
  assert.equal(g.petStage(8).id, 'cocoon');
  assert.equal(g.petStage(18).id, 'baby');
  assert.equal(g.petStage(35).id, 'butterfly');
  assert.equal(g.petStage(70).id, 'royal');
  assert.equal(g.stageProgress(70), 1);
  assert.equal(g.stageProgress(13), 0.5, 'halfway between cocoon (8) and baby (18)');
  assert.equal(g.nextStage(70), undefined);
});

test('the daily gift can be taken once a day and always gives 2 to 5 drops', () => {
  let p = kid({ stars: 0 });
  assert.ok(g.giftReady(p, now));
  p = g.claimGift(p, now);
  assert.ok(!g.giftReady(p, now));
  assert.equal(g.claimGift(p, now), p);
  assert.ok(g.nectarOf(p) >= 2 && g.nectarOf(p) <= 5);
  assert.ok(g.giftReady(p, new Date('2026-03-11T09:00:00')));
  for (let d = 1; d <= 60; d++) { const a = g.giftAmount(new Date(2026, 0, d)); assert.ok(a >= 2 && a <= 5); }
});

test('a friend who was away gets sleepy, never sad, and is happy once fed', () => {
  const away = kid({ stars: 5, lastActiveDate: new Date(now.getTime() - 4 * 86400000).toISOString() });
  assert.equal(g.petMood(away, now), 'sleepy');
  assert.equal(g.petMood(g.feed(away, now), now), 'happy');
  assert.equal(g.petMood(kid({ stars: 1 }), now), 'calm');
});

test('tinted butterflies get their own gradient ids and keep valid colours; locked ones are grey', () => {
  const a = tintedButterfly('x-1', 90), b = tintedButterfly('x-2', -90), locked = tintedButterfly('x-3', 0, 'happy', true);
  assert.notEqual(a.wings, b.wings);
  assert.ok(a.wings.includes('bfx1-') && !a.wings.includes('"bf-') && b.wings.includes('bfx2-'));
  for (const art of [a, b, locked]) assert.ok(!/#[0-9a-f]{0,5}["')]/i.test(art.wings));
  assert.ok(!/#(ed5aa9|30b9e4|48c79c)/i.test(locked.wings));
  assert.equal(tintedButterfly('x-1', 90), a, 'cached');
});

test('gifts keep for up to three days, so a child who was away is welcomed with more', () => {
  const day = d => new Date(2026, 2, d, 12);
  const first = g.giftTotal(kid(), day(10));
  assert.ok(first >= 2 && first <= 5, 'a first gift is one day');
  const claimed = g.claimGift(kid(), day(10));
  assert.equal(g.giftDaysOwed(claimed, day(10)), 0, 'already taken today');
  assert.equal(g.giftDaysOwed(claimed, day(11)), 1, 'next day: one gift');
  assert.equal(g.giftDaysOwed(claimed, day(12)), 2, 'two days away: two gifts');
  assert.equal(g.giftDaysOwed(claimed, day(20)), 3, 'ten days away: capped at three');
  const back = g.giftTotal(claimed, day(20));
  assert.ok(back >= 6 && back <= 15, `three days of 2-5 drops (${back})`);
  assert.equal(g.nectarOf(g.claimGift(claimed, day(20))), g.nectarOf(claimed) + back);
});

test('days played count even with gaps, unlike the streak', () => {
  const engine = load(root + '/src/services/learningEngine.ts');
  let p = { ...kid(), streakDays: 0, lastActiveDate: undefined };
  p = engine.learningActivity(p, new Date(2026, 2, 1, 10));
  p = engine.learningActivity(p, new Date(2026, 2, 1, 18));
  assert.equal(p.activeDays, 1, 'two sessions the same day are one day');
  p = engine.learningActivity(p, new Date(2026, 2, 9, 10));
  assert.equal(p.activeDays, 2, 'a gap does not lose the first day');
  assert.equal(p.streakDays, 1, 'but the streak did reset');
  assert.equal(g.gardenCounts(p).streak, 2, 'butterflies for days use days played');
  assert.equal(g.gardenCounts({ ...p, activeDays: 0, streakDays: 5 }).streak, 5, 'old profiles keep their streak');
});
