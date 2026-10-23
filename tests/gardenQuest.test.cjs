const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const {gardenProgress,gardenChallenge,finishGardenStep,plantGardenFlower,GARDEN_STEPS}=load(path.resolve(__dirname,'../src/services/gardenQuest.ts'));
const {mockLetters}=load(path.resolve(__dirname,'../src/data/mockLetters.ts'));
const {getKurdishStrokeGuide}=load(path.resolve(__dirname,'../src/data/kurdishLetterGuides.ts'));
const profile=()=>({id:'child-a',stars:12,masteredLetterIds:mockLetters.slice(0,mockLetters.findIndex(letter=>letter.id==='ba')).map(letter=>letter.id),lessonProgress:{dal:{completedAt:'yesterday'}},writingProgress:{dal:{tracePassed:true}}});
test('garden adventure resumes sequentially, prevents skipped/repeated rewards and leaves alphabet gates intact',()=>{
  let child=profile();const original=structuredClone(child);
  assert.deepEqual(gardenProgress(child),{steps:[],flowerSpot:undefined});
  assert.equal(finishGardenStep(child,'write'),child);
  assert.equal(plantGardenFlower(child,1),child);
  for(const step of GARDEN_STEPS){child=finishGardenStep(child,step);assert.equal(finishGardenStep(child,step),child);}
  const restored=JSON.parse(JSON.stringify(child));assert.equal(gardenProgress(restored).steps.length,5);
  for(const bad of [-1,3,1.5,NaN])assert.equal(plantGardenFlower(child,bad),child);
  child=plantGardenFlower(child,0);assert.equal(gardenProgress(child).flowerSpot,0,'leftmost flower survives zero-valued index');
  assert.equal(plantGardenFlower(child,2),child,'rapid extra taps cannot grant another flower');
  assert.equal(child.stars,original.stars+2);
  assert.deepEqual(child.masteredLetterIds,original.masteredLetterIds);
  assert.deepEqual(child.writingProgress,original.writingProgress);
  assert.deepEqual(child.lessonProgress.dal,original.lessonProgress.dal);
  assert.ok(child.lessonProgress.ba.completedAt);
  assert.equal(gardenProgress(profile()).steps.length,0,'a second child has a separate garden');
});
test('malformed or out-of-order saved steps never unlock the flower',()=>{
  assert.equal(gardenProgress({...profile(),gardenQuest:{steps:['write'],flowerSpot:2}}).flowerSpot,undefined);
  assert.deepEqual(gardenProgress({...profile(),gardenQuest:{steps:['listen','build','write']}}).steps,['listen']);
});
test('all 34 adventures have distinct choices, solvable repeated-letter tiles and a real writing guide',()=>{
  const positions=new Set();
  for(const letter of mockLetters){
    const c=gardenChallenge(letter.id);
    assert.equal(c.letter.id,letter.id);
    assert.equal(c.letters.length,3);assert.equal(new Set(c.letters.map(item=>item.glyph)).size,3);
    assert.equal(c.pictures.length,3);assert.equal(new Set(c.pictures.map(item=>item.word)).size,3);
    assert.ok(c.pictures.every(item=>item.imageEmoji));
    assert.equal(c.pictures.filter(item=>item.word===c.target.word).length,1);
    assert.equal(c.tiles.slice().reverse().map(tile=>tile.glyph).join(''),c.word);
    assert.equal(new Set(c.tiles.map(tile=>tile.id)).size,c.tiles.length);
    assert.ok(c.word.length>0&&getKurdishStrokeGuide(letter.id));
    positions.add(c.letters.findIndex(item=>item.id===letter.id));
  }
  assert.equal(positions.size,3,'the right answer is not always in the same place');
});
test('gardens persist separately for every letter, including the existing ba pilot',()=>{
  let child={...profile(),gardenQuest:{steps:[...GARDEN_STEPS],flowerSpot:2}};
  assert.equal(gardenProgress(child,'ba').flowerSpot,2);
  assert.equal(gardenProgress(child,'dal').steps.length,5);
  for(const letter of mockLetters){
    for(const step of GARDEN_STEPS)child=finishGardenStep(child,step,letter.id);
    child=plantGardenFlower(child,0,letter.id);
  }
  const restored=JSON.parse(JSON.stringify(child));
  assert.ok(mockLetters.every(letter=>gardenProgress(restored,letter.id).flowerSpot!==undefined));
  assert.equal(gardenProgress(restored,'ba').flowerSpot,2);
  assert.equal(finishGardenStep(child,'listen','unknown'),child);
});
test('the garden and alphabet share one completion and unlock the next letter only after the story',()=>{
  const {isLessonUnlocked,isLessonComplete,nextLessonLetter}=load(path.resolve(__dirname,'../src/services/lessonPath.ts'));
  let child={id:'new-child',stars:0,masteredLetterIds:[]};
  const first=mockLetters[0].id,second=mockLetters[1].id;
  assert.equal(finishGardenStep(child,'listen',second),child,'locked letters cannot record adventure steps');
  for(const step of ['listen','find','build','write'])child=finishGardenStep(child,step,first);
  assert.equal(isLessonComplete(child,first),false);
  assert.equal(isLessonUnlocked(child,second),false);
  assert.equal(plantGardenFlower(child,0,first),child,'writing alone does not grant a flower');
  child=finishGardenStep(child,'story',first);
  assert.equal(isLessonComplete(child,first),true);
  assert.equal(nextLessonLetter(child).id,second);
  assert.equal(child.stars,2);
  assert.equal(finishGardenStep(child,'story',first),child,'returning or tapping twice never duplicates lesson rewards');
  child=plantGardenFlower(child,0,first);assert.equal(gardenProgress(child,first).flowerSpot,0);
});
test('completed legacy lessons remain complete without replay, and partial lesson work carries into the journey',()=>{
  const old=profile();
  assert.equal(gardenProgress(old,'dal').steps.length,5);
  assert.equal(finishGardenStep(old,'story','dal'),old);
  const first=mockLetters[0].id;
  const partial={...old,masteredLetterIds:[],lessonProgress:{[first]:{listened:true,formsPassed:true,seenExampleIds:['a','b','c'],recognizedExampleIds:['a','b','c']}},writingProgress:{}};
  assert.deepEqual(gardenProgress(partial,first).steps,['listen','find','build']);
});
