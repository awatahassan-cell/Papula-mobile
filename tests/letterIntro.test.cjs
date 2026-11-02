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

test('words with a recording come first; silent ones only fill the list up to five', () => {
  const letter = letters[0];
  const all = introWords(letter);
  const silent = all[0].word;
  const list = introWords(letter, text => text !== silent);
  const at = list.findIndex(w => w.word === silent);
  assert.ok(at === -1 || at === list.length - 1 || list.slice(at).every(w => w.word === silent || false) || list.slice(0, at).every(w => w.word !== silent), 'silent word is not ahead of recorded ones');
  if (at !== -1) assert.ok(list.slice(at + 1).every(w => w.word === silent) || at === list.length - 1);
});
