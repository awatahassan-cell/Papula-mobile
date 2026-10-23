const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createLoader, narrationCatalog } = require('./story-narration-catalog.cjs');
const root = path.resolve(__dirname, '..');
const DEFAULT_VOICE = 'tkI70vi7ETrk5NakcLUP';
const MODEL = 'eleven_v4';
const keyFor = (text, voice = DEFAULT_VOICE) => JSON.stringify([1, text.normalize('NFC').trim(), voice, MODEL]);

function catalog() {
  const load = createLoader();
  const data = file => load(path.join(root, 'src', file));
  const { mockLetters } = data('data/mockLetters.ts');
  const { LEARNING_WORDS } = data('services/learningEngine.ts');
  const { learningStoryChunks } = data('services/storyPlayback.ts');
  const { getKurdishStrokeGuide } = data('data/kurdishLetterGuides.ts');
  const entries = new Map();
  function add(text, narrationText = text, category = 'prompt', literal = false, voiceId = DEFAULT_VOICE) {
    if (!text?.trim()) return;
    const key = keyFor(narrationText + (literal ? '[literal-letter-v1]' : ''), voiceId);
    const previous = entries.get(key);
    if (previous && previous.text !== text) throw Error('Conflicting reading text: ' + key);
    entries.set(key, { key, text, narrationText, voiceId, model: MODEL, category });
  }
  const addWord = (text, category = 'word') => {
    const letter = mockLetters.find(item => text.trim() === item.glyph || text.trim() === `پیتی ${item.name}`);
    if (letter) { add('پیتی', 'پیتی.', 'letter'); add(letter.name, letter.name, 'letter', true); }
    else add(text, text, category, mockLetters.some(item => item.name === text));
  };
  for (const letter of mockLetters) {
    addWord(`پیتی ${letter.name}`);
    for (const word of letter.exampleWords) {
      addWord(word.word);
    }
    const guide = getKurdishStrokeGuide(letter.glyph);
    if (guide) addWord(guide.instructionKu, 'writing');
  }
  for (const word of LEARNING_WORDS) for (const unit of word.units) addWord(unit);
  for (const sticker of data('data/mockStickers.ts').mockStickers) addWord(sticker.nameKu, 'sticker');
  for (const story of narrationCatalog().stories) for (const page of story.pages) {
    for (const chunk of learningStoryChunks(story.id, page.pageNumber, page.textKu)) add(chunk.text, chunk.narrationText, 'story');
    // Tapping any displayed word must also work offline.
    for (const word of page.textKu.split(/\s+/u)) addWord(word.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ''));
  }
  // Extract static spoken prompts and writing feedback from their actual source.
  const files = ['features/alphabet/GuidedLetterLesson.tsx', 'services/tracingScorer.ts',
    'services/foundationalLearning.ts', 'features/writing/WritingScreen.tsx', 'services/sectionIntroductions.ts', 'services/exerciseHelp.ts'];
  for (const file of files) {
    const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, 'src', file), 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isStringLiteralLike(node) && /[\u0600-\u06ff]/u.test(node.text)) {
        // These small files contain the spoken step titles, guide fallbacks and feedback.
        addWord(node.text, 'prompt');
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  const maxComponents = Math.max(...Object.values(data('data/kurdishLetterGuides.ts').KURDISH_STROKE_GUIDES).map(guide => new Set(guide.componentIds || []).size));
  for (let dots = 1; dots <= maxComponents; dots++) addWord(`بەشە سەرەکییەکەت نووسیوە؛ ${dots} خاڵ یان نیشانەی بچووک ماوە. نموونەکە سەیر بکە و تەواوی بکە ✍️`, 'writing');
  addWord('ئافەرم! تەواو فێری نووسینی پیتی', 'writing');
  addWord('بوویت.', 'writing');
  addWord('وشەی', 'lesson');
  addWord('بدۆزەوە.', 'lesson');
  for (const text of ['ئێستا با چیرۆکێک ببیستین. لە وشەکاندا پیتەکە بدۆزەوە.', 'با دەنگی خۆت تۆمار بکەیت، پاشان گوێی لێ بگرە.', 'ئافەرم! ئەم مەشقەت بە باشی تەواو کرد.']) addWord(text);
  const welcome = 'سڵاو هاوڕێی شیرینم، بەخێربێیت بۆ پەپوولە.';
  add(welcome, welcome, 'preview');
  // Optional narration is appended last and flagged, so existing recordings and batches are never reshuffled.
  const { SYLLABLE_TEXTS, TIP_TEXTS, VOCAB_TEXTS, GUIDE_TEXTS } = data('data/narratedExtras.ts');
  const required = new Set(entries.keys());
  const addExtra = (text, category) => {
    const key = keyFor(text);
    if (!required.has(key)) { add(text, text, category); entries.get(key).optional = true; } // already narrated: keep that recording
  };
  for (const text of SYLLABLE_TEXTS) addExtra(text, 'syllable');
  for (const text of TIP_TEXTS) addExtra(text, 'tip');
  for (const text of VOCAB_TEXTS) addExtra(text, 'vocabulary');
  for (const text of GUIDE_TEXTS) addExtra(text, 'guide');
  return [...entries.values()];
}

module.exports = { catalog, keyFor, DEFAULT_VOICE, MODEL };
if (require.main === module) {
  const entries = catalog();
  console.log(JSON.stringify({ tracks: entries.length, characters: entries.reduce((sum, item) => sum + item.narrationText.length, 0), categories: entries.reduce((out, item) => (out[item.category] = (out[item.category] || 0) + 1, out), {}) }, null, 2));
}
