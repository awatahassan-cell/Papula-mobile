const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const {journeyPracticePlan}=load(path.resolve(__dirname,'../src/services/journeyPractice.ts'));
const {mockLetters}=load(path.resolve(__dirname,'../src/data/mockLetters.ts'));
const {wordUnits}=load(path.resolve(__dirname,'../src/services/learningEngine.ts'));
const profile={id:'one',masteredLetterIds:[],ageGroup:'5-6'};
test('all 34 letters have three solvable short games; missing words preserve compound letters and joining',()=>{
 for(const letter of mockLetters){
  const plan=journeyPracticePlan(profile,letter.id);
  assert.deepEqual(plan.map(r=>r.kind),['sound','missing','similar']);
  for(const round of plan){assert.equal(round.letter.id,letter.id);assert.equal(new Set(round.options).size,3);assert.ok(round.options.includes(round.answer));}
  const missing=plan[1];assert.equal(missing.masked.replace('▢',missing.answer),missing.word);
  assert.equal(wordUnits(missing.masked).filter(x=>x==='▢').length,1);
 }
 assert.equal(journeyPracticePlan({...profile,ageGroup:'3-4'},'dal').length,2);
});
test('free games use only completed letters, including legacy lessons, and never mutate progress',()=>{
 const child={...profile,lessonProgress:{dal:{completedAt:'yesterday'},ba:{completedAt:'today'}}};
 const before=JSON.stringify(child);
 assert.ok(journeyPracticePlan(child,'ra',true).every(r=>['dal','ba'].includes(r.letter.id)));
 assert.equal(JSON.stringify(child),before);
 assert.deepEqual(journeyPracticePlan(profile,'dal',true),[]);
});
