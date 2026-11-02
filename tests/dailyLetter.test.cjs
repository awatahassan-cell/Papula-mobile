const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const lp = load(path.resolve('src/services/lessonPath.ts'));
const ids = load(path.resolve('src/data/mockLetters.ts')).mockLetters.map(l => l.id);
const at = (day, hour = 10) => new Date(2026, 10, day, hour).toISOString();
const done = (id, iso) => ({ rounds: ['sound', 'picture', 'missing'], completedAt: iso });
// finishing the flower journey writes both records (see finishPlayPilotRound)
const kid = journeys => ({ masteredLetterIds: [], playJourneys: journeys, lessonProgress: Object.fromEntries(Object.entries(journeys).map(([id, j]) => [id, { listened: true, formsPassed: false, seenExampleIds: [], recognizedExampleIds: [], completedAt: j.completedAt }])) });

test('a letter finished today makes the next new letter wait until tomorrow', () => {
  const profile = kid({ [ids[0]]: done(ids[0], at(2)) });
  assert.equal(lp.todaysLetter(profile, new Date(2026, 10, 2, 18))?.id, ids[0]);
  assert.equal(lp.nextLetterWaits(profile, new Date(2026, 10, 2, 18)), true);
  const node = lp.lessonPath(profile, new Date(2026, 10, 2, 18)).find(n => n.letter.id === ids[1]);
  assert.equal(node.status, 'current'); assert.equal(node.waiting, true);
});

test('the next day the new letter opens again', () => {
  const profile = kid({ [ids[0]]: done(ids[0], at(2)) });
  assert.equal(lp.nextLetterWaits(profile, new Date(2026, 10, 3, 8)), false);
  assert.equal(lp.todaysLetter(profile, new Date(2026, 10, 3, 8)), undefined);
});

test('letters without a recorded date and a child who has not finished anything today are never held back', () => {
  assert.equal(lp.nextLetterWaits({ masteredLetterIds: ids.slice(0, 5) }, new Date()), false);
  assert.equal(lp.nextLetterWaits(kid({}), new Date()), false);
});

test('nothing waits once every letter is done', () => {
  const journeys = Object.fromEntries(ids.map(id => [id, done(id, at(2))]));
  assert.equal(lp.nextLetterWaits(kid(journeys), new Date(2026, 10, 2, 12)), false);
});
