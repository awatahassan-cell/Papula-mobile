const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const mod = {exports:{}};
  cache.set(file, mod.exports);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','module','require',code)(mod.exports,mod,p=>p.endsWith('.webp')?path.resolve(path.dirname(file),p):load(path.resolve(path.dirname(file),p+'.ts')));
  return mod.exports;
}
const {mockLetters} = load(path.join(__dirname,'../src/data/mockLetters.ts'));
const {letterStories,getLetterStory} = load(path.join(__dirname,'../src/data/letterStories.ts'));
assert.equal(letterStories.length,34);
assert.equal(new Set(letterStories.map(story=>story.id)).size,34);
assert.deepEqual(letterStories.map(story=>story.targetLetterId),mockLetters.map(letter=>letter.id),'keep the original teaching order');
const normalize = text => text.replace(/ھ/g,'ه');
for (const letter of mockLetters) {
  const story = letterStories.find(item=>item.targetLetterId===letter.id);
  assert.ok(story && !story.isPremium);
  assert.equal(story.pages.length,4);
  assert.ok(story.pages.slice(0,3).every(page=>page.textKu.trim() && page.textKu.split(/\s+/).length<=11),'short sentences');
  const text = normalize(story.pages.slice(0,3).map(page=>page.textKu).join(' '));
  assert.ok(text.split(normalize(letter.glyph)).length-1>=4,`${letter.glyph}: repeated in real story words`);
  assert.equal(story.pages[3].textKu,`${letter.glyph}… ${letter.glyph}…`);
  assert.ok(story.pages.every(page=>page.audioDurationMs===0 && page.wordTimings.length===0),'no invented playback timings');
  assert.equal(story.quiz.options.length,3);
  assert.equal(story.quiz.options.filter(answer=>answer.isCorrect).length,1);
}
assert.equal(getLetterStory('dal').titleKu,'دارا و دار');
assert.equal(getLetterStory('missing'),undefined);
assert.ok(new Set(letterStories.map(story=>story.quiz.options.findIndex(answer=>answer.isCorrect))).size>1,'correct answers vary in position');
console.log('PASS: all 34 letters have short stories, repeated target letters, original order and valid comprehension questions.');

const {alfubeNweStories,alfubeNweLessons}=load(path.join(__dirname,'../src/data/alfubeNweStories.ts'));
const {getLetterStories}=load(path.join(__dirname,'../src/data/letterStories.ts'));
assert.equal(alfubeNweStories.length,66);
assert.equal(new Set(alfubeNweStories.map(s=>s.id)).size,66);
assert.equal(alfubeNweLessons.reduce((n,l)=>n+l.images.length,0),67);
for(const story of alfubeNweStories){
 assert.ok(story.pages[0].textKu.trim());
 assert.ok(!story.pages[0].textKu.includes('پیتی تایبەت لە خوارەوە دیاری نەکراوە'));
 assert.ok(!story.pages[0].textKu.includes('تێبینی:'));
 assert.equal(story.quiz,undefined,'source lessons have no invented comprehension quizzes');
 assert.equal(story.authorKu,'ئیبراهیم ئەمین باڵدار');
 for(const image of [story.coverImage,...(story.pages[0].additionalImages||[])])assert.ok(fs.existsSync(image),image);
}
for(const letter of mockLetters){
 const stories=getLetterStories(letter.id);
 assert.ok(stories.length>0);
 assert.ok(stories.every(s=>s.targetLetterIds.includes(letter.id)&&s.targetLetterId===letter.id));
}
assert.deepEqual(getLetterStories('dal').map(s=>s.id),['alfube-nwe-5']);
assert.deepEqual(getLetterStories('alif').map(s=>s.id),['alfube-nwe-5','alfube-nwe-43','alfube-nwe-46']);
assert.deepEqual(getLetterStories('noon').map(s=>s.id),['alfube-nwe-18','alfube-nwe-19']);
assert.deepEqual(getLetterStories('ya_kurt').map(s=>s.id),['alfube-nwe-6','alfube-nwe-16']);
assert.equal(getLetterStory('dal').pages[0].textKu,'دارا، دارا\nدار، دار');
assert.equal(alfubeNweStories.at(-1).pages[0].additionalImages.length,1);
assert.equal(alfubeNweStories.filter(s=>!s.targetLetterId).length,10);
console.log('PASS: all 66 supplied lessons, 67 local illustrations, every letter mapping, compound forms, author credits and final two-image lesson.');
