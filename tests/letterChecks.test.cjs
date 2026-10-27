const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const checks = load(path.resolve('src/services/letterChecks.ts'));
const { mockLetters } = load(path.resolve('src/data/mockLetters.ts'));
const { finishPlayPilotRound, PLAY_PILOT_STEPS } = load(path.resolve('src/services/playPilot.ts'));
const kid = () => ({ masteredLetterIds: [], stars: 0, letterReviews: {}, skillProgress: {} });
const day = n => new Date(2026, 9, n, 12);
const complete = () => PLAY_PILOT_STEPS.reduce((p, step) => finishPlayPilotRound(p, step, 'dal'), kid());

test('finishing a guided journey opens practice, but never invents independent recognition', () => {
  const child = complete();
  assert.equal(checks.canCheckLetter(child, 'dal', day(26)), true);
  assert.equal(checks.letterRecognitionConfirmed(child, 'dal'), false);
  assert.equal(checks.applyLetterCheck(kid(), 'dal', true, day(26)).letterChecks, undefined);
  assert.deepEqual(child.masteredLetterIds, []);
});

test('only the first answer of a local day counts, including an unsuccessful answer', () => {
  const first = checks.applyLetterCheck(complete(), 'dal', false, day(26));
  assert.equal(first.skillProgress.recognition.attempts, 1);
  assert.equal(first.letterReviews.dal.errors, 1);
  assert.deepEqual(checks.letterCheckDates(first, 'dal'), []);
  assert.equal(checks.applyLetterCheck(first, 'dal', true, day(26)), first, 'retry cannot replace an error with success');
  assert.equal(checks.canCheckLetter(JSON.parse(JSON.stringify(first)), 'dal', day(26)), false);
  assert.equal(checks.canCheckLetter(first, 'dal', day(27)), true);
});

test('independent recognition needs first-try success on two different local days, survives reload and grants no extra stars', () => {
  const initial = complete();
  const first = checks.applyLetterCheck(initial, 'dal', true, day(26));
  assert.equal(checks.letterRecognitionConfirmed(first, 'dal'), false);
  assert.equal(checks.applyLetterCheck(first, 'dal', true, day(26)), first);
  const second = checks.applyLetterCheck(JSON.parse(JSON.stringify(first)), 'dal', true, day(27));
  assert.equal(checks.letterRecognitionConfirmed(second, 'dal'), true);
  assert.equal(second.skillProgress.recognition.independentCorrect, 2);
  assert.equal(second.stars, initial.stars);
  assert.equal(checks.canCheckLetter(second, 'dal', day(28)), false);
  assert.deepEqual(second.masteredLetterIds, []);
});

test('next-day reviews precede new checks; each question has three unique letters in varied positions', () => {
  let child = checks.applyLetterCheck(complete(), 'dal', true, day(26));
  child = { ...child, masteredLetterIds: ['dal', 'ra'] };
  assert.equal(checks.nextLetterCheck(child, day(27)).id, 'dal');
  const positions = new Set();
  for (const letter of mockLetters) for (let i = 0; i < 20; i++) {
    const choices = checks.letterCheckOptions(letter.id);
    assert.equal(new Set(choices.map(item => item.id)).size, 3);
    assert.equal(choices.filter(item => item.id === letter.id).length, 1);
    positions.add(choices.findIndex(item => item.id === letter.id));
  }
  assert.equal(positions.size, 3);
  assert.equal(checks.nextLetterCheck(kid(), day(26)), undefined);
});
