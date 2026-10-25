const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const {pictureLabel}=load(path.resolve('src/art/pictureLabel.ts'));
const {pictureFor}=load(path.resolve('src/art/pictures.ts'));
test('mixed illustrated labels keep Kurdish joined, preserve numbers and do not alter plain story text',()=>{
 assert.deepEqual(pictureLabel('با یاری بکەین 🦋'),{text:'با یاری بکەین ',symbols:['🦋']});
 assert.deepEqual(pictureLabel('📖 🦋'),{text:' ',symbols:['📖','🦋']});
 assert.deepEqual(pictureLabel('16 ⭐'),{text:'16 ',symbols:['⭐']});
 assert.deepEqual(pictureLabel('یاری، با پێکەوە بینووسین.'),{text:'یاری، با پێکەوە بینووسین.',symbols:[]});
});
test('every pictorial symbol used by app screens and data has local SVG art',()=>{
 function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.tsx?$/.test(p))for(const c of fs.readFileSync(p,'utf8').match(/\p{Extended_Pictographic}/gu)||[]){if(c==='↔')continue;assert.ok(pictureFor(c),`${p}: ${c}`);}}}walk('src');
});
test('decorative animation stops off-screen, in the background and with reduced motion; small icons stay still',()=>{
 let focus,listener,reduced=false,starts=0,stops=0,removed=0,navigation;
 const events={};
 const value={setValue(){},interpolate(){return 0;}};
 const react={memo:fn=>fn,useState:fn=>[fn()],useContext:()=>navigation,useEffect:fn=>focus=fn,createElement:(type,props,...children)=>({type,props:{...props,children}})};react.default=react;
 const native={Animated:{Value:function(){return value;},View:'AnimatedView',timing(){},sequence(){},loop:()=>({start(){starts++},stop(){stops++}})},AppState:{currentState:'active',addEventListener:(_,fn)=>{listener=fn;return{remove(){removed++}};}},Easing:{inOut(){},sin:0},Platform:{OS:'android'},StyleSheet:{absoluteFill:{}},View:'View'};
 const mod={exports:{}};
 new Function('exports','require',ts.transpileModule(fs.readFileSync('src/components/CharacterPicture.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(mod.exports,name=>name==='react'?react:name==='react-native'?native:name==='expo-router/react-navigation'?{NavigationContext:{}}:name==='react-native-svg'?{SvgXml:'SvgXml'}:name.endsWith('/pictures')?{pictureFor}:name.endsWith('/characters')?load(path.resolve('src/art/characters.ts')):{useReducedMotion:()=>reduced});
 const render=props=>{mod.exports.CharacterPicture({symbol:'🦊',size:84,...props});return focus();};
 let cleanup=render();assert.equal(starts,1);listener('background');assert.ok(stops>=1);listener('active');assert.equal(starts,2);cleanup();assert.equal(removed,1);
 reduced=true;cleanup=render();assert.equal(starts,2);cleanup();
 reduced=false;cleanup=render({size:24});assert.equal(starts,2);cleanup();
 cleanup=render({animate:false});assert.equal(starts,2);cleanup();
 let focused=false;navigation={isFocused:()=>focused,addListener:(event,fn)=>{events[event]=fn;return()=>delete events[event];}};
 cleanup=render();assert.equal(starts,2,'hidden routes stay still');focused=true;events.focus();assert.equal(starts,3);events.blur();assert.ok(stops>=3);cleanup();assert.deepEqual(events,{});
});
