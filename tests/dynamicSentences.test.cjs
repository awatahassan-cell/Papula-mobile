const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader } = require('../scripts/story-narration-catalog.cjs');
const { dynamicParts } = createLoader()(path.resolve(__dirname, '../src/services/dynamicSentences.ts'));

test('sentences with a changing word are split into the word and a fixed recording', () => {
  assert.deepEqual(dynamicParts('ئاگر. کام پیت ون بووە؟').map(p => p.text), ['ئاگر', 'کام پیت ون بووە؟']);
  assert.deepEqual(dynamicParts('دار بدۆزەوە و دەستی لێ بدە.').map(p => p.text), ['دار', 'بدۆزەوە و دەستی لێ بدە.']);
  assert.deepEqual(dynamicParts('گوێ بگرە. پیتی د بدۆزەوە و دەستی لێ بدە.').map(p => p.text), ['گوێ بگرە.', 'پیتی', 'د', 'بدۆزەوە و دەستی لێ بدە.']);
  assert.equal(dynamicParts('ئافەرم! تەواوت کرد.'), null);
});
