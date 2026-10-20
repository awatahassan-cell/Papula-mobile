const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const profile={id:'test',ageGroup:'5-6',masteredLetterIds:[],inProgressLetterIds:[],learnedWordIds:[]};
const results=[],games=[],spoken=[],skills=[],placements=[];let states=[],refs=[],cursor=0,refCursor=0;
const react={useEffect:()=>{},useMemo:fn=>fn(),useRef:initial=>{const i=refCursor++;return refs[i]||(refs[i]={current:initial});},useState:initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},createElement:(type,props,...children)=>({type,props:{...props,children}})};react.default=react;
const store={recordLessonStep(){},recordSkillResult:(...args)=>skills.push(args),savePlacement:(...args)=>placements.push(args),currentProfile:profile,recordPracticeResult:(ids,correct,word)=>results.push({ids,correct,word}),finishLearningGame:kind=>games.push(kind)};
let speechEndCallbacks=null;
const cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json.ts'))return JSON.parse(fs.readFileSync(file.slice(0,-3),'utf8'));if(!fs.existsSync(file)&&fs.existsSync(file+'x'))file+='x';if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;new Function('exports','module','require',source)(module.exports,module,p=>p.endsWith('/TactileButton')?{TactileButton:'Button'}:p.endsWith('.webp')?1:p==='react'?react:p==='lucide-react-native'?{Volume2:'SpeakerIcon'}:p.endsWith('/voiceRecorderService')?{voiceRecorderService:{}}:p.endsWith('/RTLText')?{Text:'Text',TextInput:'TextInput'}:p==='react-native'?{View:'View',Text:'Text',ScrollView:'ScrollView',TouchableOpacity:'Button',StyleSheet:{create:value=>value}}:p.endsWith('/useAppStore')?{useAppStore:()=>store}:p.endsWith('/soundService')?{soundService:{speakWord:async(text,options)=>{spoken.push(text);if(speechEndCallbacks)speechEndCallbacks.push(options?.onEnd);else options?.onEnd?.();},stopSpeaking:async()=>{},playCorrect(){},playEncouragingTryAgain(){}}}:load(path.resolve(path.dirname(file),p+'.ts')));return module.exports;}
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
store.currentProfile={...profile,masteredLetterIds:load(path.join(__dirname,'../src/data/mockLetters.ts')).mockLetters.slice(0,3).map(letter=>letter.id)};
tree=render(LetterPractice,practice);
for(let index=0;index<3;index++){
 const target=states[0][index].target;
 if(index===0){const wrong=states[0][0].options.find(l=>l.id!==target.id);button(tree,`پیتی ${wrong.glyph}`).props.onPress();tree=render(LetterPractice,practice);assert.ok(!button(tree,'پیتی دواتر ←'));button(tree,'جارێکی تر هەوڵ بدەم').props.onPress();tree=render(LetterPractice,practice);}
 button(tree,`پیتی ${target.glyph}`).props.onPress();tree=render(LetterPractice,practice);const next=button(tree,index===2?'تەواو بکەم ✓':'پیتی دواتر ←');next.props.onPress();next.props.onPress();tree=render(LetterPractice,practice);
}
assert.equal(completed,1);assert.ok(button(tree,'گەڕانەوە'));
store.currentProfile=profile;
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
for(let i=0;i<5;i++){button(tree,'وشەکە ببیستە').props.onPress();tree=render(StartingSoundGame,phonicsProps);const target=states[0][i].target;button(tree,'دەنگی سەرەتای پیتی '+target.glyph).props.onPress();tree=render(StartingSoundGame,phonicsProps);const next=button(tree,'دواتر ←');next.props.onPress();next.props.onPress();tree=render(StartingSoundGame,phonicsProps);}
assert.equal(games.filter(kind=>kind==='sound').length,1);
const {LetterFormsLesson}=load(path.join(__dirname,'../src/features/learning/LetterFormsLesson.tsx'));
states=[];refs=[];let formsPassed=0;const formsProps={letter:load(path.join(__dirname,'../src/data/mockLetters.ts')).mockLetters[7],onPass(){formsPassed++;}};
tree=render(LetterFormsLesson,formsProps);const choices=states[1];const wrong=choices.find(l=>l.id!==formsProps.letter.id);button(tree,'شێوەی '+wrong.forms.medial).props.onPress();tree=render(LetterFormsLesson,formsProps);assert.equal(formsPassed,0);button(tree,'دووبارە تاقی بکەمەوە').props.onPress();tree=render(LetterFormsLesson,formsProps);const right=button(tree,'شێوەی '+formsProps.letter.forms.medial);right.props.onPress();right.props.onPress();assert.equal(formsPassed,1);
console.log('PASS: starting-sound listening gate and all rounds, letter-form retry/recognition and duplicate-action guards.');

