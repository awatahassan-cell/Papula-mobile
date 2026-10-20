const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('family story recordings handle permission, duplicate taps, local saving, playback and screen cleanup', async () => {
  let states = [], refs = [], effects = [], cursor = 0, refCursor = 0, effectCursor = 0;
  let granted = false, recording = false, playing = false, permissions = 0, starts = 0, stops = 0, began = 0;
  const changes = [], modes = [], storage = new Map(), files = new Set();
  let appStateListener;
  const react = {
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
    useRef(initial) { const index = refCursor++; return refs[index] ??= { current: initial }; },
    useEffect(fn, deps) { const index = effectCursor++, previous = effects[index]; if (!previous || !deps || deps.some((value, i) => value !== previous.deps[i])) effects[index] = { fn, deps, cleanup: previous?.cleanup, pending: true }; },
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  };
  react.default = react;
  const recorder = { uri: 'file:///cache/reading.m4a', prepareToRecordAsync: async () => {}, record() { starts++; recording = true; }, stop: async () => { stops++; recording = false; } };
  const player = { pause() { playing = false; }, replace(source) { assert.ok(files.has(source.uri)); }, play() { playing = true; } };
  class File {
    constructor(...parts) { this.uri = parts.map(part => part.uri ?? part).join('/').replace('documents//', 'documents/'); }
    get exists() { return files.has(this.uri); }
    copy(destination) { files.add(destination.uri); }
    delete() { files.delete(this.uri); }
  }
  const mod = { exports: {} };
  const source = fs.readFileSync(path.resolve(__dirname, '../src/features/stories/StoryVoiceRecorder.tsx'), 'utf8');
  new Function('exports', 'module', 'require', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText)(mod.exports, mod, name => {
    if (name === 'react') return react;
    if (name === 'react-native') return { View: 'View', Platform: { OS: 'android' }, StyleSheet: { create: value => value }, AppState: { addEventListener: (_, fn) => { appStateListener = fn; return { remove() {} }; } } };
    if (name === 'expo-audio') return { AudioModule: { requestRecordingPermissionsAsync: async () => { permissions++; return { granted }; } }, RecordingPresets: { HIGH_QUALITY: {} }, useAudioRecorder: () => recorder, useAudioPlayer: () => player, useAudioPlayerStatus: () => ({ playing }), setAudioModeAsync: async mode => modes.push(mode) };
    if (name === 'expo-file-system') return { File, Paths: { document: { uri: 'file:///documents' } } };
    if (name.includes('async-storage')) return { getItem: async key => storage.get(key) ?? null, setItem: async (key, uri) => storage.set(key, uri) };
    if (name.includes('lucide')) return { Mic: 'Mic', Play: 'Play', Square: 'Square' };
    if (name.endsWith('/RTLText')) return { Text: 'Text' };
    if (name.endsWith('/TactileButton')) return { TactileButton: 'Button' };
    if (name.endsWith('/useAppearance')) return { useAppearance: () => ({ colors: {} }) };
    throw new Error(name);
  });
  const props = { storyId: 'story-1', profileId: 'child-1', narrationPlaying: false, onBegin: () => began++, onRecordingChange: value => changes.push(value) };
  const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props.children)];
  const render = () => {
    cursor = refCursor = effectCursor = 0;
    const tree = mod.exports.StoryVoiceRecorder(props);
    for (const effect of effects) if (effect.pending) { effect.cleanup?.(); effect.cleanup = effect.fn(); effect.pending = false; }
    return tree;
  };
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const button = (tree, label) => walk(tree).find(node => node.props.accessibilityLabel === label);
  let tree = render();
  button(tree, 'تۆمارکردنی خوێندنەوە').props.onPress(); await tick(); tree = render();
  assert.equal(recording, false); assert.equal(began, 0); assert.ok(walk(tree).some(node => node.props.accessibilityRole === 'alert'));
  granted = true;
  const start = button(tree, 'تۆمارکردنی خوێندنەوە'); start.props.onPress(); start.props.onPress(); await tick(); tree = render();
  assert.equal(permissions, 2, 'rapid taps request permission once'); assert.equal(starts, 1); assert.equal(recording, true); assert.equal(changes.at(-1), true);
  button(tree, 'وەستاندن و هەڵگرتنی خوێندنەوە').props.onPress(); await tick(); tree = render();
  assert.equal(stops, 1); assert.equal(recording, false); assert.equal(storage.size, 1); assert.equal(changes.at(-1), false);
  assert.ok([...storage.keys()][0].includes('child-1_story-1')); assert.ok([...storage.values()][0].startsWith('file:///documents/'));
  button(tree, 'گوێگرتن لە خوێندنەوەی خۆمان').props.onPress(); await tick(); tree = render(); assert.equal(playing, true);
  props.narrationPlaying = true; tree = render(); assert.equal(playing, false, 'narration pauses family playback');
  props.narrationPlaying = false; tree = render();
  button(tree, 'تۆمارکردنی خوێندنەوە').props.onPress(); await tick(); tree = render();
  appStateListener('background'); await tick(); tree = render(); assert.equal(recording, false, 'backgrounding saves and stops the microphone'); assert.equal(files.size, 1, 'a replacement removes only the previous owned recording');
  button(tree, 'تۆمارکردنی خوێندنەوە').props.onPress(); await tick(); render();
  props.paused = true; tree = render(); await tick(); tree = render();
  assert.equal(recording, false, 'a learning break stops and saves the microphone');
  assert.equal(playing, false, 'a learning break pauses family playback');
  props.paused = false; tree = render();
  button(tree, 'تۆمارکردنی خوێندنەوە').props.onPress(); await tick(); render();
  effects.forEach(effect => effect.cleanup?.()); await tick();
  assert.equal(recording, false); assert.equal(modes.at(-1).allowsRecording, false);
});
