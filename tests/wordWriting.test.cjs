const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'..','src'),cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module,p=>p.startsWith('.')?load(path.resolve(path.dirname(file),p.endsWith('.json')?p:p+'.ts')):require(p));return module.exports;}
const w=load(root+'/services/wordWriting.ts');
const {mockLetters}=load(root+'/data/mockLetters.ts');
const {WRITING_SENTENCES}=load(root+'/data/writingSentences.ts');
const {resamplePolyline}=load(root+'/services/pathSimilarity.ts');
const base={ageGroup:'7-8',masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[]};
const all={...base,masteredLetterIds:mockLetters.map(l=>l.id)};

assert.equal(w.wordWritingTasks(base).length,0,'no word is offered before its letters are known');
assert.equal(w.sentenceWritingTasks(base).length,0);
const tasks=w.wordWritingTasks(all,10);
assert.equal(tasks.length,10);
for(const t of tasks){assert.ok(t.slots.length>=2&&t.slots.length<=5);assert.ok(t.slots.every(s=>s.guide.strokes.length>0));}
assert.ok(tasks[0].slots.length<=tasks[tasks.length-1].slots.length,'easier (shorter) words first');
// a word becomes available as soon as its own letters are known
const dar=w.wordWritingTasks({...base,masteredLetterIds:['dal','alif','ra']},10).map(t=>t.title);
assert.ok(dar.includes('دار'),'دار needs only د ا ر');
assert.ok(!dar.includes('هەنار'));
// tracing a letter also counts
assert.equal(w.knowsLetterForWriting({...base,writingProgress:{ba:{tracePassed:true,copyPassed:false,independentPassDates:[]}}},'ba'),true);
// learned words go last
const learned=w.wordWritingTasks({...all,learnedWordIds:[tasks[0].id]},100);
assert.equal(learned[learned.length-1].id,tasks[0].id);

const sentences=w.sentenceWritingTasks(all);
assert.equal(sentences.length,WRITING_SENTENCES.length,'every sentence must be writable with the bundled guides');
for(const s of sentences){assert.equal(s.words.length,2);assert.ok(new Set(s.slots.map(x=>x.wordIndex)).size===2);}

// full session: wrong letter is rejected and retried, correct letters advance, summary reflects retries
const task=w.wordWritingTasks(all,1)[0];
let session=w.startSession(task);
const draw=slot=>slot.guide.strokes.map(s=>resamplePolyline(s,1));
const wrongGuide=task.slots[0].letter.id==='dal'?'ba':'dal';
const wrongStrokes=load(root+'/data/kurdishLetterGuides.ts').getKurdishStrokeGuide(wrongGuide).strokes.map(s=>resamplePolyline(s,1));
let step=w.submitSlot(session,wrongStrokes,false);
assert.equal(step.passed,false);assert.equal(step.session.index,0);assert.equal(step.session.attempts,1);
session=step.session;
while(!w.sessionDone(session)){
  step=w.submitSlot(session,draw(session.task.slots[session.index]),false);
  assert.equal(step.passed,true,'perfect letter '+session.index);session=step.session;
}
const sum=w.sessionSummary(session);
assert.equal(sum.total,task.slots.length);assert.deepEqual(sum.retried.map(l=>l.id),[task.slots[0].letter.id]);assert.equal(sum.unaided,task.slots.length-1);
console.log('PASS: word & sentence writing');
