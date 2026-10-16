const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

// Load the app's data on Node without native modules or image decoding.
function createLoader() {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (/\.(webp|png|mp3)$/.test(file)) return file;
    if (cache.has(file)) return cache.get(file);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const mod = { exports: {} };
    cache.set(file, mod.exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    new Function('exports', 'module', 'require', code)(mod.exports, mod, name => {
      const target = path.resolve(path.dirname(file), name);
      return load(path.extname(target) ? target : target + '.ts');
    });
    return mod.exports;
  }
  return load;
}

function narrationCatalog() {
  const load = createLoader();
  const data = name => load(path.join(root, 'src', name));
  const { alfubeNweStories } = data('data/alfubeNweStories.ts');
  const { letterStories } = data('data/letterStories.ts');
  const { mockStories } = data('data/mockStories.ts');
  const { mockLetters } = data('data/mockLetters.ts');
  const { LEARNING_WORDS, personalStories } = data('services/learningEngine.ts');
  const { readingPracticeStories } = data('services/foundationalLearning.ts');
  const profile = {
    ageGroup: '7-8', masteredLetterIds: mockLetters.map(letter => letter.id),
    learnedWordIds: LEARNING_WORDS.map(word => word.id),
  };
  const groups = [
    { title: 'ئەلف و بێی نوێ — ئیبراهیم ئەمین باڵدار', stories: alfubeNweStories },
    { title: 'چیرۆکە کورتەکانی ٣٤ پیت', stories: letterStories },
    { title: 'چیرۆکەکانی کتێبخانە', stories: mockStories },
    { title: 'چیرۆک بە وشە فێربووەکان', stories: personalStories(profile) },
    { title: 'مەشقی خوێندنەوە', stories: readingPracticeStories(profile) },
  ];
  return { groups, stories: groups.flatMap(group => group.stories), ...data('data/storyNarration.ts') };
}

function exportReview() {
  const { groups, stories, storyNarration, getStoryNarration } = narrationCatalog();
  const lines = [
    '# چیرۆکەکانی پەپوولە — خوێندنەوە بە هەست', '',
    `ژمارەی دەقەکان: ${stories.length}؛ هەر بەشێکی ناو بلۆکی دەق ئامادەی کۆپیکردنە بۆ ElevenLabs.`, '',
    'دەنگ: tkI70vi7ETrk5NakcLUP — مۆدێل: eleven_v4', '',
    'شێوازی فێرکاری لە ئەپ: خێرایی 0.7×، وەستانی ١.٨ چرکە لەنێوان ڕستەکان و ٣.٢ چرکە پێش پەڕەی دواتر. هەر دێڕێکی هۆنراوەش بە جیا دەخوێندرێتەوە.', '',
    'وشە و ڕیزبەندیی سەرچاوە پارێزراون؛ تەنها تاگی خوێندنەوە زیاد کراوە. لە ئەپدا منداڵ دەقی پاک دەبینێت. هەر پەڕەیەک لە ئەپدا بە جیا دەخوێندرێتەوە.', '',
    'ئەمە سکریپتی ڕێکخراوی خوێندنەوەیە؛ هێشتا هەموو دەقەکان بە دەنگی ڕاستەقینەی ElevenLabs گوێ لێ نەگیراون.', '',
    'ڕێنماییی تاگەکان: https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue', '',
  ];
  const scripts = [];
  for (const group of groups) {
    lines.push(`## ${group.title}`, '');
    for (const [index, story] of group.stories.entries()) {
      lines.push(`### ${index + 1}. ${story.titleKu}`, '', `ناسنامە: ${story.id}`, '',
        `هەست و شێوازی خوێندنەوە: ${storyNarration[story.id]?.noteKu || ''}`, '');
      scripts.push(`${story.titleKu} (${story.id})`);
      for (const page of story.pages) {
        const text = getStoryNarration(story.id, page.pageNumber, page.textKu);
        if (story.pages.length > 1) lines.push(`پەڕەی ${page.pageNumber}`, '');
        lines.push('```text', text, '```', '');
        scripts.push(text, '');
      }
      scripts.push('────────────────────────', '');
    }
  }
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/story-narration-review.md'), lines.join('\n'));
  fs.writeFileSync(path.join(root, 'docs/story-narration-scripts.txt'), scripts.join('\n'));
  console.log(JSON.stringify({ stories: stories.length, pages: stories.reduce((n, s) => n + s.pages.length, 0), groups: groups.map(g => ({ title: g.title, count: g.stories.length })) }));
}

module.exports = { narrationCatalog, createLoader };
if (require.main === module) exportReview();
