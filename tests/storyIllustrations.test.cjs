const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { createLoader } = require('../scripts/story-narration-catalog.cjs');

const load = createLoader();
const { mockStories } = load(path.resolve(__dirname, '../src/data/mockStories.ts'));

test('every library story page has its own bundled scene and an illustrated cover', () => {
  const scenes = [];
  for (const story of mockStories) {
    assert.ok(story.pages.some(page => page.illustrationImage === story.coverImage), `${story.id}: cover uses its own artwork`);
    for (const page of story.pages) {
      const file = page.illustrationImage;
      assert.ok(file && fs.existsSync(file), `${story.id}: ${page.illustrationTheme}`);
      const bytes = fs.readFileSync(file);
      assert.equal(bytes.readUInt16BE(0), 0xffd8, `${file}: valid JPEG signature`);
      assert.ok(bytes.length > 10000, `${file}: artwork contains image data`);
      assert.ok(page.illustrationAspectRatio > 2 && page.illustrationAspectRatio < 2.5, `${file}: landscape layout`);
      scenes.push(file);
    }
  }
  assert.equal(scenes.length, 35);
  assert.equal(new Set(scenes).size, scenes.length, 'pages must not repeat a cover in place of their own scene');
});

test('all letter lesson pictures have a bundled painted image', () => {
  const { mockLetters } = load(path.resolve(__dirname, '../src/data/mockLetters.ts'));
  const { rasterFor } = load(path.resolve(__dirname, '../src/art/rasterPictures.ts'));
  for (const letter of mockLetters) for (const word of letter.exampleWords) {
    const file = rasterFor(word.imageEmoji);
    assert.ok(file && fs.existsSync(file), `${word.word}: missing painted picture`);
  }
});
