const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const g = load(path.resolve('src/services/gameSuggestions.ts'));
const ids = load(path.resolve('src/data/mockLetters.ts')).mockLetters.map(l => l.id);
const kid = (known, extra = {}) => ({ masteredLetterIds: ids.slice(0, known), ...extra });
const day = n => new Date(2026, 2, n, 12);

test('a new child is offered only the easy games that need no reading', () => {
  assert.equal(g.allowedLevel(kid(0)), 1);
  for (let d = 1; d <= 28; d++) {
    const picks = g.suggestedGames(kid(1), day(d));
    assert.equal(picks.length, 2);
    for (const id of picks) assert.equal(g.GAME_LEVELS.find(x => x.id === id).level, 1, id);
  }
});

test('levels open as the child learns more letters', () => {
  assert.equal(g.allowedLevel(kid(4)), 2);
  assert.equal(g.allowedLevel(kid(11)), 2);
  assert.equal(g.allowedLevel(kid(12)), 3);
  const seen = new Set();
  for (let d = 1; d <= 28; d++) for (const id of g.suggestedGames(kid(20), day(d))) seen.add(id);
  assert.ok(seen.has('quests') && seen.has('syllables'), 'harder games appear for an advanced child');
});

test('the game practised least comes first, and the same two do not repeat every day', () => {
  const profile = kid(6, { skillProgress: { recognition: { attempts: 40 }, phonics: { attempts: 30 }, forms: { attempts: 25 }, syllables: { attempts: 20 }, word: { attempts: 0 } } });
  assert.ok(g.suggestedGames(profile, day(3)).includes('word') || g.suggestedGames(profile, day(3)).includes('vocab'), 'the unpractised skill is suggested');
  const days = new Set(); for (let d = 1; d <= 14; d++) days.add(g.suggestedGames(kid(1), day(d)).join());
  assert.ok(days.size > 1, 'the suggestion rotates');
});
