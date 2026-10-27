const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const { introWords } = load(path.resolve('src/services/letterIntro.ts'));
const letters = load(path.resolve('src/data/mockLetters.ts')).mockLetters;

test('every letter introduces up to five picture words that contain it', () => {
  for (const letter of letters) {
    const words = introWords(letter);
    assert.ok(words.length >= 1 && words.length <= 5, `${letter.id}: ${words.length}`);
    assert.equal(new Set(words.map(w => w.word)).size, words.length, 'no repeated word');
    for (const w of words) assert.ok(w.picture, `${letter.id} ${w.word} has a picture`);
  }
});

test('words without a recording are left out so the voice never goes silent mid-list', () => {
  const letter = letters[0];
  const all = introWords(letter);
  const kept = introWords(letter, text => text !== all[0].word);
  assert.ok(!kept.some(w => w.word === all[0].word));
});
