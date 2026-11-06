// Rebuilds the alphabet explorer on the website from the app's own letters: each letter shows its own example word and picture.
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./story-narration-catalog.cjs');
const root = path.resolve(__dirname, '..');
const load = createLoader();
const letters = load(path.join(root, 'src/data/mockLetters.ts')).mockLetters;
const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/pictures/index.json'), 'utf8'));
const byEmoji = {};
for (const file of fs.readdirSync(path.join(root, 'assets/pictures'))) { const e = index[file.slice(0, 3)]; if (e) byEmoji[e.replace(/️/g, '')] = file; }
const norm = g => g.replace(/[ـ️]/g, '').replace(/ھ/g, 'ه');
const ORDER = ['ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د', 'ر', 'ڕ', 'ز', 'ژ', 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ', 'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'و', 'ۆ', 'وو', 'ھ', 'ە', 'ی', 'ێ'];
const out = [], dir = path.join(root, 'docs/assets/letters');
fs.mkdirSync(dir, { recursive: true });
for (const glyph of ORDER) {
  const letter = letters.find(l => norm(l.glyph) === norm(glyph));
  const word = letter?.exampleWords.find(w => byEmoji[w.imageEmoji.replace(/️/g, '')]);
  if (!word) { console.warn('no word for', glyph); continue; }
  const file = byEmoji[word.imageEmoji.replace(/️/g, '')];
  fs.copyFileSync(path.join(root, 'assets/pictures', file), path.join(dir, file));
  out.push(`  ${JSON.stringify(glyph === 'ئ' ? 'ئـ' : glyph)}: { word: ${JSON.stringify(word.word)}, en: ${JSON.stringify(word.meaningEn || '')}, img: ${JSON.stringify('assets/letters/' + file)} }`);
}
const file = path.join(root, 'docs/script.js');
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('const ALPHABET_DATA = {'), end = src.indexOf('};', start) + 2;
fs.writeFileSync(file, src.slice(0, start) + `const ALPHABET_DATA = {\n${out.join(',\n')}\n};` + src.slice(end));
console.log(out.length, 'letters');
