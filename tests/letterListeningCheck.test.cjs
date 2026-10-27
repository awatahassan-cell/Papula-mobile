const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');

function setup() {
  const load = require('../scripts/story-narration-catalog.cjs').createLoader();
  const states = [], refs = [], callbacks = [], speech = [], records = [], timers = new Map();
  let si = 0, ri = 0, ci = 0, focus, cleanup, timerId = 0;
  const react = {
    useState(value) { const i = si++; if (!(i in states)) states[i] = typeof value === 'function' ? value() : value; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(value) { return refs[ri++] ??= { current: value }; },
    useCallback(fn, deps) { const i = ci++, old = callbacks[i]; if (old && old.deps.length === deps.length && deps.every((v, j) => Object.is(v, old.deps[j]))) return old.fn; callbacks[i] = { fn, deps }; return fn; },
    createElement(type, props, ...children) { return { type, props: { ...props, children } }; },
  }; react.default = react;
  const soundService = { speakWord(text, options) { speech.push({ text, options }); return Promise.resolve(); }, stopSpeaking: async () => {}, playCorrect() {}, playEncouragingTryAgain() {} };
  const module = { exports: {} };
  const file = path.resolve('src/features/learning/LetterListeningCheck.tsx');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  new Function('exports', 'require', 'setTimeout', 'clearTimeout', code)(module.exports, name => {
    if (name === 'react') return react;
    if (name === 'react-native') return { ScrollView: 'ScrollView', View: 'View', StyleSheet: { create: x => x } };
    if (name === 'expo-router') return { useFocusEffect: fn => { focus = fn; } };
    if (name === 'lucide-react-native') return { Volume2: 'Speaker' };
    if (name.endsWith('/RTLText')) return { Text: 'Text' };
    if (name.endsWith('/TactileButton')) return { TactileButton: 'Button' };
    if (name.endsWith('/BackButton')) return { BackButton: 'Back' };
    if (name.endsWith('/useAppearance')) return { useAppearance: () => ({ colors: {} }) };
    if (name.endsWith('/useAppStore')) return { useAppStore: () => ({ recordLetterCheck: (...args) => records.push(args) }) };
    if (name.endsWith('/soundService')) return { soundService };
    return load(path.resolve(path.dirname(file), name + '.ts'));
  }, (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, id => timers.delete(id));
  const render = () => { si = ri = ci = 0; return module.exports.LetterListeningCheck({ letterId: 'dal', onExit() {} }); };
  const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
  const choices = tree => nodes(tree).filter(node => node.type === 'Button' && node.props.accessibilityLabel?.startsWith('پیتی '));
  const replay = tree => nodes(tree).find(node => node.type === 'Button' && node.props.accessibilityLabel === 'دەنگەکە دووبارە ببیستە');
  const start = () => { const tree = render(); cleanup = focus(); return tree; };
  return { start, render, choices, replay, nodes, speech, records, timers, stop: () => cleanup?.() };
}

test('unassisted listening has no visible model; choices wait for audio and a rapid double tap records once', () => {
  const app = setup(); app.start();
  let tree = app.render();
  assert.equal(app.choices(tree).length, 3);
  const target = () => app.choices(tree).find(node => node.props.accessibilityLabel === 'پیتی د');
  target().props.onPress(); assert.equal(app.records.length, 0);
  app.speech[0].options.onEnd();
  assert.equal(app.speech[1].text, 'د');
  target().props.onPress(); assert.equal(app.records.length, 0);
  app.speech[1].options.onEnd(); tree = app.render();
  assert.ok(app.choices(tree).every(node => !node.props.disabled));
  assert.equal(app.nodes(tree).filter(node => node.type === 'Text' && node.props.children[0] === 'د').length, 1, 'target appears only among the equal choices');
  target().props.onPress(); target().props.onPress();
  assert.deepEqual(app.records, [['dal', true]]);
  tree = app.render(); assert.ok(app.choices(tree).every(node => node.props.disabled));
  app.stop();
});

test('a wrong first answer cannot be replaced by a later correct tap', () => {
  const app = setup(); app.start(); app.speech[0].options.onEnd(); app.speech[1].options.onEnd();
  const tree = app.render(), choices = app.choices(tree);
  choices.find(node => node.props.accessibilityLabel !== 'پیتی د').props.onPress();
  choices.find(node => node.props.accessibilityLabel === 'پیتی د').props.onPress();
  assert.deepEqual(app.records, [['dal', false]]); app.stop();
});

test('failed or hanging audio never becomes learning evidence; replay ignores stale callbacks', () => {
  const app = setup(); app.start(); app.speech[0].options.onEnd();
  const stale = app.speech[1].options.onEnd;
  app.speech[1].options.onError();
  let tree = app.render(); assert.ok(app.choices(tree).every(node => node.props.disabled));
  app.replay(tree).props.onPress(); stale();
  tree = app.render(); assert.ok(app.choices(tree).every(node => node.props.disabled));
  const timeout = [...app.timers.values()].find(timer => timer.ms === 20000); timeout.fn();
  tree = app.render(); assert.ok(app.choices(tree).every(node => node.props.disabled));
  assert.equal(app.records.length, 0);
  app.replay(tree).props.onPress(); const pending = app.speech.at(-1).options.onEnd;
  app.stop(); pending(); assert.equal(app.records.length, 0);
});
