const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const {plantedGardenFlowers,GARDEN_STEPS}=load(path.resolve(__dirname,'../src/services/gardenQuest.ts'));
const {mockLetters}=load(path.resolve(__dirname,'../src/data/mockLetters.ts'));
test('shared garden retains every planted flower across all letters and isolates children',()=>{
 for(const count of [0,1,20,34]){
  const profile={masteredLetterIds:[],gardenQuests:Object.fromEntries(mockLetters.slice(0,count).map((l,i)=>[l.id,{steps:[...GARDEN_STEPS],flowerSpot:i%3}]))};
  const restored=JSON.parse(JSON.stringify(profile));
  assert.deepEqual(plantedGardenFlowers(restored).map(l=>l.id),mockLetters.slice(0,count).map(l=>l.id));
 }
 assert.equal(plantedGardenFlowers({masteredLetterIds:[]}).length,0);
 assert.equal(plantedGardenFlowers({masteredLetterIds:[],gardenQuest:{steps:['listen','find','build','write'],flowerSpot:0}}).length,1);
 assert.equal(plantedGardenFlowers({masteredLetterIds:[],gardenQuests:{dal:{steps:['listen'],flowerSpot:0}}}).length,0);
});
