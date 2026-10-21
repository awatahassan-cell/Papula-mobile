const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { letterHighlightRuns, androidLetterHighlightRuns } = require('../scripts/story-narration-catalog.cjs').createLoader()(path.resolve(__dirname, '../src/services/letterHighlight.ts'));
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

test('Android color fragments retain both sides of real joins, without inventing joins after alef/reh/waw/ae', () => {
  const runs=androidLetterHighlightRuns('یاری','ی');
  assert.deepEqual(runs.map(run=>run.displayText),['ی\u200d','\u200dار','ی']);
  assert.deepEqual(runs.map(run=>run.text),['ی','ار','ی'],'speech and accessibility keep original text');
  assert.deepEqual(androidLetterHighlightRuns('سیری','ی').map(run=>run.displayText),['س\u200d','\u200dی\u200d','\u200dر','ی']);
  for(const text of ['اری','دی','ڕی','وی','ۆی','ەی','ی ی','ی،ی','ی\u200cی']) {
    const parts=androidLetterHighlightRuns(text,'ی');
    assert.equal(parts.map(run=>run.displayText).join(''),text,'natural non-joining boundaries stay unchanged: '+text);
  }
  assert.equal(androidLetterHighlightRuns('ی\u0650اری','ی')[0].displayText,'ی\u0650\u200d');
});
