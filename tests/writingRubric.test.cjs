const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'..','src'),cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module,p=>p.startsWith('.')?load(path.resolve(path.dirname(file),p.endsWith('.json')?p:p+'.ts')):require(p));return module.exports;}
const f=load(root+'/services/foundationalLearning.ts');
const {KURDISH_STROKE_GUIDES}=load(root+'/data/kurdishLetterGuides.ts');
const {resamplePolyline}=load(root+'/services/pathSimilarity.ts');
// A real dot/mark is a whole component (all its strokes fit a 10x10 box), not a tiny fragment of the body.
function markFlags(guide){const ids=guide.componentIds||guide.strokes.map((_,i)=>i);const flags=new Map();for(const id of new Set(ids)){const pts=guide.strokes.filter((_,i)=>ids[i]===id).flat();const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);flags.set(id,Math.max(...xs)-Math.min(...xs)<10&&Math.max(...ys)-Math.min(...ys)<10);}return ids.map(id=>flags.get(id));}
const crit=(r,id)=>r.rubric.criteria.find(c=>c.id===id);
const isMark=s=>{const xs=s.map(p=>p.x),ys=s.map(p=>p.y);return Math.max(...xs)-Math.min(...xs)<10&&Math.max(...ys)-Math.min(...ys)<10;};
let checks=0,withMarks=0;
for(const [id,guide] of Object.entries(KURDISH_STROKE_GUIDES)){
  const perfect=guide.strokes.map(s=>resamplePolyline(s,1));
  for(const mode of ['trace','copy','independent']){
    const r=f.assessWriting(guide,perfect,mode);
    assert.equal(r.mastered,true,`${id} ${mode}: perfect writing`);
    assert.equal(r.stars,3);assert.ok(r.rubric.overall>=90,`${id} ${mode} overall ${r.rubric.overall}`);
    assert.equal(r.rubric.criteria.length,6);assert.deepEqual(r.rubric.tipsKu,[],`${id} ${mode}: no tips for perfect writing`);checks+=4;
  }
  // slightly shaky but honest writing keeps passing
  const shaky=perfect.map((s,k)=>s.map((p,i)=>({x:p.x+Math.sin(i*1.7+k)*0.6,y:p.y+Math.cos(i*1.3+k)*0.6})));
  assert.equal(f.assessWriting(guide,shaky,'copy').mastered,true,`${id}: mild unsteadiness must not fail`);checks++;

  // heavy tremor lowers steadiness and is reported
  const tremor=perfect.map((s,k)=>s.map((p,i)=>({x:p.x+(i%2?2.6:-2.6),y:p.y+(i%3?2.2:-2.2)})));
  const tr=f.assessWriting(guide,tremor,'copy');
  if(tr.rubric)assert.ok(crit(tr,'steadiness').score<crit(f.assessWriting(guide,perfect,'copy'),'steadiness').score||tr.mastered===false,`${id}: tremor ignored`);checks++;

  // too small / too big
  const small=perfect.map(s=>s.map(p=>({x:50+(p.x-50)*0.35,y:50+(p.y-50)*0.35})));
  const rs=f.assessWriting(guide,small,'independent');
  assert.equal(rs.mastered,false,`${id}: tiny writing passed`);assert.ok(crit(rs,'size').score<60,`${id}: size`);assert.ok(rs.rubric.tipsKu.some(t=>t.includes('بچووک')),`${id}: tiny tip`);checks+=3;

  const flags=markFlags(guide);
  const marks=flags.filter(Boolean).length;
  if(marks>0&&flags.some(f=>!f)){
    withMarks++;
    const body=perfect.filter((s,i)=>!flags[i]);
    const noMarks=f.assessWriting(guide,body,'copy');
    assert.equal(noMarks.mastered,false,`${id}: missing dots passed`);
    assert.ok(crit(noMarks,'parts').score<80,id+' parts '+crit(noMarks,'parts').score+' '+JSON.stringify(noMarks.rubric.missingComponentIds));assert.ok(noMarks.rubric.missingComponentIds.length>=1);
    assert.ok(noMarks.rubric.tipsKu.join(' ').includes('خاڵ'),`${id}: tip must mention the dot`);checks+=4;

    const moved=perfect.map((s,i)=>flags[i]?s.map(p=>({x:p.x,y:Math.max(4,p.y-30)})):s);
    const rm=f.assessWriting(guide,moved,'trace');
    assert.equal(rm.mastered,false,`${id}: dots written in the wrong place passed`);
    assert.ok(crit(rm,'parts').score<80);checks+=2;

    const doubled=[...perfect,...perfect.filter((s,i)=>flags[i]).map(s=>s.map(p=>({x:p.x+3,y:p.y+3})))];
    const rd=f.assessWriting(guide,doubled,'copy');
    assert.equal(rd.mastered,false,`${id}: extra dot passed`);assert.ok(rd.rubric.tipsKu.join(' ').includes('زیادە'),`${id}: extra dot tip`);checks+=2;

    // dots first is flagged but still counted as the right shape
    const dotsFirst=[...perfect.filter((s,i)=>flags[i]),...body];
    const rf=f.assessWriting(guide,dotsFirst,'copy');
    assert.ok(crit(rf,'flow').score<100,`${id}: order not flagged`);assert.ok(rf.rubric.tipsKu.some(t=>t.includes('سەرەتا')),`${id}: order tip`);checks+=2;
  }
}
assert.ok(withMarks>=10,'letters with dots must be exercised');

// direction: a long right-to-left letter written left-to-right is flagged but a correct one is not.
const ba=KURDISH_STROKE_GUIDES.ba;
const forward=ba.strokes.map(s=>resamplePolyline(s,1));
const reversed=forward.map(s=>isMark(s)?s:[...s].reverse());
const rr=f.assessWriting(ba,reversed,'trace');
assert.ok(crit(rr,'flow').score<=60);assert.ok(rr.rubric.tipsKu.some(t=>t.includes('ڕاست')),'direction tip');assert.equal(crit(f.assessWriting(ba,forward,'trace'),'flow').score,100);

// shape: a different letter's strokes cannot pass
const dal=KURDISH_STROKE_GUIDES.dal;
const wrong=f.assessWriting(ba,dal.strokes.map(s=>resamplePolyline(s,1)),'copy');
assert.equal(wrong.mastered,false);assert.equal(wrong.stars,1);
assert.deepEqual(f.assessWriting(ba,[],'copy').rubric,undefined);
console.log(`PASS: rubric — ${checks} checks on ${Object.keys(KURDISH_STROKE_GUIDES).length} letters (${withMarks} with dots)`);
