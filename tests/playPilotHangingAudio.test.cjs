const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const catalogLoad=require('../scripts/story-narration-catalog.cjs').createLoader();
const allLetters=catalogLoad(path.resolve('src/data/mockLetters.ts')).mockLetters;
{const letterIndex=0,letter=allLetters[0];test('narration that hangs (never ends, never fails) does not trap the child',async()=>{
 const content=catalogLoad(path.resolve('src/features/adventure/playJourneyContent.ts')).playJourneyContent(letter.id);
 const load=require('../scripts/story-narration-catalog.cjs').createLoader(),service=load(path.resolve('src/services/playPilot.ts')),garden=load(path.resolve('src/services/gardenQuest.ts'));
 const states=[],refs=[],memo=[];let si=0,ri=0,ci=0,focus,lastFocus,cleanup;
 const speech=[],pending=[],timers=new Map(),records=[];let timerId=0;
 const react={useState(v){const i=si++;if(!(i in states))states[i]=typeof v==='function'?v():v;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef(v){return refs[ri++]??={current:v};},useCallback(fn,deps){const i=ci++,old=memo[i];if(old&&deps.every((x,j)=>Object.is(x,old.deps[j]))&&deps.length===old.deps.length)return old.fn;memo[i]={fn,deps};return fn;},useEffect(){},createElement:(type,props,...children)=>({type,props:{...props,children}})};react.default=react;
 const store={currentProfile:{id:'one',ageGroup:'3-4',stars:0,masteredLetterIds:allLetters.slice(0,letterIndex).map(item=>item.id)},recordPracticeResult(...args){records.push(args);store.currentProfile={...store.currentProfile,practiceSeconds:records.length};},completePlayPilotRound(step,id){store.currentProfile=service.finishPlayPilotRound(store.currentProfile,step,id);},plantQuestFlower(spot,id){store.currentProfile=garden.plantGardenFlower(store.currentProfile,spot,id);},setRoute(route){store.route=route;},setSelectedLetter(){},setSelectedStory(){}};
 const module={exports:{}};
 new Function('exports','require','setTimeout','clearTimeout',ts.transpileModule(fs.readFileSync('src/features/adventure/PlayPilotJourney.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(module.exports,name=>{
  if(name==='react')return react;
  if(name==='react-native')return{View:'View',Animated:{Value:function(){},View:'AnimatedView'},Easing:{},StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:360,height:640})};
  if(name==='expo-router')return{useFocusEffect:fn=>focus=fn};
  if(name==='react-native-svg')return{default:'Svg',Path:'Path',Circle:'Circle'};
  if(name==='lucide-react-native')return new Proxy({},{get:(_,key)=>String(key)});
  if(name.endsWith('/RTLText'))return{Text:'Text'};
  if(name.endsWith('/CharacterPicture'))return{CharacterPicture:'Picture'};
  if(name.endsWith('/TactileButton'))return{TactileButton:'Button'};
  if(name.endsWith('/HelpButton'))return{HelpHint:'Hint'};
  if(name.endsWith('/Motion'))return{useReducedMotion:()=>true};
  if(name.endsWith('/useAppearance'))return{useAppearance:()=>({colors:{mint:'#7341bd'},isNight:false})};
  if(name.endsWith('/appearance'))return{accentFill:()=> '#7341bd'};
  if(name.endsWith('/useAppStore'))return{useAppStore:()=>store};
  if(name.endsWith('/soundService'))return{soundService:{speakWord:(text)=>{speech.push(text);return Promise.resolve();},stopSpeaking:async()=>{},playCorrect(){},playEncouragingTryAgain(){}}};
  if(name.endsWith('/letterStories'))return{getLetterStory:()=>({id:'story-dal'})};
  if(name.endsWith('/LetterIntro'))return{LetterIntro:'LetterIntro'};
  if(name.endsWith('/LetterListeningCheck'))return{LetterListeningCheck:'ListeningCheck'};
  return load(path.resolve('src/features/adventure',name+'.ts'));
 },(fn,ms)=>{const id=++timerId;timers.set(id,fn);return id;},id=>timers.delete(id));
 const render=()=>{si=ri=ci=0;return module.exports.PlayPilotJourney({letterId:letter.id});};
 const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props.children)];
 const button=(tree,label)=>nodes(tree).find(n=>n.type==='Button'&&n.props.accessibilityLabel===label);
 const option=(tree,id)=>nodes(tree).find(n=>n.props.testID===`pilot-option-${id}`);
 const focusNow=()=>{if(focus!==lastFocus){cleanup?.();lastFocus=focus;cleanup=focus();}};
 const finishSpeech=()=>{for(let i=0;i<20&&(pending.length||timers.size);i++){while(pending.length)pending.shift()();for(const [id,fn] of [...timers]){timers.delete(id);fn();}}};
 let tree=render();if(tree.type==='LetterIntro'){tree.props.onDone();tree=render();}focusNow();tree=render();
 assert.equal(option(tree,letter.id).props.disabled,true,'still gated while the narration is within its time limit');
 for(const [id,fn] of [...timers]){timers.delete(id);fn();}
 tree=render();
 assert.equal(option(tree,letter.id).props.disabled,false,'the time limit opens the options');
 option(tree,letter.id).props.onPress();tree=render();
 assert.deepEqual(service.playPilotProgress(store.currentProfile,letter.id),['sound']);
 cleanup?.();
});}
