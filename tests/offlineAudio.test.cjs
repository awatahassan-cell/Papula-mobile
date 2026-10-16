const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const { catalog, DEFAULT_VOICE, keyFor } = require('../scripts/offline-audio-catalog.cjs');
const { locateWords } = require('../scripts/generate-offline-audio.cjs');
const root = path.resolve(__dirname, '..');

function loadPack() {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'src/data/offlineAudio.ts'), 'utf8');
  new Function('exports', 'module', 'require', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module.exports, module, asset => path.resolve(root, 'src/data', asset));
  return module.exports.OFFLINE_AUDIO;
}

test('the fresh Papula pack covers every catalog entry, all story words and valid audio boundaries', () => {
  const pack = loadPack();
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/audio/papula-v2/manifest.json'), 'utf8'));
  assert.ok(manifest.completedAt, 'generation must finish before the app is delivered');
  assert.equal(manifest.voiceId, DEFAULT_VOICE);
  // Optional narration (syllables, handwriting tips) lights up once the pack has been regenerated.
  for (const entry of catalog()) if (!entry.optional) assert.ok(pack[entry.key], `Missing: ${entry.text}`);
  const { narrationCatalog } = require('../scripts/story-narration-catalog.cjs');
  for (const story of narrationCatalog().stories) for (const page of story.pages) for (const raw of page.textKu.split(/\s+/u)) {
    if (!/[\p{L}\p{N}]/u.test(raw)) continue;
    assert.ok(pack[keyFor(raw)] || catalog().some(entry => entry.category === 'letter' && entry.text === raw), `Missing tapped word: ${raw}`);
  }
  const checked = new Set();
  for (const [key, track] of Object.entries(pack)) {
    assert.equal(JSON.parse(key)[2], DEFAULT_VOICE, 'no other voice is bundled');
    assert.ok(track.start >= 0 && track.end > track.start, key);
    assert.ok(track.timings.length > 0, key);
    for (const word of track.timings) assert.ok(word.from >= track.start && word.to <= track.end && word.to >= word.from, key);
    if (checked.has(track.source)) continue;
    checked.add(track.source);
    const bytes = fs.readFileSync(track.source);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(path.basename(track.source), hash + '.mp3');
    assert.ok(bytes.length > 100);
    assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 255 && (bytes[1] & 224) === 224);
  }
  const service = fs.readFileSync(path.join(root, 'src/services/soundService.ts'), 'utf8');
  assert.ok(!service.includes('process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY'), 'the installed app must not embed generation credentials');
  assert.ok(!service.includes("from '../data/bundledAudio'"), 'old recordings must not enter the new app bundle');
});

test('alignment maps Unicode characters, punctuation and emoji to the original reading offsets', () => {
  const text = '🌱 دار، گوڵ! ✍️';
  const characters = Array.from(text);
  const alignment = { characters, character_start_times_seconds: characters.map((_, i) => i), character_end_times_seconds: characters.map((_, i) => i + 1) };
  const result = locateWords(text, alignment);
  assert.equal(result.timings.length, 2);
  assert.equal(result.timings[0].from, characters.indexOf('د'));
  assert.equal(text.slice(result.timings[0].start, result.timings[0].end), 'دار،');
});

