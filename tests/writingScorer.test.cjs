const fs=require('fs'), path=require('path'), assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.join(__dirname,'..','src');
const cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',output)(module.exports,module,p=>load(path.resolve(path.dirname(file),p.endsWith('.json')?p:p+'.ts')));return module.exports;}
const {mockLetters}=load(root+'/data/mockLetters.ts');
const {getKurdishStrokeGuide,KURDISH_STROKE_GUIDES}=load(root+'/data/kurdishLetterGuides.ts');
assert.deepEqual(Object.keys(KURDISH_STROKE_GUIDES),mockLetters.map(letter=>letter.id),'Font guides must preserve the original teaching order');
const {evaluateTracing,runTracingScorerTests}=load(root+'/services/tracingScorer.ts');
const {resamplePolyline}=load(root+'/services/pathSimilarity.ts');
let checks=0;
const report=[];
for(const letter of mockLetters){
 const guide=getKurdishStrokeGuide(letter.id)||letter.strokeGuide;
 assert.equal(guide.glyph,letter.glyph,'Guide must display the selected letter');checks++;
 assert.ok(guide.outlinePath.startsWith('M'),'Every letter must use the bundled-font outline');checks++;
 const perfect=guide.strokes.map(s=>resamplePolyline(s,1));
 const result=evaluateTracing(guide,perfect);
 assert.ok(result.mastered,`${letter.glyph} perfect failed ${JSON.stringify(result)}`);checks++;
 const noisy=perfect.map(s=>s.map((p,i)=>({x:p.x+Math.sin(i)*1.5,y:p.y+Math.cos(i)*1.5})));
 assert.ok(evaluateTracing(guide,noisy).mastered,`${letter.glyph} modest motor variation rejected`);checks++;
 assert.equal(evaluateTracing(guide,[]).mastered,false);checks++;
 const dots=perfect.flat().filter((p,i)=>i%5===0).map(p=>[p]);
 assert.equal(evaluateTracing(guide,dots).mastered,false,`${letter.glyph} disconnected taps passed`);checks++;
 const displaced=perfect.map(s=>s.map(p=>({x:p.x+18,y:p.y})));
 assert.equal(evaluateTracing(guide,displaced).mastered,false,`${letter.glyph} off-guide passed`);checks++;
 const repeated=[...perfect,...perfect,...perfect];
 assert.equal(evaluateTracing(guide,repeated).mastered,false,`${letter.glyph} repeated scribbling passed`);checks++;
 if(guide.strokes.length>1){
  for(const missing of new Set(guide.componentIds || guide.strokes.map((_,i)=>i))){
   const partial=perfect.filter((s,i)=>(guide.componentIds?.[i] ?? i)!==missing);
   assert.equal(evaluateTracing(guide,partial).mastered,false,`${letter.glyph} missing stroke ${missing} passed`);checks++;
  }
 }
 report.push({glyph:letter.glyph,score:result.score});
}
for(const test of runTracingScorerTests())assert.ok(test.passed,test.message);
console.log(`PASS: ${checks} quality checks across ${mockLetters.length} letters, plus all existing scorer tests.`);




