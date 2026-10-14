const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const profile={id:'test',ageGroup:'5-6',masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[]};
const results=[],games=[],spoken=[],skills=[],placements=[];let states=[],refs=[],cursor=0,refCursor=0;
const react={useEffect:()=>{},useMemo:fn=>fn(),useRef:initial=>{const i=refCursor++;return refs[i]||(refs[i]={current:initial});},useState:initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},createElement:(type,props,...children)=>({type,props:{...props,children}})};react.default=react;
const store={recordSkillResult:(...args)=>skills.push(args),savePlacement:(...args)=>placements.push(args),currentProfile:profile,recordPracticeResult:(ids,correct,word)=>results.push({ids,correct,word}),finishLearningGame:kind=>games.push(kind)};
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;new Function('exports','module','require',source)(module.exports,module,p=>p==='react'?react:p==='react-native'?{View:'View',Text:'Text',ScrollView:'ScrollView',TouchableOpacity:'Button',StyleSheet:{create:value=>value}}:p.endsWith('/useAppStore')?{useAppStore:()=>store}:p.endsWith('/soundService')?{soundService:{speakWord:async(text,options)=>{spoken.push(text);options?.onEnd?.();},stopSpeaking:async()=>{},playCorrect(){},playEncouragingTryAgain(){}}}:load(path.resolve(path.dirname(file),p+'.ts')));return module.exports;}
const {WordBuilder}=load(path.join(__dirname,'../src/features/learning/WordBuilder.tsx'));
const {LetterPractice}=load(path.join(__dirname,'../src/features/learning/LetterPractice.tsx'));
const engine=load(path.join(__dirname,'../src/services/learningEngine.ts'));
function nodes(tree){if(!tree||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(nodes);return[tree,...nodes(tree.props?.children)];}
const text=node=>nodes(node).filter(n=>n.type==='Text').flatMap(n=>n.props.children).filter(v=>typeof v==='string').join('');
const render=(component,props)=>{cursor=0;refCursor=0;return component(props);};
const button=(tree,label)=>nodes(tree).find(n=>n.type==='Button'&&(n.props.accessibilityLabel===label||text(n)===label));
const nan=engine.LEARNING_WORDS.find(w=>w.word==='نان');
const props={initialWords:[nan],onExit:()=>{}};let tree=render(WordBuilder,props);
assert.equal(button(tree,'پشکنینی وشەکەم ✓').props.disabled,true,'partial word cannot be checked');
for(const id of [1,0,2]){button(tree,`پیتی ${nan.units[id]}، دانەی ${id+1}`).props.onPress();tree=render(WordBuilder,props);}
button(tree,'پشکنینی وشەکەم ✓').props.onPress();tree=render(WordBuilder,props);assert.equal(results.at(-1).correct,false);assert.ok(!games.length);
button(tree,'دووبارە دایبنێم').props.onPress();tree=render(WordBuilder,props);
for(const id of [0,1,2]){button(tree,`پیتی ${nan.units[id]}، دانەی ${id+1}`).props.onPress();tree=render(WordBuilder,props);}
const check=button(tree,'پشکنینی وشەکەم ✓');check.props.onPress();check.props.onPress();tree=render(WordBuilder,props);
assert.equal(results.filter(r=>r.correct).length,1,'rapid check does not duplicate attempts');assert.equal(results.at(-1).word,nan.id);
const finish=button(tree,'تەواو بکەم ✓');finish.props.onPress();finish.props.onPress();tree=render(WordBuilder,props);assert.deepEqual(games,['word']);assert.ok(button(tree,'گەڕانەوە بۆ یارییەکان'));
states=[];refs=[];let completed=0;const practice={mode:'review',onExit(){},onComplete(){completed++;}};
tree=render(LetterPractice,practice);
for(let index=0;index<3;index++){
 const target=states[0][index].target;
 if(index===0){const wrong=states[0][0].options.find(l=>l.id!==target.id);button(tree,`پیتی ${wrong.glyph}`).props.onPress();tree=render(LetterPractice,practice);assert.ok(!button(tree,'پیتی دواتر ←'));button(tree,'جارێکی تر هەوڵ بدەم').props.onPress();tree=render(LetterPractice,practice);}
 button(tree,`پیتی ${target.glyph}`).props.onPress();tree=render(LetterPractice,practice);const next=button(tree,index===2?'تەواو بکەم ✓':'پیتی دواتر ←');next.props.onPress();next.props.onPress();tree=render(LetterPractice,practice);
}
assert.equal(completed,1);assert.ok(button(tree,'گەڕانەوە'));
console.log('PASS: real word-builder and review handlers, duplicate tiles, wrong/retry/success, partial-word checks and rapid double-click guards. Audio mocked.');

const {StartingAssessment}=load(path.join(__dirname,'../src/features/learning/StartingAssessment.tsx'));
states=[];refs=[];const assessmentProps={onExit(){}};tree=render(StartingAssessment,assessmentProps);
for(let i=0;i<6;i++){button(tree,'هێشتا نازانم').props.onPress();tree=render(StartingAssessment,assessmentProps);const next=button(tree,'دواتر ←');next.props.onPress();next.props.onPress();tree=render(StartingAssessment,assessmentProps);}
assert.equal(placements.length,1);assert.equal(placements[0][0],0);assert.equal(placements[0][1],6);assert.equal(placements[0][2].length,4);
const {StorySequence}=load(path.join(__dirname,'../src/features/learning/StorySequence.tsx'));
states=[];refs=[];let sequenceDone=0;const sequenceProps={story:{coverEmoji:'📖',pages:[{textKu:'دار',illustrationTheme:'🌳'},{textKu:'گوڵ',illustrationTheme:'🌷'},{textKu:'باران',illustrationTheme:'🌧️'}]},onComplete(){sequenceDone++;}};
tree=render(StorySequence,sequenceProps);
for(const word of ['باران','گوڵ','دار']){nodes(tree).find(n=>n.type==='Button'&&text(n).includes(word)).props.onPress();tree=render(StorySequence,sequenceProps);}
button(tree,'پشکنینی ڕیزەکە ✓').props.onPress();tree=render(StorySequence,sequenceProps);assert.equal(skills.at(-1)[1],false);assert.equal(sequenceDone,0);
for(const word of ['دار','گوڵ','باران']){nodes(tree).find(n=>n.type==='Button'&&text(n).includes(word)).props.onPress();tree=render(StorySequence,sequenceProps);}
const final=button(tree,'پشکنینی ڕیزەکە ✓');final.props.onPress();final.props.onPress();assert.equal(sequenceDone,1);assert.equal(skills.at(-1)[1],true);
console.log('PASS: no-pressure starting assessment and story ordering retry/completion; no repeated saving or rewards.');

const {StartingSoundGame}=load(path.join(__dirname,'../src/features/learning/StartingSoundGame.tsx'));
states=[];refs=[];const phonicsProps={onExit(){}};tree=render(StartingSoundGame,phonicsProps);
for(let i=0;i<5;i++){button(tree,'وشەکە ببیستە 🔊').props.onPress();tree=render(StartingSoundGame,phonicsProps);const target=states[0][i].target;button(tree,'دەنگی سەرەتای پیتی '+target.glyph).props.onPress();tree=render(StartingSoundGame,phonicsProps);const next=button(tree,'دواتر ←');next.props.onPress();next.props.onPress();tree=render(StartingSoundGame,phonicsProps);}
assert.equal(games.filter(kind=>kind==='sound').length,1);
const {LetterFormsLesson}=load(path.join(__dirname,'../src/features/learning/LetterFormsLesson.tsx'));
states=[];refs=[];let formsPassed=0;const formsProps={letter:load(path.join(__dirname,'../src/data/mockLetters.ts')).mockLetters[7],onPass(){formsPassed++;}};
tree=render(LetterFormsLesson,formsProps);const choices=states[1];const wrong=choices.find(l=>l.id!==formsProps.letter.id);button(tree,'شێوەی '+wrong.forms.medial).props.onPress();tree=render(LetterFormsLesson,formsProps);assert.equal(formsPassed,0);button(tree,'دووبارە تاقی بکەمەوە').props.onPress();tree=render(LetterFormsLesson,formsProps);const right=button(tree,'شێوەی '+formsProps.letter.forms.medial);right.props.onPress();right.props.onPress();assert.equal(formsPassed,1);
console.log('PASS: starting-sound listening gate and all rounds, letter-form retry/recognition and duplicate-action guards.');
