const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
test('one voice-only dock follows the focused exercise, ignores stale cleanup and respects microphone/break locks',()=>{
  let state=null,context,sequence=0,focus;const spoken=[];
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
    if(name==='react-native')return{View:'View',StyleSheet:{create:value=>value}};
    if(name.endsWith('/useAppearance'))return{useAppearance:()=>({colors:{mint:'#0a7c93',mintDark:'#075f72'},isNight:false})};
    if(name.endsWith('/appearance'))return{accentFill:c=>c.mint};
    if(name==='expo-router')return{useFocusEffect:fn=>focus=fn};
    if(name==='lucide-react-native')return{Volume2:'VolumeIcon'};
    if(name.endsWith('/TactileButton'))return{TactileButton:'Button'};
    if(name.endsWith('/soundService'))return{soundService:{speakWord:async text=>spoken.push(text)}};
    throw Error(name);
  });
  const {HelpProvider,HelpHint,HelpDock}=mod.exports;
  const provide=()=>context.value=HelpProvider({children:null}).props.value;
  const dock=(disabled=false)=>HelpDock({fallbackText:'home',disabled});
  const button=tree=>tree.props.children[0];
  provide();let tree=dock();button(tree).props.onPress();assert.equal(spoken.at(-1),'home');
  assert.equal(HelpHint({text:'story',disabled:true}),null,'screens register instructions without rendering a second button');
  const leaveStory=focus();provide();tree=dock();assert.equal(button(tree).props.disabled,true);button(tree).props.onPress();assert.equal(spoken.length,1);
  HelpHint({text:'letters'});const leaveLetters=focus();provide();leaveStory();provide();tree=dock();button(tree).props.onPress();assert.equal(spoken.at(-1),'letters','old screen cleanup cannot erase the current hint');
  tree=dock(true);button(tree).props.onPress();assert.equal(spoken.length,2,'a break blocks narration');
  leaveLetters();provide();tree=dock();button(tree).props.onPress();assert.equal(spoken.at(-1),'home','blur restores section fallback');
  assert.equal(button(tree).props.children[0].type,'VolumeIcon');
  assert.equal(button(tree).props.children.length,1,'no written prompt or expanded explanation');
  assert.equal(button(tree).props.style[0].width,64);assert.equal(button(tree).props.style[0].height,64);
  assert.equal(tree.props.pointerEvents,'box-none','empty overlay does not intercept the page');
  assert.equal(button(tree).props.style[0].position,'absolute');
  assert.equal(button(tree).props.style[0].left,16,'button stays on the physical left');
  assert.equal(tree.props.style[0].minHeight,undefined,'help reserves no layout space');
  assert.equal(tree.props.style[1].direction,'ltr','dock keeps the same physical side in RTL');
  const layout=fs.readFileSync(path.resolve(__dirname,'../src/app/_layout.tsx'),'utf8');
  assert.ok(layout.indexOf('<HelpDock') < layout.indexOf('{!tablet && <GardenNavigation'), 'help stays above the bottom navigation');
  assert.equal((layout.match(/<HelpDock\b/g)||[]).length,1,'exactly one app-level dock');
  assert.ok(layout.indexOf('<HelpDock')>layout.indexOf('<Stack'),'dock sits outside the navigator and scrolling screen');
});
