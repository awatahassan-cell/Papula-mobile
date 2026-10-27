const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const { applyPracticeResult } = load(path.resolve('src/services/practiceResult.ts'));
const { LEARNING_WORDS, updateReview } = load(path.resolve('src/services/learningEngine.ts'));
const word = LEARNING_WORDS[0];
const base = () => ({ stars: 0, masteredLetterIds: [], learnedWordIds: [], letterReviews: {}, wordReviews: {}, skillProgress: {} });

test('helped answers retain attempt and error counts without inventing learned words, stars or spaced review', () => {
  const original = base();
  original.letterReviews[word.letterIds[0]] = updateReview(undefined, false);
  let child = applyPracticeResult(original, word.letterIds, false, word.id, 'word', true);
  child = applyPracticeResult(child, word.letterIds, true, word.id, 'word', true);
  assert.equal(child.skillProgress.word.attempts, 2);
  assert.equal(child.skillProgress.word.correct, 1);
  assert.equal(child.skillProgress.word.helped, 2);
  assert.equal(child.skillProgress.word.independentCorrect, 0);
  assert.deepEqual(child.letterReviews, original.letterReviews);
  assert.deepEqual(child.wordReviews, {});
  assert.deepEqual(child.learnedWordIds, []);
  assert.equal(child.stars, 0);
  assert.deepEqual(original.skillProgress, {});
});

test('independent first-try work still advances review and rewards a new word once', () => {
  const first = applyPracticeResult(base(), [...word.letterIds, word.letterIds[0]], true, word.id, 'word');
  assert.equal(first.skillProgress.word.independentCorrect, 1);
  assert.equal(first.letterReviews[word.letterIds[0]].attempts, 1);
  assert.ok(first.learnedWordIds.includes(word.id));
  assert.equal(first.stars, 1);
  const second = applyPracticeResult(first, word.letterIds, true, word.id, 'word');
  assert.equal(second.stars, 1);
  const wrong = applyPracticeResult(second, word.letterIds, false, word.id, 'word');
  assert.equal(wrong.letterReviews[word.letterIds[0]].errors, 1);
  assert.equal(wrong.wordReviews[word.id].errors, 1);
});
