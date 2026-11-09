// Builds app-voice-review.html: everything the app reads aloud (letters, words, sentences, stories),
// as a page where each line can be approved or edited, and the edits copied back.
const fs = require('node:fs');
const path = require('node:path');
const { catalog } = require('./offline-audio-catalog.cjs');
const { createLoader, narrationCatalog } = require('./story-narration-catalog.cjs');
const root = path.resolve(__dirname, '..');
const load = createLoader();
const data = file => load(path.join(root, 'src', file));
const { mockLetters } = data('data/mockLetters.ts');
const { learningStoryChunks } = data('services/storyPlayback.ts');
const { getKurdishStrokeGuide } = data('data/kurdishLetterGuides.ts');

const entries = catalog();
const recordedKeys = new Set();
for (const line of fs.readFileSync(path.join(root, 'src/data/offlineAudio.ts'), 'utf8').split('\n')) {
  const m = line.match(/^\s*("(?:[^"\\]|\\.)*"):\s*\{/);
  if (m) { try { recordedKeys.add(JSON.parse(m[1])); } catch { /* not a track line */ } }
}
const byText = new Map(entries.map(e => [e.text, e]));
const rec = text => { const e = byText.get(text); return e ? recordedKeys.has(e.key) : false; };

const tabs = [];
const tab = (id, title, icon, groups) => tabs.push({ id, title, icon, groups: groups.filter(g => g.items.length) });
const item = (text, extra = {}) => ({ text, rec: rec(text), ...extra });

// 1. Letters: the name and its picture words.
tab('letters', 'پیتەکان', '🔤', mockLetters.map(letter => {
  const guide = getKurdishStrokeGuide(letter.glyph);
  return {
    title: `پیتی ${letter.name}`, big: letter.glyph,
    items: [
      { text: `پیتی ${letter.name}`, rec: rec(letter.name), tag: 'ناوی پیت' },
      ...letter.exampleWords.map(w => item(w.word, { tag: 'وشەی نموونە', pic: w.imageEmoji })),
      ...(guide ? [item(guide.instructionKu, { tag: 'ڕێنمایی نووسین' })] : []),
    ],
  };
}));

// 2. Sentences and instructions, by kind.
const sentenceKinds = [
  ['guide', 'ڕێنمایی شاشەکان'], ['freeplay', 'ڕێنمایی یاریی ئازاد'], ['adventure', 'یاری و گەشتی پیت'],
  ['tip', 'ئافەرین و ڕێنمایی نووسین'], ['writing', 'نووسین'], ['lesson', 'وانە'], ['preview', 'بەخێربێن'],
];
tab('sentences', 'ڕستە و ڕێنمایی', '💬', [
  ...sentenceKinds.map(([cat, title]) => ({ title, items: entries.filter(e => e.category === cat).map(e => ({ text: e.text, rec: recordedKeys.has(e.key) })) })),
  { title: 'ڕێنمایی کورت (بەشەکانی ئەپ)', items: entries.filter(e => e.category === 'prompt' && /\s/.test(e.text.trim())).map(e => ({ text: e.text, rec: recordedKeys.has(e.key) })) },
]);

// 3. Words: picture words, syllables, stickers.
tab('words', 'وشە و بڕگە', '🖼', [
  { title: 'وشەی وێنەدار (یاری وشە)', items: entries.filter(e => e.category === 'vocabulary').map(e => ({ text: e.text, rec: recordedKeys.has(e.key) })) },
  { title: 'ناوی ستیکەرەکان', items: entries.filter(e => e.category === 'sticker').map(e => ({ text: e.text, rec: recordedKeys.has(e.key) })) },
  { title: 'بڕگەکان (یاری بڕگە)', items: entries.filter(e => e.category === 'syllable').map(e => ({ text: e.text, rec: recordedKeys.has(e.key) })) },
]);

// 4. Stories, page by page.
const stories = narrationCatalog().stories;
const storyGroups = [];
for (const story of stories) {
  const seen = new Set(), list = [];
  for (const page of story.pages) for (const chunk of learningStoryChunks(story.id, page.pageNumber, page.textKu)) {
    if (seen.has(chunk.text)) continue; seen.add(chunk.text);
    list.push({ text: chunk.text, rec: rec(chunk.text), tag: `لاپەڕە ${page.pageNumber}` });
  }
  storyGroups.push({ title: story.titleKu || story.title || story.id, items: list });
}
tab('stories', 'چیرۆکەکان', '📖', storyGroups);

const total = tabs.reduce((n, t) => n + t.groups.reduce((m, g) => m + g.items.length, 0), 0);
const html = fs.readFileSync(path.join(__dirname, 'voice-review-template.html'), 'utf8').replace('__DATA__', JSON.stringify(tabs).replace(/<\//g, '<\\/'));
fs.writeFileSync(path.join(root, 'app-voice-review.html'), html);
const live = fs.readFileSync(path.join(__dirname, 'voice-review-artifact-template.html'), 'utf8').replace('__DATA__', JSON.stringify(tabs).replace(/<\//g, '<\\/'));
fs.writeFileSync(path.join(root, 'app-voice-review-live.html'), live);
console.log(total, 'lines;', tabs.map(t => `${t.id}:${t.groups.length}`).join(' '));
