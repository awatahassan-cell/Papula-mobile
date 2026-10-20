const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
test('session clock excludes background, parent screens and idle time, and flushes to the owning child', () => {
  let clock = new Date('2026-10-20T12:00:00').getTime(), interval, states=[], refs=[], effects=[], cursor=0, rc=0, ec=0;
  const events={}, saved=[], pauses=[];
  const react={
    useState(initial){const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},
    useRef(initial){return refs[rc++]??={current:initial};},
    useEffect(fn,deps){const i=ec++,old=effects[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))effects[i]={fn,deps,cleanup:old?.cleanup,pending:true};},
  };
  const profile={id:'one',screenTimeLog:{}};
  const store={isHydrated:true,profiles:[profile],currentProfile:profile,route:'home',parentSettings:{dailyLimitMinutes:15,bedtimeLockEnabled:false},setLearningPaused:v=>pauses.push(v),recordScreenTime:(log,id)=>saved.push({log:{...log},id})};
  const policy=require('../scripts/story-narration-catalog.cjs').createLoader()(path.resolve(__dirname,'../src/services/sessionPolicy.ts'));
  const mod={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../src/components/useSessionGuard.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  class ClockDate extends Date {constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
  new Function('exports','require','Date','setInterval','clearInterval',source)(mod.exports,name=>{
    if(name==='react')return react;
    if(name==='react-native')return{AppState:{currentState:'active',addEventListener:(key,fn)=>{events[key]=fn;return{remove(){delete events[key];}};}}};
    if(name.endsWith('useAppStore'))return{useAppStore:()=>store};
    if(name.endsWith('sessionPolicy'))return policy;
    if(name.endsWith('soundService'))return{soundService:{subscribe:()=>()=>{},setLearningPaused:v=>pauses.push(v)}};
    throw Error(name);
  },ClockDate,fn=>{interval=fn;return 1;},()=>{});
  const render=()=>{cursor=rc=ec=0;const result=mod.exports.useSessionGuard();for(const e of effects)if(e.pending){e.cleanup?.();e.cleanup=e.fn();e.pending=false;}return result;};
  const tick=(seconds=1)=>{clock+=seconds*1000;interval();render();return render();};
  render();tick();tick();assert.equal(tick().usedSeconds,3);
  events.change('background');tick();assert.equal(tick().usedSeconds,3);
  events.change('active');store.route='parent-dashboard';render();assert.equal(tick().usedSeconds,3);
  store.route='home';render();tick(121);assert.equal(tick().usedSeconds,3,'long gaps and idle screens do not accrue time');
  render().touch();assert.equal(tick().usedSeconds,4);
  store.currentProfile={id:'two',screenTimeLog:{}};render();render();
  assert.equal(saved.at(-1).id,'one','switching profiles flushes old time to the previous child');
  assert.equal(tick().usedSeconds,1);
  render().takeBreak();render();assert.equal(tick().usedSeconds,1);assert.equal(render().blocked,true);
  assert.equal(pauses.at(-1),true);
  effects.forEach(e=>e.cleanup?.());
});
