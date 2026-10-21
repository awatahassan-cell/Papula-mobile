const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const mod = {exports:{}};
new Function('exports', ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/services/inkPath.ts'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod.exports);
const {inkPath, inkFrames} = mod.exports;

test('ink curves preserve endpoints, dots, bounded control points and original scoring samples', () => {
  assert.equal(inkPath([]), '');
  assert.equal(inkPath([{x:20,y:30}]), 'M 20 30');
  assert.equal(inkPath([{x:0,y:1},{x:100,y:99}]), 'M 0 1 L 100 99');
  const points = Object.freeze([{x:10,y:20},{x:25,y:70},{x:40,y:30},{x:80,y:90}].map(Object.freeze));
  const original = JSON.stringify(points), curve = inkPath(points);
  assert.equal(curve, 'M 10 20 Q 25 70 32.5 50 Q 40 30 60 60 L 80 90');
  assert.equal(JSON.stringify(points), original, 'smoothing never changes the samples used by the scorer');
  assert.ok(!curve.includes('Z'), 'separate pen lifts are never joined or closed');
});

test('rapid ink updates share a frame and finish/clear cancels stale previews', () => {
  let id = 0, updates = 0;
  const queue = new Map();
  const frames = inkFrames(() => updates++, fn => {queue.set(++id,fn);return id;}, key => queue.delete(key));
  for (let i=0;i<100;i++) frames.schedule();
  assert.equal(queue.size, 1);
  const render = [...queue.values()][0];queue.clear();render();assert.equal(updates,1);
  frames.schedule();frames.cancel();assert.equal(queue.size,0);
  frames.cancel();frames.schedule();assert.equal(queue.size,1);
});

test('writing gestures retain fast samples and release endpoint before the next frame, including pen-lift dots', () => {
  const states=[], refs=[], memos=[], effects=[], queue=new Map();
  let cursor=0, rc=0, mc=0, ec=0, next=0, handlers, reported;
  const react={
    createElement:(type,props,...children)=>({type,props:{...props,children}}),
    useState(initial){const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},
    useRef(initial){return refs[rc++]??={current:initial};},
    useMemo(fn){return memos[mc++]??=fn();},
    useEffect(){},
    useLayoutEffect(fn,deps){const i=ec++, old=effects[i];if(!old||!deps||deps.some((v,j)=>v!==old.deps?.[j]))effects[i]={fn,deps,pending:true};},
  };react.default=react;
  const module={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../src/features/writing/WritingBoard.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
  new Function('exports','require','requestAnimationFrame','cancelAnimationFrame',source)(module.exports,name=>{
    if(name==='react')return react;
    if(name==='react-native')return{View:'View',StyleSheet:{create:x=>x},PanResponder:{create:value=>{handlers=value;return{panHandlers:{}};}}};
    if(name==='react-native-svg')return{default:'Svg',Circle:'Circle',Line:'Line',Path:'Path'};
    if(name.endsWith('/inkPath'))return mod.exports;
    if(name.endsWith('/PapulaMascot'))return{PapulaMascot:'Mascot'};
    if(name.endsWith('/pathSimilarity'))return{resamplePolyline:x=>x};
    throw Error(name);
  },fn=>{queue.set(++next,fn);return next;},id=>queue.delete(id));
  const render=(resetKey=1,disabled=false)=>{cursor=rc=mc=ec=0;module.exports.WritingBoard({side:200,resetKey,disabled,onStrokesChange:value=>reported=value});for(const effect of effects)if(effect.pending){effect.pending=false;effect.fn();}};
  const event=(x,y)=>({nativeEvent:{locationX:x,locationY:y}});
  render();handlers.onPanResponderGrant(event(20,40));
  handlers.onPanResponderMove(event(40,60));handlers.onPanResponderMove(event(80,100));
  assert.equal(queue.size,1);handlers.onPanResponderRelease(event(100,120));
  assert.equal(queue.size,0);
  assert.deepEqual(reported,[[{x:10,y:20},{x:20,y:30},{x:40,y:50},{x:50,y:60}]]);
  handlers.onPanResponderGrant(event(60,140));handlers.onPanResponderRelease(event(60,140));
  assert.deepEqual(reported[1],[{x:30,y:70}],'a dot stays a separate pen lift');
  handlers.onPanResponderGrant(event(40,40));handlers.onPanResponderMove(event(60,60));
  render(2);assert.equal(queue.size,0);assert.deepEqual(reported,[],'reset cancels queued ink');
  render(2,true);assert.equal(handlers.onStartShouldSetPanResponder(),false);
});
