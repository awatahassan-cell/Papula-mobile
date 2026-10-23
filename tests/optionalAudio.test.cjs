const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'..'),cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module,p=>p.startsWith('.')?load(path.resolve(path.dirname(file),p.endsWith('.json')?p:p+'.ts')):require(p));return module.exports;}
const {catalog,keyFor}=require('../scripts/offline-audio-catalog.cjs');
const {plan}=require('../scripts/generate-offline-audio.cjs');
const {SYLLABLE_TEXTS,TIP_TEXTS}=load(root+'/src/data/narratedExtras.ts');
const {SYLLABLE_WORDS}=load(root+'/src/data/syllableWords.ts');
const {RUBRIC_SENTENCES,rubricNarration}=load(root+'/src/services/writingRubric.ts');
const f=load(root+'/src/services/foundationalLearning.ts');
const {KURDISH_STROKE_GUIDES}=load(root+'/src/data/kurdishLetterGuides.ts');
const {resamplePolyline}=load(root+'/src/services/pathSimilarity.ts');
const digest=t=>crypto.createHash('sha256').update(t).digest('hex');

const all=catalog(),base=all.filter(e=>!e.optional),keys=new Set(all.map(e=>e.key));
// every syllable and every sentence the app can speak is in the narration catalog
for(const text of SYLLABLE_TEXTS)assert.ok(keys.has(keyFor(text)),'syllable missing from catalog: '+text);
for(const text of TIP_TEXTS)assert.ok(keys.has(keyFor(text)),'tip missing from catalog: '+text);
for(const item of SYLLABLE_WORDS)for(const s of item.syllables)assert.ok(SYLLABLE_TEXTS.includes(s));
assert.ok(SYLLABLE_TEXTS.length>=50&&TIP_TEXTS.length===Object.keys(RUBRIC_SENTENCES).length);
// the rubric only ever emits recorded-able sentences
const allowed=new Set(Object.values(RUBRIC_SENTENCES)),seen=new Set();
for(const [id,guide] of Object.entries(KURDISH_STROKE_GUIDES)){
  const perfect=guide.strokes.map(s=>resamplePolyline(s,1));
  const variants=[perfect,[],perfect.slice(0,1),perfect.map(s=>s.map(p=>({x:50+(p.x-50)*0.3,y:50+(p.y-50)*0.3}))),perfect.map(s=>s.map(p=>({x:50+(p.x-50)*2,y:50+(p.y-50)*2}))),[...perfect].reverse(),perfect.map(s=>[...s].reverse()),[...perfect,...perfect]];
  for(const strokes of variants)for(const mode of ['trace','copy']){
    const r=f.assessWriting(guide,strokes,mode);if(!r.rubric)continue;
    for(const stars of [1,2,3])for(const sentence of rubricNarration(r.rubric,stars)){assert.ok(allowed.has(sentence),id+': unrecorded sentence: '+sentence);seen.add(sentence);}
  }
}
assert.ok(seen.size>=8,'most sentences should be reachable in the checks, got '+seen.size);
// optional entries never reshuffle existing recordings: every earlier batch is unchanged
const ids=p=>p.batches.map(b=>digest(b.map(i=>i.key).join('\n')));
const before=ids(plan(base)),after=ids(plan(all));
assert.ok(before.every(id=>after.includes(id)),'adding optional narration changed an existing batch (would re-buy audio)');
assert.ok(all.filter(e=>e.optional).every(e=>['syllable','tip','vocabulary','guide'].includes(e.category)));
assert.ok(after.length>before.length);
// syllables are requested alone so they are read as a bare sound
for(const b of plan(all).batches)if(b.some(e=>e.category==='syllable'))assert.equal(b.length,1);
console.log(`PASS: optional narration — ${all.filter(e=>e.optional).length} new recordings, ${seen.size} tip sentences reachable`);
