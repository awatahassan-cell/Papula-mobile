const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { letterHighlightRuns } = require('../scripts/story-narration-catalog.cjs').createLoader()(path.resolve(__dirname, '../src/services/letterHighlight.ts'));
test('only the target letter changes color, with exact Kurdish text and combining marks preserved', () => {
  for (const [word, glyph, targets] of [
    ['یاری', 'ی', ['ی', 'ی']], ['دیاری', 'ا', ['ا']], ['گەڵاوێژگان،', 'ا', ['ا', 'ا']],
    ['چووە', 'وو', ['وو']], ['ھەموو', 'ه', ['ھ']], ['منداڵەکان', 'ز', []], ['ی\u0650اری', 'ی', ['ی\u0650', 'ی']],
  ]) {
    const runs = letterHighlightRuns(word, glyph);
    assert.equal(runs.map(run => run.text).join(''), word, 'never insert spaces, ZWJ, or presentation forms');
    assert.deepEqual(runs.filter(run => run.target).map(run => run.text), targets);
  }
});