const {GuidedLetterLesson}=load(path.join(__dirname,'../src/features/alphabet/GuidedLetterLesson.tsx'));
states=[];refs=[];const lessonLetter=load(path.join(__dirname,'../src/data/mockLetters.ts')).mockLetters[0];
let lessonDestination=null,detailsOpened=0;
store.setRoute=route=>lessonDestination=route;store.setSelectedLetter=letter=>assert.equal(letter.id,lessonLetter.id);store.saveWord=()=>{};
const lessonProps={letter:lessonLetter,onDetails:()=>detailsOpened++};
tree=render(GuidedLetterLesson,lessonProps);
let openedLetterStory=null;store.setSelectedStory=story=>openedLetterStory=story;
// Re-render to capture the newly installed store callback.
tree=render(GuidedLetterLesson,lessonProps);
nodes(tree).find(n=>n.props?.accessibilityLabel?.startsWith('چیرۆکی پیتی '+lessonLetter.glyph+':')).props.onPress();
assert.equal(openedLetterStory.targetLetterId,lessonLetter.id);assert.equal(lessonDestination,'story-reader');
assert.ok(button(tree,'دەنگەکە ببیستە'),'audio guidance remains directly accessible');
assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,true,'listening cannot be skipped');
const speechBeforeFive=spoken.length;
speechEndCallbacks=[];
for(let listen=0;listen<5;listen++){
  button(tree,'دەنگەکە ببیستە').props.onPress();tree=render(GuidedLetterLesson,lessonProps);
  assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,true,'next stays locked while listening');
  assert.equal(spoken.at(-1),`پیتی ${lessonLetter.name}`,'each tap plays the letter once');
  speechEndCallbacks.shift()();tree=render(GuidedLetterLesson,lessonProps);
  assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,listen<4,'five completed plays unlock the next step');
  assert.ok(text(tree).includes((listen+1)+'/5'),'visible listening counter');
  if(listen<4)assert.equal(speechEndCallbacks.length,0,'another repetition needs another tap');
}
assert.deepEqual(spoken.slice(speechBeforeFive),[...Array(5).fill(`پیتی ${lessonLetter.name}`),'ئافەرم! ئامادەیت بۆ هەنگاوی دواتر.']);
speechEndCallbacks=null;tree=render(GuidedLetterLesson,lessonProps);
assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,false,'next unlocks after five complete letter plays');
button(tree,'هەنگاوی دواتر ←').props.onPress();tree=render(GuidedLetterLesson,lessonProps);
assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,true,'compact footer keeps the forms prerequisite');
nodes(tree).find(n=>n.type===LetterFormsLesson).props.onPass();tree=render(GuidedLetterLesson,lessonProps);
button(tree,'هەنگاوی دواتر ←').props.onPress();tree=render(GuidedLetterLesson,lessonProps);
for(let i=0;i<lessonLetter.exampleWords.length-1;i++){button(tree,'وشەی دواتر ←').props.onPress();tree=render(GuidedLetterLesson,lessonProps);}
button(tree,'هەنگاوی دواتر ←').props.onPress();tree=render(GuidedLetterLesson,lessonProps);
for(let i=0;i<lessonLetter.exampleWords.length;i++){
 const advanceLabel=i<lessonLetter.exampleWords.length-1?'یاریی دواتر ←':'هەنگاوی دواتر ←';
 assert.equal(button(tree,advanceLabel).props.disabled,true,'recognition cannot be skipped');
 const choice=button(tree,'پیتی '+lessonLetter.glyph);choice.props.onPress();choice.props.onPress();tree=render(GuidedLetterLesson,lessonProps);
 assert.equal(button(tree,advanceLabel).props.disabled,false);
 button(tree,advanceLabel).props.onPress();tree=render(GuidedLetterLesson,lessonProps);
}
button(tree,'بنووسم ✍️').props.onPress();assert.equal(lessonDestination,'writing');
assert.ok(!button(tree,'زانیاری زیاتر دەربارەی پیتی '+lessonLetter.glyph),'details no longer open a separate screen');
console.log('PASS: compact guided lesson retains audio, all examples, forms/recognition gates, details and writing navigation.');

// A superseded/interrupted playback must not count as a completed listen.
states=[];refs=[];speechEndCallbacks=[];
tree=render(GuidedLetterLesson,lessonProps);
button(tree,'دەنگەکە ببیستە').props.onPress();
button(tree,'دەنگەکە ببیستە').props.onPress();
speechEndCallbacks.shift()();tree=render(GuidedLetterLesson,lessonProps);
assert.ok(text(tree).includes('0/5'),'cancelled playback does not increment the counter');
speechEndCallbacks.shift()();tree=render(GuidedLetterLesson,lessonProps);
assert.ok(text(tree).includes('1/5'),'only the current completed audio counts');
assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,true);
speechEndCallbacks=null;

// Revisiting a completed letter announces review instead of a new letter.
states=[];refs=[];
store.currentProfile={...profile,masteredLetterIds:[lessonLetter.id]};
const introductionEffects=[],originalEffect=react.useEffect;
react.useEffect=fn=>introductionEffects.push(fn);
tree=render(GuidedLetterLesson,lessonProps);
const beforeIntro=spoken.length;
const stopIntro=introductionEffects.map(effect=>effect()).filter(cleanup=>typeof cleanup==='function');
assert.equal(spoken[beforeIntro],'با دەست بکەین بە پێداچوونەوەی پیتەکە.');
assert.ok(!spoken.slice(beforeIntro).some(line=>line.includes('پیتێکی تازە')));
stopIntro.forEach(stop=>stop());react.useEffect=originalEffect;store.currentProfile=profile;
states=[];refs=[];
store.currentProfile={...profile,writingProgress:{[lessonLetter.id]:{tracePassed:true}}};
tree=render(GuidedLetterLesson,lessonProps);
assert.equal(button(tree,'هەنگاوی دواتر ←').props.disabled,true,'passing tracing alone must not bypass listening and the other lesson requirements');
store.currentProfile=profile;
console.log('PASS: five-play counter ignores cancelled playback and revisited letters introduce review.');
