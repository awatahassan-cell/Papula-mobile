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
const v = load(root + '/src/data/vocabulary.ts');
const { updateReview } = load(root + '/src/services/learningEngine.ts');
const day = 86400000, now = new Date('2026-03-10T10:00:00Z');
const profile = reviews => ({ wordReviews: reviews });

test('vocabulary has unique ids, words and pictures in three themes', () => {
  assert.equal(new Set(v.VOCAB.map(i => i.id)).size, v.VOCAB.length);
  assert.equal(new Set(v.VOCAB.map(i => i.word)).size, v.VOCAB.length);
  for (const category of v.VOCAB_CATEGORIES) assert.ok(v.VOCAB.filter(i => i.category === category.id).length >= 8, category.id);
  assert.ok(v.VOCAB_SENTENCES.length >= 6);
});

test('distractors never repeat the answer, a word or a picture', () => {
  for (const item of v.ALL_PICTURE_WORDS) {
    const wrong = v.pictureDistractors(item, Math.random, 2);
    assert.equal(wrong.length, 2, item.word);
    for (const other of wrong) assert.ok(other.id !== item.id && other.word !== item.word && other.emoji !== item.emoji);
  }
  for (const s of v.VOCAB_SENTENCES) assert.equal(v.sentenceDistractors(s).length, 2);
});

test('a missed word returns at once, a correct one comes back after 1, 3, 7 and 14 days', () => {
  const miss = updateReview(undefined, false, now);
  assert.ok(v.dueWords(profile({ 'v-a-cat': miss }), now).some(i => i.id === 'v-a-cat'));
  const right = updateReview(undefined, true, now);
  assert.equal(v.dueWords(profile({ 'v-a-cat': right }), now).length, 0);
  assert.equal(v.dueWords(profile({ 'v-a-cat': right }), new Date(now.getTime() + 2 * day)).length, 1);
  assert.equal(v.dueWordCount(profile({ 'vs-cat-milk': miss }), now), 1);
});

test('the plan puts missed words first, then due ones, then new ones, and keeps recently learned for last', () => {
  const missed = updateReview(undefined, false, now), fresh = updateReview(undefined, true, now);
  const due = { ...updateReview(undefined, true, new Date(now.getTime() - 5 * day)) };
  const plan = v.wordPlan(profile({ 'v-a-dog': missed, 'v-a-fish': due, 'v-a-cat': fresh }), v.VOCAB.filter(i => i.category === 'animals'), 12, now).map(i => i.id);
  assert.equal(plan[0], 'v-a-dog');
  assert.equal(plan[1], 'v-a-fish');
  assert.equal(plan[plan.length - 1], 'v-a-cat');
});

const q = load(root + '/src/data/quests.ts');
const guides = load(root + '/src/data/spokenGuides.ts');

test('every adventure has a spoken story, enough words and three distinct pictures per step', () => {
  for (const quest of q.QUESTS) {
    assert.ok(guides.QUEST_VOICE[quest.id].intro && guides.QUEST_VOICE[quest.id].outro, quest.id);
    const steps = q.questSteps(quest, {}, Math.random, now);
    assert.equal(steps.length, quest.steps, quest.id);
    assert.equal(new Set(steps.map(s => s.item.id)).size, steps.length, 'no word is asked twice');
    for (const step of steps) {
      assert.equal(step.options.length, 3);
      assert.equal(new Set(step.options.map(o => o.emoji)).size, 3, 'pictures must differ');
      assert.ok(step.options.some(o => o.id === step.item.id));
    }
  }
});

test('an adventure asks the words a child misses first, and its reward is once a day', () => {
  const missed = updateReview(undefined, false, now);
  const steps = q.questSteps(q.QUESTS[0], { wordReviews: { 'v-f-egg': missed } }, () => 0.5, now);
  assert.ok(steps.some(s => s.item.id === 'v-f-egg'));
  assert.ok(!q.questDoneToday({ questDates: {} }, 'quest-hungry', now));
  assert.ok(q.questDoneToday({ questDates: { 'quest-hungry': '2026-03-10' } }, 'quest-hungry', now));
});

test('spoken guides are short plain sentences', () => {
  assert.ok(guides.GUIDE_TEXTS.length >= 14);
  for (const text of guides.GUIDE_TEXTS) assert.ok(text.length < 140 && /[؀-ۿ]/.test(text), text);
});
