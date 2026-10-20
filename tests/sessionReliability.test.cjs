const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const root = path.resolve(__dirname, '../src/services');
const { bedtimeActive, addScreenTime, dailyLimitSeconds, validClock } = load(path.join(root, 'sessionPolicy.ts'));
const { PersistentWriter } = load(path.join(root, 'persistentWriter.ts'));
const { normalizeCheckpoint } = load(path.join(root, 'learningContinuation.ts'));
const { personalPractice, parentAdvice } = load(path.join(root, 'personalPractice.ts'));
const { mockLetters } = load(path.resolve(root, '../data/mockLetters.ts'));

test('bedtime schedules handle overnight, daytime, exact boundaries and disabled/equal windows', () => {
  const settings = { bedtimeLockEnabled: true, bedtimeStart: '20:00', bedtimeEnd: '07:00' };
  const at = time => new Date('2026-10-20T' + time + ':00');
  for (const time of ['20:00','23:59','00:00','06:59']) assert.equal(bedtimeActive(settings,at(time)),true,time);
  for (const time of ['07:00','12:00','19:59']) assert.equal(bedtimeActive(settings,at(time)),false,time);
  assert.equal(bedtimeActive({...settings,bedtimeLockEnabled:false},at('23:00')),false);
  assert.equal(bedtimeActive({...settings,bedtimeStart:'13:00',bedtimeEnd:'15:00'},at('14:00')),true);
  assert.equal(bedtimeActive({...settings,bedtimeStart:'13:00',bedtimeEnd:'15:00'},at('20:00')),false);
  assert.equal(bedtimeActive({...settings,bedtimeStart:'07:00',bedtimeEnd:'07:00'},at('14:00')),false);
  assert.equal(validClock('25:00'),false); assert.equal(validClock('7:00'),false);
  assert.equal(dailyLimitSeconds({dailyLimitMinutes:NaN}),1800);
});
test('screen time splits at local midnight and respects each day budget without mutating saved history', () => {
  const before = {'2026-10-20':58};
  const result = addScreenTime(before,new Date('2026-10-20T23:59:55').getTime(),new Date('2026-10-21T00:00:05').getTime(),60);
  assert.equal(result['2026-10-20'],60); assert.equal(result['2026-10-21'],5); assert.equal(before['2026-10-20'],58);
  assert.deepEqual(addScreenTime(before,10,5,60),before);
});
test('a storage failure retains the newest progress for retry, and old queued snapshots cannot overwrite it', async () => {
  let failing = true; const stored = new Map();
  const writer = new PersistentWriter({setItem:async(key,value)=>{if(failing)throw Error('disk full');stored.set(key,value);}});
  await writer.write('child','first'); assert.equal(writer.status().failed,true);
  const a=writer.write('child','second'),b=writer.write('child','latest'); await Promise.all([a,b]);
  failing=false; await writer.retry(); assert.equal(stored.get('child'),'latest'); assert.deepEqual(writer.status(),{saving:false,failed:false,pending:0});
  failing=true; await writer.write('other-child','private'); failing=false; await writer.write('settings','night');
  assert.equal(writer.status().failed,true,'an unrelated successful write cannot hide unsaved child data');
  await writer.retry(); assert.equal(stored.get('other-child'),'private');
});
test('continuation validates saved lesson/page state and rejects unknown destinations', () => {
  assert.equal(normalizeCheckpoint({kind:'parent-dashboard',contentId:'x'}),undefined);
  assert.equal(normalizeCheckpoint(null),undefined);
  assert.deepEqual(normalizeCheckpoint({kind:'lesson',contentId:'dal',step:99,wordIndex:-4,round:2.9,listenCount:NaN}),{kind:'lesson',contentId:'dal',step:4,wordIndex:0,round:2,listenCount:0});
  assert.equal(normalizeCheckpoint({kind:'story',contentId:'book',pageIndex:3,readMode:'i_read'}).pageIndex,3);
  assert.equal(normalizeCheckpoint({kind:'writing',contentId:'dal',writingMode:'independent'}).writingMode,'independent');
});
test('personal practice is child-specific, excludes locked/unseen letters and gives actionable parent advice', () => {
  const first=mockLetters[0], second=mockLetters[1], locked=mockLetters.at(-1);
  const profile={id:'one',name:'test',ageGroup:'5-6',masteredLetterIds:[first.id],inProgressLetterIds:[],lessonProgress:{[first.id]:{listened:true,formsPassed:true,seenExampleIds:[],recognizedExampleIds:[],completedAt:'2026-10-20T10:00:00Z'}},writingProgress:{[first.id]:{tracePassed:true,copyPassed:false,independentPassDates:[]}},letterReviews:{[locked.id]:{level:0,attempts:9,errors:9,dueAt:'2020-01-01'}},skillProgress:{writing:{attempts:4,correct:1,helped:3,independentCorrect:0}}};
  const now=new Date('2026-10-20T20:00:00Z'), plan=personalPractice(profile,now);
  assert.equal(plan.length,1); assert.equal(plan[0].letter.id,first.id); assert.equal(plan[0].kind,'writing');
  const advice=parentAdvice(profile,now); assert.ok(advice.focus.includes('نووسین')); assert.ok(advice.homeActivity.includes(first.glyph)); assert.equal(advice.learned[0].id,first.id);
  assert.equal(personalPractice({...profile,id:'two',masteredLetterIds:[],lessonProgress:{},letterReviews:{},writingProgress:{}}).length,0);
  assert.ok(!plan.some(item=>item.letter.id===second.id),'an unseen currently unlocked letter is not a review task');
});
