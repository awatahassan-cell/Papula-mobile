const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(module.exports,module,name=>name.endsWith('.webp')?1:name.startsWith('.')?load(path.resolve(path.dirname(file),name.endsWith('.json')?name:name+'.ts')):require(name));cache.set(file,module.exports);return module.exports;}
const engine=load(path.join(__dirname,'../src/services/learningEngine.ts'));
const profile=(dailyLog)=>({ageGroup:'7-8',masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[],dailyLog});

// gains add up within a day and start a new entry on the next day
let log=engine.logDay(undefined,'2026-10-14',{seconds:120,lessons:1,stars:3});
log=engine.logDay(log,'2026-10-14',{seconds:60,lessons:0,stars:1});
assert.deepEqual(log['2026-10-14'],{seconds:180,lessons:1,stars:4});
log=engine.logDay(log,'2026-10-15',{seconds:30,lessons:0,stars:0});
assert.equal(Object.keys(log).length,2);

// four weeks are kept, older days are forgotten
let long={};for(let d=1;d<=30;d++)long=engine.logDay(long,'2026-09-'+String(d).padStart(2,'0'),{seconds:60,lessons:0,stars:0});
long=engine.logDay(long,'2026-10-02',{seconds:60,lessons:0,stars:0});
assert.ok(!long['2026-09-01']&&long['2026-09-30']&&long['2026-10-02'],'only the last 28 days remain');

// the weekly summary covers seven days ending today, oldest first
const now=new Date(2026,9,16,10,0,0);
const week=engine.weeklySummary(profile({'2026-10-16':{seconds:600,lessons:2,stars:5},'2026-10-12':{seconds:120,lessons:0,stars:1},'2026-09-01':{seconds:9999,lessons:9,stars:9}}),now);
assert.equal(week.days.length,7);assert.equal(week.days[6].key,'2026-10-16');assert.equal(week.days[0].key,'2026-10-10');
assert.equal(week.minutes,12);assert.equal(week.lessons,2);assert.equal(week.stars,6);assert.equal(week.activeDays,2);
assert.equal(engine.weeklySummary(profile(undefined),now).activeDays,0,'a child with no log has an empty week');
console.log('ok');
