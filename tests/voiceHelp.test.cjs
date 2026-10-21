const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
test('one voice-help button sits in the page header, follows the focused exercise, ignores stale cleanup and respects breaks',()=>{
  let state=null,context,sequence=0,focus,route='home';const spoken=[];
  const react={
    createContext:()=>context={value:null,Provider:'Provider'},
    useState:()=>[state,v=>state=typeof v==='function'?v(state):v],
    useContext:c=>c.value,useId:()=>String(++sequence),useCallback:fn=>fn,useMemo:fn=>fn(),
    createElement:(type,props,...children)=>({type,props:{...props,children}}),
  };react.default=react;
  const mod={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../src/components/HelpButton.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
  new Function('exports','require',source)(mod.exports,name=>{
    if(name==='react')return react;
    if(name==='react-native')return{StyleSheet:{create:value=>value}};
    if(name.endsWith('/useAppearance'))return{useAppearance:()=>({colors:{mint:'#0a7c93',mintDark:'#075f72'},isNight:false})};
    if(name.endsWith('/appearance'))return{accentFill:c=>c.mint};
    if(name==='expo-router')return{useFocusEffect:fn=>focus=fn};
    if(name==='lucide-react-native')return{CircleHelp:'HelpIcon'};
    if(name.endsWith('/TactileButton'))return{TactileButton:'Button'};
    if(name.endsWith('/soundService'))return{soundService:{speakWord:async text=>spoken.push(text)}};
    if(name.endsWith('/useAppStore'))return{useAppStore:()=>({route})};
    if(name.endsWith('/exerciseHelp'))return{exerciseHelp:{story:'story-help',letter:'letter-help'}};
    if(name.endsWith('/sectionIntroductions'))return{sectionIntroductions:{home:'home-intro',stories:'stories-intro'}};
    throw Error(name);
  });
  const {HelpProvider,HelpHint,HelpPill}=mod.exports;
  const provide=()=>context.value=HelpProvider({children:null}).props.value;
  const pill=(disabled=false)=>HelpPill({disabled});
  provide();let button=pill();button.props.onPress();assert.equal(spoken.at(-1),'home-intro','falls back to the section introduction');
  route='stories';button=pill();button.props.onPress();assert.equal(spoken.at(-1),'stories-intro');
  route='letter-detail';button=pill();button.props.onPress();assert.equal(spoken.at(-1),'letter-help');
  assert.equal(HelpHint({text:'story',disabled:true}),null,'screens register instructions without rendering a second button');
  const leaveStory=focus();provide();button=pill();assert.equal(button.props.disabled,true);const before=spoken.length;button.props.onPress();assert.equal(spoken.length,before);
  HelpHint({text:'letters'});const leaveLetters=focus();provide();leaveStory();provide();button=pill();button.props.onPress();assert.equal(spoken.at(-1),'letters','old screen cleanup cannot erase the current hint');
  button=pill(true);const n=spoken.length;button.props.onPress();assert.equal(spoken.length,n,'a break blocks narration');
  leaveLetters();provide();route='home';button=pill();button.props.onPress();assert.equal(spoken.at(-1),'home-intro','blur restores the section introduction');
  assert.equal(button.props.children[0].type,'HelpIcon');
  assert.equal(button.props.style[0].width,44);assert.equal(button.props.style[0].height,44);
  assert.equal(button.props.style[0].position,undefined,'the button is in the layout, never floating over content');
  const layout=fs.readFileSync(path.resolve(__dirname,'../src/app/_layout.tsx'),'utf8');
  assert.ok(!layout.includes('<HelpDock'),'no floating dock any more');
  assert.ok(fs.readFileSync(path.resolve(__dirname,'../src/components/TopHeader.tsx'),'utf8').includes('<HelpPill'),'help is in the page header');
  assert.ok(fs.readFileSync(path.resolve(__dirname,'../src/features/home/HomeScreen.tsx'),'utf8').includes('<HelpPill'),'help is in the home header');
});
