const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const {mockLetters}=load(path.join(__dirname,'../src/data/mockLetters.ts'));
const {lessonPath,isLessonUnlocked,isLessonComplete,nextLessonLetter,applyLessonStep,reconcileLessons,lessonChecklist}=load(path.join(__dirname,'../src/services/lessonPath.ts'));
const {learningLayout}=load(path.join(__dirname,'../src/theme/layout.ts'));
const fresh=()=>({id:'child',stars:0,masteredLetterIds:[],writingProgress:{}});
function practice(profile,letter){
  profile=applyLessonStep(profile,letter.id,'listening');
  profile=applyLessonStep(profile,letter.id,'forms');
  for(const word of letter.exampleWords){profile=applyLessonStep(profile,letter.id,'example',word.id);profile=applyLessonStep(profile,letter.id,'recognition',word.id);}
  return profile;
}
test('only the first new letter opens; learning requirements unlock the next immediately',()=>{
  let profile=fresh();const [first,second,third]=mockLetters;
  assert.equal(nextLessonLetter(profile).id,first.id);
  assert.deepEqual(lessonPath(profile).map(n=>n.status).slice(0,3),['current','locked','locked']);
  assert.equal(applyLessonStep(profile,second.id,'listening'),profile,'locked lessons cannot record steps');
  profile=practice(profile,first);assert.equal(isLessonComplete(profile,first.id),false,'recognition alone is not enough');
  assert.equal(isLessonUnlocked(profile,second.id),false);
  profile.writingProgress[first.id]={tracePassed:true,copyPassed:false,independentPassDates:[]};
  profile=reconcileLessons(profile);
  assert.ok(isLessonComplete(profile,first.id));assert.ok(isLessonUnlocked(profile,second.id));assert.equal(isLessonUnlocked(profile,third.id),false);
  assert.equal(profile.masteredLetterIds.length,0,'lesson completion is distinct from long-term handwriting mastery');
  assert.equal(profile.stars,2);assert.equal(reconcileLessons(profile).stars,2,'completion reward is once only');
  assert.ok(lessonChecklist(profile,first.id).every(item=>item.done));
  profile=practice(profile,second);profile.writingProgress[second.id]={tracePassed:true,copyPassed:false,independentPassDates:[]};profile=reconcileLessons(profile);
  assert.ok(isLessonUnlocked(profile,third.id),'two lessons can finish on the same day');
  assert.equal(profile.stars,4);
  assert.equal(nextLessonLetter(JSON.parse(JSON.stringify(profile))).id,third.id,'restart retains the frontier');
});
test('duplicate practice, skipped examples and separate children cannot bypass the path',()=>{
  let profile=fresh();const letter=mockLetters[0];
  profile.writingProgress[letter.id]={tracePassed:true,copyPassed:false,independentPassDates:[]};
  for(let i=0;i<5;i++){profile=applyLessonStep(profile,letter.id,'recognition',letter.exampleWords[0].id);profile=applyLessonStep(profile,letter.id,'example',letter.exampleWords[0].id);}
  assert.equal(profile.lessonProgress[letter.id].recognizedExampleIds.length,1);assert.ok(!isLessonComplete(profile,letter.id));
  profile=practice(profile,letter);assert.ok(isLessonComplete(profile,letter.id));
  assert.equal(isLessonUnlocked(fresh(),mockLetters[1].id),false,'another child has an independent path');
  assert.equal(applyLessonStep(profile,'invalid','forms'),profile);
});
test('existing mastery survives migration without opening unfinished gaps',()=>{
  const profile={...fresh(),masteredLetterIds:['dal','ba']};
  assert.ok(isLessonUnlocked(profile,'ba'),'old earned lessons stay available');
  assert.equal(nextLessonLetter(profile).id,'ra');
  assert.equal(isLessonUnlocked(profile,'alif'),false,'an old future completion does not bypass an earlier gap');
  const done={...fresh(),masteredLetterIds:mockLetters.map(l=>l.id)};
  assert.equal(nextLessonLetter(done),undefined);assert.ok(lessonPath(done).every(n=>n.status==='completed'));
});
test('path nodes, mascot and cards fit phone, tablet and landscape widths',()=>{
  for(const width of [240,280,320,360,375,390,430,600,768,834,1024,1280]){
    const layout=learningLayout(width);
    assert.ok(layout.width<=width);assert.ok(layout.nodeSize+2*layout.pathOffset<=layout.contentWidth,`path at ${width}`);
    assert.ok(layout.mascotSize<layout.contentWidth*0.4);assert.ok(layout.contentWidth>0);
  }
  assert.equal(learningLayout(320).columns,2);assert.equal(learningLayout(768).columns,3);
});
test('a resumed lesson returns to its first unfinished step and repeated steps are idempotent',()=>{
  const {lessonResumeStep}=load(path.join(__dirname,'../src/services/lessonPath.ts'));
  const letter=mockLetters[0];let profile=fresh();
  assert.equal(lessonResumeStep(profile,letter.id),0);
  profile=applyLessonStep(profile,letter.id,'listening');assert.equal(lessonResumeStep(profile,letter.id),1);
  assert.equal(applyLessonStep(profile,letter.id,'listening'),profile);
  profile=applyLessonStep(profile,letter.id,'forms');assert.equal(lessonResumeStep(profile,letter.id),2);
  for(const word of letter.exampleWords)profile=applyLessonStep(profile,letter.id,'example',word.id);
  assert.equal(lessonResumeStep(JSON.parse(JSON.stringify(profile)),letter.id),3);
  for(const word of letter.exampleWords)profile=applyLessonStep(profile,letter.id,'recognition',word.id);
  assert.equal(lessonResumeStep(profile,letter.id),4);
  assert.equal(applyLessonStep(profile,letter.id,'recognition',letter.exampleWords[0].id),profile);
});
