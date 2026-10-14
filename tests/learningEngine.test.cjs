const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module,p=>load(path.resolve(path.dirname(file),p+'.ts')));return module.exports;}
const engine=load(path.join(__dirname,'../src/services/learningEngine.ts'));
const {mockLetters}=load(path.join(__dirname,'../src/data/mockLetters.ts'));
const profile={ageGroup:'5-6',masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[]};
assert.deepEqual(engine.wordUnits('دوور'),['د','وو','ر']);
assert.deepEqual(engine.wordUnits('نان'),['ن','ا','ن']);
assert.equal(mockLetters.length,34);
assert.equal(engine.reviewPlan(profile,34).map(l=>l.glyph).join('،'),'د،ر،ا،و،ە،وو،ز،ب،ئ،ڕ،م،ن،ێ،ت،ی،س،ش،پ،ل،ڵ،ک،گ،ۆ،ج،چ،خ،ح،ژ،ف،ڤ،ق،غ،ع،ھ');
let review=engine.updateReview(undefined,true,new Date('2026-10-14T10:00:00'));
assert.equal(review.level,1);const due=review.dueAt;
review=engine.updateReview(review,true,new Date('2026-10-14T11:00:00'));
assert.equal(review.level,1);assert.equal(review.dueAt,due,'same-day success must not postpone review');
review=engine.updateReview(review,true,new Date('2026-10-15T10:00:00'));assert.equal(review.level,2);
review=engine.updateReview(review,false,new Date('2026-10-15T11:00:00'));assert.equal(review.level,0);
assert.equal(engine.reviewPlan({...profile,letterReviews:{ghayn:review}},3,new Date('2026-10-15T12:00:00'))[0].id,'ghayn','recent mistake has priority');
assert.equal(engine.reviewPlan(profile)[0].id,'dal','other child remains unaffected');
for(const ageGroup of ['3-4','5-6','7-8']) assert.ok(engine.wordPlan({...profile,ageGroup},100).every(w=>w.units.length<=({'3-4':3,'5-6':5,'7-8':8})[ageGroup]));
assert.ok(engine.LEARNING_WORDS.length>30);
assert.equal(engine.personalStories(profile).length,0);
for(const template of engine.PERSONAL_STORY_TEMPLATES){
 const words=engine.templateWords(template.id);assert.equal(words.length,3,`required words exist for ${template.id}`);
 const almost={...profile,learnedWordIds:words.slice(0,2).map(w=>w.id)};assert.ok(!engine.personalStories(almost).some(s=>s.id===template.id));
 const ready=engine.personalStories({...profile,learnedWordIds:words.map(w=>w.id)}).find(s=>s.id===template.id);
 assert.ok(ready);assert.equal(ready.pages.length,3);assert.equal(ready.quiz.options.filter(o=>o.isCorrect).length,1);
 assert.ok(ready.pages.every(p=>p.textKu.length>0));
}
assert.deepEqual(engine.shuffled([1,2,3],()=>0).sort(),[1,2,3]);
console.log(`PASS: ${engine.LEARNING_WORDS.length} words, 34-letter order, compound/repeated letters, age bounds, personal spaced review and all 3 story unlocks.`);
