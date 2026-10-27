const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const engine = load(path.resolve('src/services/learningEngine.ts'));
const letters = load(path.resolve('src/data/mockLetters.ts')).mockLetters;
const free = load(path.resolve('src/services/freePlay.ts'));
const profile = { masteredLetterIds: letters.map(item => item.id) };

function game(file, name) {
  const states = [], refs = [], memos = [], records = [], timers = [];
  let si = 0, ri = 0, mi = 0;
  const react = {
    useState(value) { const i = si++; if (!(i in states)) states[i] = typeof value === 'function' ? value() : value; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(value) { return refs[ri++] ??= { current: value }; },
    useMemo(fn, deps) { const i = mi++, old = memos[i]; if (old && old.deps.length === deps.length && deps.every((v, j) => Object.is(v, old.deps[j]))) return old.value; const value = fn(); memos[i] = { value, deps }; return value; },
    useEffect() {}, createElement(type, props, ...children) { return { type, props: { ...props, children } }; },
  }; react.default = react;
  const module = { exports: {} }, absolute = path.resolve('src/features/freeplay', file);
  new Function('exports', 'require', 'setTimeout', 'clearTimeout', ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(module.exports, dep => {
    if (dep === 'react') return react;
    if (dep === 'react-native') return { ScrollView: 'ScrollView', View: 'View', StyleSheet: { create: x => x }, I18nManager: { isRTL: true }, useWindowDimensions: () => ({ width: 360, height: 640 }) };
    if (dep === 'expo-linear-gradient') return { LinearGradient: 'Gradient' };
    if (dep.endsWith('/Motion')) return { useReducedMotion: () => true };
    if (dep.endsWith('/RTLText')) return { Text: 'Text' };
    if (dep.endsWith('/BackButton')) return { BackButton: 'Back' };
    if (dep.endsWith('/CharacterPicture')) return { CharacterPicture: 'Picture' };
    if (dep.endsWith('/TactileButton')) return { TactileButton: 'Button' };
    if (dep.endsWith('/useAppStore')) return { useAppStore: () => ({ currentProfile: profile, recordPracticeResult: (...args) => records.push(args) }) };
    if (dep.endsWith('/soundService')) return { soundService: { playCorrect() {}, playEncouragingTryAgain() {}, speakWord() {} } };
    if (dep.endsWith('/learningEngine')) return { ...engine, shuffled: items => [...items] };
    if (dep === './playKit') return { Finish: 'Finish', GameGuide: 'Guide', PlayHeader: 'Header', Tile: 'Tile', K: {}, PALETTE: new Proxy({}, { get: () => ({}) }), BUBBLE_COLOURS: [{}], canSay: () => true, say() {}, sayLetter() {}, useStop() {} };
    return load(path.resolve(path.dirname(absolute), dep + '.ts'));
  }, fn => { timers.push(fn); return timers.length; }, () => {});
  const render = () => { si = ri = mi = 0; return module.exports[name]({ onExit() {} }); };
  const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
  return { render, records, nodes, timers, tiles: tree => nodes(tree).filter(node => node.type === 'Tile') };
}

for (const wrong of [false, true]) test(`word train: ${wrong ? 'an error survives completion' : 'first-try success counts once'} and reveals the joined word`, () => {
  const app = game('FreePlayGames.tsx', 'TrainGame'), word = free.trainWords(profile)[0];
  let tree = app.render();
  if (wrong) app.tiles(tree).find(node => node.props.label !== word.units[0]).props.onPress();
  for (const glyph of word.units) {
    tree = app.render(); const tile = app.tiles(tree).find(node => node.props.label === glyph && !node.props.disabled);
    tile.props.onPress(); tile.props.onPress();
  }
  tree = app.render();
  assert.equal(app.records.length, 1);
  assert.equal(app.records[0][1], !wrong);
  assert.ok(app.nodes(tree).some(node => node.type === 'Text' && node.props.children[0] === word.word));
});

test('missing letter records the first error immediately, keeps it after correction and shows the joined word', () => {
  const app = game('FreePlayMore.tsx', 'FillGame'); let tree = app.render();
  const row = app.nodes(tree).find(node => node.type === 'View' && app.nodes(node).some(child => child.type === 'Text' && child.props.children[0] === '؟'));
  assert.ok(row);
  // A correct option changes the screen to its completed state; try wrong choices first by reading the word slots.
  const word = free.trainWords(profile)[0];
  const missing = app.nodes(tree).filter(node => node.type === 'Text').map(node => node.props.children[0]).indexOf('؟');
  assert.ok(missing >= 0);
  const slots = app.nodes(tree).filter(node => node.type === 'Text').map(node => node.props.children[0]).filter(value => value === '؟' || word.units.includes(value));
  const expected = word.units[slots.indexOf('؟')];
  const wrongTile = app.tiles(tree).find(node => node.props.label !== expected);
  wrongTile.props.onPress(); assert.equal(app.records.length, 1); assert.equal(app.records[0][1], false);
  tree = app.render(); app.tiles(tree).find(node => node.props.label === expected).props.onPress();
  assert.equal(app.records.length, 1);
  tree = app.render(); assert.ok(app.nodes(tree).some(node => node.type === 'Text' && node.props.children[0] === word.word));
});

test('memory cards count supported play, retain mismatches and reject rapid duplicate flips', () => {
  const app = game('FreePlayGames.tsx', 'PairsGame'); let tree = app.render();
  let cards = app.nodes(tree).filter(node => node.type === 'Button');
  cards[0].props.onPress(); cards[0].props.onPress();
  assert.equal(app.records.length, 0);
  cards[2].props.onPress();
  assert.equal(app.records.length, 2); assert.ok(app.records.every(record => record[1] === false && record[4] === true));
  app.timers.shift()(); tree = app.render(); cards = app.nodes(tree).filter(node => node.type === 'Button');
  cards[0].props.onPress(); cards[1].props.onPress();
  assert.equal(app.records.length, 2, 'correction does not erase the first mismatched pair');
});

test('every free-play guide has a bundled recording', () => {
  const { FREE_PLAY_GUIDES } = load(path.resolve('src/features/freeplay/freePlayText.ts'));
  const manifest = JSON.parse(fs.readFileSync('assets/audio/papula-v2/manifest.json', 'utf8'));
  const { keyFor } = require('../scripts/offline-audio-catalog.cjs');
  for (const text of Object.values(FREE_PLAY_GUIDES)) {
    const track = manifest.records[keyFor(text)]; assert.ok(track, text);
    assert.ok(fs.existsSync(path.resolve('assets/audio/papula-v2', track.file)));
  }
});

test('letter-to-picture errors are retained and a correct match counts supported phonics only once', () => {
  const app = game('FreePlayMore.tsx', 'MatchLettersGame');
  let tree = app.render(), tiles = app.tiles(tree), count = tiles.length / 2;
  tiles[0].props.onPress(); tree = app.render();
  app.tiles(tree)[count + 1].props.onPress(); app.tiles(tree)[count + 1].props.onPress();
  assert.equal(app.records.length, 1); assert.equal(app.records[0][1], false);
  app.timers.shift()(); tree = app.render(); app.tiles(tree)[0].props.onPress();
  tree = app.render(); app.tiles(tree)[count].props.onPress();
  assert.equal(app.records.length, 1, 'correction cannot turn the original error into first-try success');
  tree = app.render(); app.tiles(tree)[1].props.onPress(); tree = app.render();
  app.tiles(tree)[count + 1].props.onPress(); app.tiles(tree)[count + 1].props.onPress();
  assert.equal(app.records.length, 2);
  assert.deepEqual(app.records[1].slice(1), [true, undefined, 'phonics', true]);
});

test('a visible target in bubble play never counts as independent listening, even after a double tap', () => {
  const app = game('FreePlayGames.tsx', 'CatchGame'), tree = app.render();
  const bubbles = app.nodes(tree).filter(node => node.props.letter?.id && node.props.onPress);
  const target = app.nodes(tree).find(node => node.type === 'Guide').props.target;
  const correct = bubbles.find(node => node.props.letter.glyph === target);
  correct.props.onPress(); correct.props.onPress();
  assert.equal(app.records.length, 1);
  assert.deepEqual(app.records[0].slice(1), [true, undefined, 'recognition', true]);
});

test('odd-one-out practises visual recognition, without claiming joined-letter forms or recording duplicate wins', () => {
  const app = game('FreePlayMore.tsx', 'OddGame'), tree = app.render(), tiles = app.tiles(tree);
  const odd = tiles.find(tile => tiles.filter(other => other.props.label === tile.props.label).length === 1);
  odd.props.onPress(); odd.props.onPress();
  assert.equal(app.records.length, 1);
  assert.equal(app.records[0][3], 'recognition');
});
