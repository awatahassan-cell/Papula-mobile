const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module,p=>p.startsWith('.')?load(path.resolve(path.dirname(file),p+'.ts')):require(p));return module.exports;}
const {SYLLABLE_WORDS}=load(path.join(__dirname,'../src/data/syllableWords.ts'));
const syl=load(path.join(__dirname,'../src/services/syllables.ts'));
const engine=load(path.join(__dirname,'../src/services/learningEngine.ts'));
const profile=(over={})=>({ageGroup:'7-8',masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[],...over});

assert.ok(SYLLABLE_WORDS.length>=30);
for(const item of SYLLABLE_WORDS){
  assert.equal(engine.normalizedWord(item.syllables.join('')),engine.normalizedWord(item.word),item.word+' syllables must join to the word');
  assert.ok(item.syllables.length>=2,item.word);
}
assert.equal(syl.syllableWords().length,SYLLABLE_WORDS.length,'every syllable word must exist in the narrated vocabulary');

assert.equal(syl.maxSyllables(profile({ageGroup:'3-4'})),2);
assert.equal(syl.maxSyllables(profile({ageGroup:'5-6'})),3);
assert.equal(syl.maxSyllables(profile()),4);
assert.equal(syl.maxSyllables(profile({placement:{recommendedLevel:1}})),2);

const rounds=syl.syllableRounds(profile({ageGroup:'3-4'}),5);
assert.equal(rounds.length,5);
for(const r of rounds){
  assert.ok(r.syllables.length<=2);
  assert.equal(r.tiles.length,r.syllables.length);
  assert.ok(r.tiles.some((tile,i)=>tile.id!==i),'tiles must not start in the solved order');
  assert.equal(syl.checkSyllableOrder(r,r.syllables.map((_,i)=>i)),true);
  assert.equal(syl.checkSyllableOrder(r,r.tiles.map(t=>t.id)),false);
  assert.equal(syl.checkSyllableOrder(r,[0]),false);
}

const now=new Date('2026-10-14T10:00:00');
const review=(over)=>({attempts:5,correct:2,errors:3,level:1,lastPracticedAt:now.toISOString(),dueAt:new Date(now.getTime()+86400000).toISOString(),...over});
const p=profile({letterReviews:{
  ba:review({level:0}),
  pa:review({dueAt:new Date(now.getTime()-1000).toISOString(),errors:0,correct:5}),
  ta:review(),
}});
assert.deepEqual(engine.dueReviewLetters(p,now).map(l=>l.id).sort(),['ba','pa']);
const hard=engine.hardLetters(p);
assert.deepEqual(hard.map(h=>h.letter.id),['ba','ta']);
assert.equal(hard[0].accuracy,40);
assert.deepEqual(hard[0].confusedWith.map(l=>l.id).sort(),['pa','ta']);
assert.deepEqual(engine.hardLetters(profile()),[]);
console.log('syllables ok');