function runtime() {
  const players = [], browserAudio = [], timers = new Map(); let timerId = 0;
  const fakeTrack = { source: 123, start: 4, end: 6, timings: [{ start: 0, end: 3, from: 4, to: 5 }, { start: 4, end: 7, from: 5, to: 6 }] };
  const platform = { OS: 'ios' };
  const mocks = {
    '../data/offlineAudio': { OFFLINE_AUDIO: { [keyFor('دار گوڵ')]: fakeTrack } },
    '../data/mockLetters': { mockLetters: [] },
    './audioCache': { audioCacheKey: keyFor },
    './storyPlayback': {},
    'react-native': { Platform: platform },
    'expo-file-system': {},
    'expo-speech': { stop() {}, speak() { throw Error('Device speech must not be invoked'); } },
    'expo-audio': { createAudioPlayer: () => {
      const player = { isLoaded: false, currentTime: 0, plays: 0, pauses: 0, seeks: [], play() { this.plays++; }, pause() { this.pauses++; }, release() {}, setPlaybackRate() {},
        seekTo: async seconds => { player.seeks.push(seconds); player.currentTime = seconds; },
        addListener: (_, listener) => { player.listener = listener; } };
      players.push(player); return player;
    } },
  };
  const fakeWindow = { Audio: class {
    constructor() { browserAudio.push(this); this.currentTime = 0; this.pauses = 0; }
    play() { return Promise.resolve(); }
    pause() { this.pauses++; }
  } };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, 'src/services/soundService.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'module', 'require', 'fetch', 'window', 'setTimeout', 'clearTimeout', code)(module.exports, module, name => mocks[name], () => { throw Error('Network must not be invoked'); }, fakeWindow,
    (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, id => timers.delete(id));
  return { service: module.exports.soundService, players, browserAudio, timers, platform };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('native offline playback seeks after load, highlights words, waits through buffering and cancels stale audio', async () => {
  const { service, players, timers } = runtime();
  let ended = 0, errors = 0; const words = [];
  await service.speakWord('دار گوڵ', { onWord: (...range) => words.push(range), onEnd: () => ended++, onError: () => errors++ });
  const first = players[0]; assert.equal(first.plays, 0);
  first.listener({ isLoaded: true, currentTime: 0 }); await tick();
  assert.deepEqual(first.seeks, [4]); assert.equal(first.plays, 1);
  first.currentTime = 4.3;
  first.listener({ currentTime: 4.3, playing: true });
  assert.deepEqual(words.at(-1), [0, 3]);
  const [boundaryId, boundary] = timers.entries().next().value; timers.delete(boundaryId); boundary.fn();
  assert.equal(ended, 0, 'elapsed wall time cannot complete stalled audio');
  first.listener({ currentTime: 4.3, isBuffering: true });
  assert.equal(timers.size, 0, 'buffering clears the boundary timer');
  first.currentTime = 6;
  first.listener({ currentTime: 6, playing: true }); first.listener({ didJustFinish: true });
  assert.equal(ended, 1); assert.equal(errors, 0);
  await service.speakWord('دار گوڵ'); const second = players.at(-1);
  await service.stopSpeaking(); second.listener({ isLoaded: true }); await tick();
  assert.equal(second.plays, 0); assert.deepEqual(second.seeks, []);
  let missing = 0;
  await service.speakWord('دەقی نەناسراو', { onError: () => missing++ });
  assert.equal(missing, 1, 'missing assets do not call the internet or device speech');
});

test('browser offline playback uses the same segment and ignores events after cancellation', async () => {
  const { service, platform, browserAudio, timers } = runtime(); platform.OS = 'web';
  let ended = 0; const words = [];
  await service.speakWord('دار گوڵ', { onEnd: () => ended++, onWord: (...range) => words.push(range) });
  const audio = browserAudio.at(-1);
  assert.equal(audio.currentTime, 4); assert.equal(audio.playbackRate, .85); assert.equal(audio.preservesPitch, true);
  audio.currentTime = 5.2; audio.ontimeupdate(); assert.deepEqual(words.at(-1), [4, 7]);
  audio.currentTime = 6; audio.ontimeupdate(); audio.onended(); assert.equal(ended, 1);
  await service.speakWord('دار گوڵ', { onEnd: () => ended++ });
  const stale = browserAudio.at(-1); await service.stopSpeaking(); stale.onended();
  assert.equal(ended, 1);
  await service.speakWord('دار گوڵ');
  const current = browserAudio.at(-1); current.onplaying();
  const timerIds = [...timers.keys()];
  stale.onplaying(); stale.onwaiting();
  assert.deepEqual([...timers.keys()], timerIds, 'late events cannot clear the next audio boundary');
  await service.stopSpeaking();
});
