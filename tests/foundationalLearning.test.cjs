const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file));const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module,p=>load(path.resolve(path.dirname(file),p.endsWith('.json')?p:p+'.ts')));return module.exports;}
const f=load(path.join(__dirname,'../src/services/foundationalLearning.ts'));
const {mockLetters}=load(path.join(__dirname,'../src/data/mockLetters.ts'));
const {getKurdishStrokeGuide}=load(path.join(__dirname,'../src/data/kurdishLetterGuides.ts'));
const first=new Date('2026-10-14T10:00:00'),second=new Date('2026-10-15T10:00:00');
let progress=f.advanceWriting(undefined,'independent',true,false,first);assert.equal(progress.independentPassDates.length,0,'cannot skip prerequisite stages');
progress=f.advanceWriting(progress,'trace',true,true,first);assert.equal(f.suggestedWritingMode(progress),'copy');
progress=f.advanceWriting(progress,'copy',true,false,first);assert.equal(f.suggestedWritingMode(progress),'independent');
progress=f.advanceWriting(progress,'independent',true,true,first);assert.equal(progress.independentPassDates.length,0,'helped free-writing cannot confirm mastery');
progress=f.advanceWriting(progress,'independent',true,false,first);progress=f.advanceWriting(progress,'independent',true,false,first);assert.equal(progress.independentPassDates.length,1);assert.equal(f.writingMastered(progress),false);
progress=f.advanceWriting(progress,'independent',true,false,second);assert.equal(f.writingMastered(progress),true);
let skill=f.skillAttempt(undefined,true,true);skill=f.skillAttempt(skill,true,false);skill=f.skillAttempt(skill,false,false);assert.equal(skill.independentCorrect,1);assert.equal(skill.helped,1);assert.equal(skill.attempts,3);
for(const letter of mockLetters){
 const guide=getKurdishStrokeGuide(letter.id);
 const transformed=guide.strokes.map(stroke=>stroke.map(p=>({x:p.x*0.8+8,y:p.y*0.8+7})));
 assert.equal(f.assessWriting(guide,transformed,'independent').mastered,true,`${letter.glyph}: translated and uniformly scaled free-writing`);
 assert.equal(f.assessWriting(guide,[[{x:30,y:30}]],'independent').mastered,false,`${letter.glyph}: tap is not writing`);
}
const profile={masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[]};
assert.equal(f.readableText('دار هەیە.',profile),false);assert.equal(f.readingPracticeStories(profile).length,0);
const known={...profile,masteredLetterIds:mockLetters.map(l=>l.id)};assert.equal(f.readableText('دار هەیە.',known),true);assert.equal(f.readingPracticeStories(known).length,7);
for(const story of f.readingPracticeStories(known))assert.ok(story.pages.every(page=>f.readableText(page.textKu,known)));
assert.ok(f.startingSoundWords(profile).length===5);
console.log('PASS: 3 writing stages, distinct-day independent mastery, help tracking, all 34 free-writing shapes, tap rejection and texts matched to known letters.');
