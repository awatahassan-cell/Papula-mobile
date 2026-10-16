const test = require('node:test');
const assert = require('node:assert/strict');
const { narrationCatalog } = require('../scripts/story-narration-catalog.cjs');
const { stories, storyNarration, getStoryNarration, AUDIO_TAGS } = narrationCatalog();
const withoutTags = text => text.replace(/\[[a-z ]+\] /g, '');

test('every app story and practice page has a reviewed performance direction', () => {
  assert.equal(stories.length, 117);
  assert.equal(Object.keys(storyNarration).length, stories.length);
  for (const story of stories) {
    const plan = storyNarration[story.id];
    assert.ok(plan, story.id);
    assert.ok(plan.noteKu.trim(), story.id);
    assert.equal(plan.pages.length, story.pages.length, story.id);
    for (const page of story.pages) {
      const direction = plan.pages[page.pageNumber - 1];
      assert.ok(Array.isArray(direction.tags), story.id);
      for (const cue of direction.cues || []) {
        assert.ok(page.textKu.includes(cue.before), `${story.id}: missing cue ${cue.before}`);
      }
      const narrated = getStoryNarration(story.id, page.pageNumber, page.textKu);
      assert.equal(withoutTags(narrated), page.textKu, `${story.id}: preserve every source word, space and line break`);
      assert.doesNotMatch(narrated, /\[(?:gasping|slowly|softly)\]/, story.id);
      for (const match of narrated.matchAll(/\[([^\]]+)\]/g)) assert.ok(AUDIO_TAGS.includes(match[1]), match[1]);
      assert.ok(narrated.length <= 2000, `${story.id}: keep each narration request within the recommended length`);
      assert.ok(!/\[(?:witch voice|drunken voice|menacing)\]/.test(narrated), story.id);
    }
  }
});

test('specific emotional turns follow the plot and speaker changes', () => {
  const narrate = id => {
    const story = stories.find(s => s.id === id);
    return getStoryNarration(id, 1, story.pages[0].textKu);
  };
  assert.match(narrate('alfube-nwe-15'), /\n\[pause\] \[sighing\] ـ ئۆی،/s);
  assert.match(narrate('alfube-nwe-38'), /\[pause\] ـ هەی، هەی،/);
  assert.match(narrate('alfube-nwe-38'), /\[pause\] ـ باشە نایهاوێژم،/);
  assert.match(narrate('alfube-nwe-41'), /^\[knocking on door\]/);
  assert.match(narrate('alfube-nwe-67'), /\[excited\] بەخێر هاتی،/);
  assert.match(narrate('alfube-nwe-69'), /\[voice breaking\] هەر بیرت دەکەین/);
  const night = stories.find(s => s.id === 'personal-night');
  assert.match(getStoryNarration(night.id, 3, night.pages[2].textKu), /^\[sleepy drowsy voice\]/);
  assert.equal(getStoryNarration('unknown-future-story', 1, 'دەقی پاک'), 'دەقی پاک');
});

test('every sentence and poem line is separately playable without removed tags', () => {
  const { createLoader } = require('../scripts/story-narration-catalog.cjs');
  const { learningStoryChunks } = createLoader()(require('node:path').join(__dirname, '../src/services/storyPlayback.ts'));
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  for (const story of stories) for (const page of story.pages) {
    const chunks = learningStoryChunks(story.id, page.pageNumber, page.textKu);
    assert.ok(chunks.length, story.id);
    assert.equal(normalize(chunks.map(chunk => chunk.text).join(' ')), normalize(page.textKu), story.id);
    for (const chunk of chunks) {
      assert.doesNotMatch(chunk.narrationText, /\[(?:gasping|slowly|softly)\]/, story.id);
      assert.ok(!/\[[a-z ]+\]/.test(chunk.text), 'fallback text has no directions');
    }
  }
  const lesson = stories.find(story => story.id === 'alfube-nwe-24');
  assert.equal(learningStoryChunks(lesson.id, 1, lesson.pages[0].textKu).length, 5, 'rain poem has five separate verse lines');
});
