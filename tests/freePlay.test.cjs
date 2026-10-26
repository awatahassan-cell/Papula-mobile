const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const f = load(path.resolve('src/services/freePlay.ts'));
const ids = load(path.resolve('src/data/mockLetters.ts')).mockLetters.map(l => l.id);
const kid = known => ({ masteredLetterIds: ids.slice(0, known) });
const states = (n, speak) => Object.fromEntries(f.freePlayStates(kid(n), speak).map(s => [s.id, s]));

test('a child with no letters has every free-play game locked, with the number of letters still needed', () => {
  const s = states(0);
  for (const g of Object.values(s)) assert.equal(g.open, false);
  assert.equal(s.pairs.missing, 3); assert.equal(s.catch.missing, 4); assert.equal(s.train.missing, 6);
});

test('games open one by one as letters are learned', () => {
  let opened = 0;
  for (let n = 0; n <= 14; n++) { const now = f.freePlayStates(kid(n)).filter(s => s.open).length; assert.ok(now >= opened, `never closes again at ${n}`); opened = now; }
  assert.equal(opened, 3, 'all three are open for a child who knows 14 letters');
  assert.equal(states(5).train.open, false, 'word train waits for six letters');
});

test('pairs and the word train only use pictures whose letters the child knows, and that have a recorded voice', () => {
  const profile = kid(10), known = new Set(ids.slice(0, 10));
  for (const w of f.trainWords(profile)) assert.ok(w.letterIds.every(id => known.has(id)) && w.imageEmoji, w.word);
  for (const w of f.pairWords(profile)) assert.ok(known.has(w.letterIds[0]), w.word);
  assert.equal(f.pairWords(profile, () => false).length, 0, 'words without a recording are left out');
  assert.equal(states(10, () => false).pairs.open, false, 'no recordings, no pairs game');
});
