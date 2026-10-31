const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const service = require('../scripts/story-narration-catalog.cjs').createLoader()(path.resolve('src/services/letterHighlight.ts'));

function render(platform, word, glyph) {
  const module = { exports: {} };
  const react = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) }; react.default = react;
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync('src/components/HighlightedWord.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(module.exports, name => {
    if (name === 'react') return react;
    if (name === 'react-native') return { Platform: { OS: platform } };
    if (name === './RTLText') return { Text: 'Paragraph', InlineText: 'Span' };
    if (name.endsWith('/letterHighlight')) return service;
    throw Error(name);
  });
  return module.exports.HighlightedWord({ word, glyph, style: { fontSize: 19, color: '#123456' }, onPress() {} });
}
const content = value => typeof value === 'string' ? value : Array.isArray(value) ? value.map(content).join('') : value ? content(value.props.children) : '';

test('only target letters turn red; all platforms keep the word in one text layout and its authored accessibility label', () => {
  for (const platform of ['android', 'ios', 'web']) for (const [word, glyph] of [['پەپوولە', 'پ'], ['سیری', 'ی'], ['یاری', 'ی'], ['ی\u0650اری', 'ی'], ['ھەموو', 'ه'], ['چووە', 'وو'], ['نان', 'ز']]) {
    const tree = render(platform, word, glyph), parts = tree.props.children[0];
    assert.equal(tree.type, 'Paragraph');
    assert.equal(tree.props.accessibilityLabel, word);
    assert.deepEqual(tree.props.style, { fontSize: 19, color: '#123456' });
    assert.equal(content(tree).replace(/\u200d/g, ''), word);
    const spans = parts.filter(part => typeof part === 'object');
    assert.deepEqual(spans.map(span => content(span).replace(/\u200d/g, '')), service.letterHighlightRuns(word, glyph).filter(run => run.target).map(run => run.text));
    for (const span of spans) {
      assert.equal(span.type, 'Span');
      assert.deepEqual(span.props.style, { color: '#dc2626' }, 'no independent font, spacing or direction at a color boundary');
    }
    if (platform !== 'android') assert.equal(content(tree), word);
  }
});

test('Android retains contextual joining before and after a red letter, but never forces a non-joining letter to connect', () => {
  assert.equal(content(render('android', 'سیری', 'ی')), 'س\u200d\u200dی\u200d\u200dری');
  assert.equal(content(render('android', 'اری', 'ا')), 'اری');
  assert.equal(content(render('android', 'دی', 'د')), 'دی');
  assert.equal(content(render('android', 'ی ی', 'ی')), 'ی ی');
});
