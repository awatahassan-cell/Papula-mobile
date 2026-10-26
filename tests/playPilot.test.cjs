const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const {finishPlayPilotRound,playPilotProgress,PLAY_PILOT_STEPS}=load(path.resolve('src/services/playPilot.ts'));
const {isLessonUnlocked}=load(path.resolve('src/services/lessonPath.ts'));
const {plantGardenFlower,gardenProgress}=load(path.resolve('src/services/gardenQuest.ts'));
const base=()=>({id:'a',stars:4,masteredLetterIds:[],readStoryIds:[],writingProgress:{},gardenQuests:{ba:{steps:['listen']}}});
test('pilot has three ordered rounds, persists per child and completes without inventing writing or reading mastery',()=>{
 let child=base();assert.equal(finishPlayPilotRound(child,'missing'),child);
 assert.equal(isLessonUnlocked(child,'ra'),false);
 for(const step of PLAY_PILOT_STEPS){child=finishPlayPilotRound(child,step);assert.equal(finishPlayPilotRound(child,step),child);child=JSON.parse(JSON.stringify(child));}
 assert.deepEqual(playPilotProgress(child),PLAY_PILOT_STEPS);assert.equal(child.stars,6);assert.equal(isLessonUnlocked(child,'ra'),true);
 assert.deepEqual(child.masteredLetterIds,[]);assert.deepEqual(child.writingProgress,{});assert.deepEqual(child.readStoryIds,[]);
 assert.deepEqual(child.gardenQuests.ba,base().gardenQuests.ba);
 assert.equal(gardenProgress(child,'dal').flowerSpot,undefined);child=plantGardenFlower(child,0,'dal');assert.equal(gardenProgress(child,'dal').flowerSpot,0);assert.equal(plantGardenFlower(child,1,'dal'),child);
 assert.deepEqual(playPilotProgress(base()),[]);
});
test('old lesson completion and malformed pilot state cannot produce repeated rewards',()=>{
 const legacy={...base(),lessonProgress:{dal:{completedAt:'yesterday'}}};let child=legacy;for(const step of PLAY_PILOT_STEPS)child=finishPlayPilotRound(child,step);assert.equal(child.stars,legacy.stars);assert.equal(child.lessonProgress.dal.completedAt,'yesterday');
 assert.deepEqual(playPilotProgress({...base(),playJourneys:{dal:{rounds:['missing','sound']}}}),['sound']);
});
test('all 34 journeys have valid choices, joined masked words, independent saves and one flower each',()=>{
 const letters=load(path.resolve('src/data/mockLetters.ts')).mockLetters;
 const {playJourneyContent}=load(path.resolve('src/features/adventure/playJourneyContent.ts'));
 let child=base();
 for(const letter of letters){
  const content=playJourneyContent(letter.id);
  assert.equal(isLessonUnlocked(child,letter.id),true,letter.id);
  assert.equal(content.masked.split('▢').length,2,letter.id);
  assert.equal(content.masked.replace('▢',letter.glyph).replace(/ھ/g,'ه'),content.target.word.replace(/ھ/g,'ه'),letter.id);
  for(const round of content.rounds){
   assert.equal(round.options.length,3);
   assert.equal(new Set(round.options.map(option=>option.id)).size,3);
   assert.equal(round.options.filter(option=>option.id===round.answer).length,1);
   assert.ok(round.options.every(option=>option.label&&option.glyph));
  }
  for(const step of PLAY_PILOT_STEPS)child=finishPlayPilotRound(JSON.parse(JSON.stringify(child)),step,letter.id);
  assert.deepEqual(playPilotProgress(child,letter.id),PLAY_PILOT_STEPS);
  const earned=child.stars;
  assert.equal(finishPlayPilotRound(child,'missing',letter.id),child);
  child=plantGardenFlower(child,0,letter.id);
  assert.equal(gardenProgress(child,letter.id).flowerSpot,0);
  assert.equal(child.stars,earned);
 }
 assert.equal(Object.keys(child.playJourneys).length,34);
 assert.equal(child.stars,base().stars+68);
 assert.deepEqual(child.writingProgress,{});
 assert.deepEqual(child.readStoryIds,[]);
 const locked=base();assert.equal(finishPlayPilotRound(locked,'sound','ra'),locked);
});
