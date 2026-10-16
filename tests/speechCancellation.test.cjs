const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('typescript');
const source=fs.readFileSync(require('path').join(__dirname,'..','src','services','soundService.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const playback=require('../scripts/story-narration-catalog.cjs').createLoader()(require('path').join(__dirname,'../src/services/storyPlayback.ts'));
const waits=new Map();let timerId=0;const listeners=[];
const rates=[];const requests=[];let plays=0;const spoken=[];const cached=new Map();const bodies=[];
const bundled={};const mocks={
 './storyPlayback':playback,
 '../data/mockLetters':require('../scripts/story-narration-catalog.cjs').createLoader()(require('path').join(__dirname,'../src/data/mockLetters.ts')),
 '../data/offlineAudio':{OFFLINE_AUDIO:new Proxy({}, {get:(_,key)=>bundled[key]===undefined?undefined:{source:bundled[key],start:0,end:100,timings:[]}})},
 './audioCache':{audioCache:{get:async key=>cached.get(key)||null,put:async(key,uri)=>{cached.set(key,uri);return true;}},audioCacheKey:(text,voice)=>text+voice,bytesToBase64:bytes=>Buffer.from(bytes).toString('base64'),base64ToBytes:text=>new Uint8Array(Buffer.from(text,'base64'))},
 'react-native':{Platform:{OS:'ios'}},
 'expo-audio':{createAudioPlayer:()=>({volume:1,isLoaded:true,seekTo:async()=>{},setPlaybackRate(rate,quality){rates.push({rate,quality});},addListener(event,fn){listeners.push(fn);},play(){plays++;},pause(){},release(){}})},
 'expo-file-system':{Paths:{cache:'cache'},File:class{constructor(){this.uri='file://test.mp3';}create(){}write(){}delete(){}}},
 'expo-speech':{stop(){},speak(text,options){spoken.push(text);options.onDone?.();}}
};
const moduleFake={exports:{}};
const webAudio=[];
const fakeWindow={Audio:class {constructor(){webAudio.push(this);}play(){return Promise.resolve();}pause(){}},speechSynthesis:{cancel(){},getVoices:()=>[]}};
new Function('exports','module','require','fetch','window','setTimeout','clearTimeout',compiled)(moduleFake.exports,moduleFake,name=>mocks[name],(url,options)=>{bodies.push({url,body:JSON.parse(options.body)});return new Promise(resolve=>requests.push(resolve));},fakeWindow,(fn,ms)=>{waits.set(++timerId,{fn,ms});return timerId;},id=>waits.delete(id));
const service=moduleFake.exports.soundService;service.setElevenLabsApiKey('unit-test-key');
assert.equal(service.getVoiceId(),'tkI70vi7ETrk5NakcLUP','the requested ElevenLabs voice is the app default');
(async()=>{
 const pending=service.speakWord('پەیامی یەکەم');await new Promise(resolve=>setImmediate(resolve));
 await service.stopSpeaking();requests.shift()({ok:true});await pending;
 assert.equal(plays,0,'cancelled response must not play');assert.deepEqual(spoken,[]);
 const old=service.speakWord('پەیامی کۆن');await new Promise(resolve=>setImmediate(resolve));
 const fresh=service.speakWord('پەیامی نوێ');await new Promise(resolve=>setImmediate(resolve));
 requests.shift()({ok:true});requests.shift()({ok:false});await Promise.all([old,fresh]);
 assert.equal(plays,0);assert.deepEqual(spoken,['پەیامی نوێ']);
 const first=service.speakWord('نان');await new Promise(resolve=>setImmediate(resolve));
 requests.shift()({ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer});await first;
 assert.equal(plays,1);assert.equal(cached.size,1);assert.deepEqual(rates.at(-1),{rate:0.85,quality:'high'});
 const count=bodies.length;await service.speakWord('نان');assert.equal(plays,2);assert.equal(bodies.length,count,'cached audio avoids API calls');
 assert.equal(bodies.at(-1).url,'https://api.elevenlabs.io/v1/text-to-dialogue');
 assert.equal(bodies.at(-1).body.model_id,'eleven_v4');assert.equal(bodies.at(-1).body.inputs[0].text,'نان');
 assert.equal(bodies.at(-1).body.inputs[0].voice_id,'tkI70vi7ETrk5NakcLUP','narration requests use the requested voice');
 service.setElevenLabsApiKey('');bundled['خۆر'+service.getVoiceId()]=123;const requestsBefore=bodies.length;await service.speakWord('خۆر');assert.equal(plays,3);assert.equal(bodies.length,requestsBefore,'bundled MP3 works without a key or network request');
 assert.ok(rates.every(entry=>entry.rate===0.85),'new, cached and bundled narration all slow down');await service.playReviewedSound('file://reviewed-phoneme.mp3');assert.equal(rates.at(-1).rate,1,'reviewed isolated phonemes keep their recorded sound');console.log('PASS: new, cached and bundled audio use slower playback with pitch correction.');
 console.log('PASS: successful Eleven v4 audio persists and replays without another request.');
 console.log('PASS: leaving a screen cancels delayed speech; older replies cannot play after a new request. No live API calls made.');
 mocks['react-native'].Platform.OS='web';
 let ended=0;await service.speakWord('خۆر',{onEnd:()=>ended++});
 assert.equal(webAudio.at(-1).playbackRate,0.85);assert.equal(webAudio.at(-1).preservesPitch,true);
 assert.equal(ended,0,'slower playback must wait for actual completion');webAudio.at(-1).onended();assert.equal(ended,1);
 console.log('PASS: browser playback slows cached audio without changing pitch or guessing completion time.');
 mocks['react-native'].Platform.OS='ios';service.setElevenLabsApiKey('unit-test-key');
 const clean='دارا، دارا';const firstScript='[playful] '+clean;const secondScript='[softly] '+clean;
 const record=async script=>{
   const pending=service.speakWord(clean,{narrationText:script});await new Promise(resolve=>setImmediate(resolve));
   assert.equal(bodies.at(-1).body.inputs[0].text,script,'only the ElevenLabs request receives performance tags');
   requests.shift()({ok:true,arrayBuffer:async()=>new Uint8Array([4,5,6]).buffer});await pending;
 };
 await record(firstScript);const taggedRequests=bodies.length;
 await service.speakWord(clean,{narrationText:firstScript});assert.equal(bodies.length,taggedRequests,'identical performances reuse their audio');
 await record(secondScript);assert.equal(bodies.length,taggedRequests+1,'changed performance directions regenerate audio');
 assert.ok(cached.has(firstScript+service.getVoiceId())&&cached.has(secondScript+service.getVoiceId()));
 const failed=service.speakWord('باران دەبارێت',{narrationText:'[excited] باران دەبارێت'});await new Promise(resolve=>setImmediate(resolve));
 requests.shift()({ok:false});await failed;assert.equal(spoken.at(-1),'باران دەبارێت','native fallback never reads tags aloud');
 mocks['react-native'].Platform.OS='web';service.setElevenLabsApiKey('');
 let browserFallback='';global.SpeechSynthesisUtterance=class{constructor(text){browserFallback=text;}};
 fakeWindow.speechSynthesis.speak=utterance=>utterance.onend?.();
 let missing=0;
 await service.speakWord('مانگ دەرکەوت',{narrationText:'[softly] مانگ دەرکەوت',onError:()=>missing++});
 assert.equal(browserFallback,'','offline mode never invokes a network-backed browser voice');
 assert.equal(missing,1,'missing offline recordings fail explicitly');
 delete global.SpeechSynthesisUtterance;
 console.log('PASS: explicit development requests keep performance caches separate; installed offline mode reports missing assets without device speech. No live requests.');
 mocks['react-native'].Platform.OS='ios';
 const lessonText='یەک ڕستە. دوو ڕستە.\nسێ ڕستە؟';
 const chunks=playback.learningStoryChunks('pacing-test',1,lessonText);
 assert.equal(chunks.length,3,'sentences and verse lines are played separately');
 for(const chunk of chunks)bundled[chunk.narrationText+service.getVoiceId()]=999;
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 const resume=async()=>{const [id,timer]=waits.entries().next().value;waits.delete(id);assert.equal(timer.ms,1800);timer.fn();await tick();};
 let storyEnded=0,storyErrors=0;const beforeStory=plays;
 await service.speakStory('pacing-test',1,lessonText,{onEnd:()=>storyEnded++,onError:()=>storyErrors++});
 assert.equal(plays,beforeStory+1);assert.equal(rates.at(-1).rate,0.7,'learning narration plays at 70% speed');
 const firstListener=listeners.at(-1);firstListener({didJustFinish:true});firstListener({didJustFinish:true});
 assert.equal(waits.size,1,'duplicate completion does not queue multiple sentences');
 assert.equal(plays,beforeStory+1,'the next sentence cannot start before the silence elapses');
 assert.equal(storyEnded,0,'a sentence ending is not the end of the page');
 await resume();assert.equal(plays,beforeStory+2);
 listeners.at(-1)({didJustFinish:true});const stale=[...waits.values()][0].fn;
 await service.stopSpeaking();assert.equal(waits.size,0,'stop clears the pending silence timer');stale();await tick();
 assert.equal(plays,beforeStory+2,'stale timers cannot resume a stopped page');assert.equal(storyEnded,0);
 await service.speakStory('pacing-test',1,lessonText,{onEnd:()=>storyEnded++});
 for(let i=0;i<3;i++){listeners.at(-1)({didJustFinish:true});if(i<2)await resume();}
 assert.equal(storyEnded,1,'finish only after the last sentence has actually completed');assert.equal(waits.size,0);
 await service.speakStory('pacing-test',1,lessonText,{onError:()=>storyErrors++});
 listeners.at(-1)({error:true});assert.equal(storyErrors,1);assert.equal(waits.size,0,'playback errors do not advance');
 await service.speakStory('pacing-test',1,lessonText);listeners.at(-1)({didJustFinish:true});
 const interrupted=[...waits.values()][0].fn;await service.speakWord('نان');const afterWord=plays;interrupted();await tick();
 assert.equal(waits.size,0);assert.equal(plays,afterWord,'tapping a word cancels the story sequence');
 console.log('PASS: 0.7× story audio, exact 1800 ms sentence gaps, finish-after-last, errors and cancellation during silence. No real timers or API calls.');
 const letters=mocks['../data/mockLetters'].mockLetters;
 bundled['پیتی.'+service.getVoiceId()]=1001;
 for(const letter of letters)bundled[letter.name+'[literal-letter-v1]'+service.getVoiceId()]=1002;
 for(const letter of letters){
   const start=plays;let complete=0;
   await service.speakWord(`پیتی ${letter.name}`,{onEnd:()=>complete++});
   assert.equal(plays,start+1);listeners.at(-1)({didJustFinish:true});
   assert.equal(plays,start+1,'the letter cannot merge into the introduction');assert.equal(complete,0);
   const [id,timer]=waits.entries().next().value;waits.delete(id);assert.equal(timer.ms,300);timer.fn();await tick();
   assert.equal(plays,start+2);listeners.at(-1)({didJustFinish:true});assert.equal(complete,1);
 }
 await service.speakWord('د',{letterName:'د'});listeners.at(-1)({didJustFinish:true});
 const pendingLetter=[...waits.values()][0].fn;await service.speakWord('ر');const afterSwitch=plays;
 pendingLetter();await tick();assert.equal(plays,afterSwitch,'switching letters cancels the previous isolated letter');
 await service.stopSpeaking();
 delete bundled['پیتی.'+service.getVoiceId()];delete bundled['د[literal-letter-v1]'+service.getVoiceId()];
 const spokenBefore=spoken.length;let missingLetter=0;await service.speakWord('پیتی د',{onError:()=>missingLetter++});
 assert.equal(spoken.length,spokenBefore,'offline mode never substitutes a device voice');
 assert.equal(missingLetter,1);assert.equal(waits.size,0,'missing letter audio cannot advance the sequence');
 service.setElevenLabsApiKey('unit-test-key');
 bundled['پیتی.'+service.getVoiceId()]=1001;
 const literal=service.speakLetter('د');await tick();
 // The introduction is bundled; release its actual end and the separating gap.
 listeners.at(-1)({didJustFinish:true});
 const [lid,ltimer]=waits.entries().next().value;waits.delete(lid);ltimer.fn();await tick();
 assert.match(bodies.at(-1).url,/text-to-speech\//);
 assert.equal(bodies.at(-1).body.text,'د');assert.equal(bodies.at(-1).body.apply_text_normalization,'off');
 requests.shift()({ok:true,arrayBuffer:async()=>new Uint8Array([7]).buffer});await literal;await tick();await service.stopSpeaking();
 const ranges=[];
 const timed=service.speakWord('دار و گوڵ',{onWord:(start,end)=>ranges.push([start,end])});await tick();
 assert.match(bodies.at(-1).url,/with-timestamps$/);
 const characters=Array.from('دار و گوڵ');
 requests.shift()({ok:true,json:async()=>({audio_base64:'AQID',alignment:{characters,character_start_times_seconds:characters.map((_,i)=>i*.1),character_end_times_seconds:characters.map((_,i)=>(i+1)*.1)}})});
 await timed;listeners.at(-1)({currentTime:.15});assert.deepEqual(ranges.at(-1),[0,3]);
 listeners.at(-1)({currentTime:.75});assert.deepEqual(ranges.at(-1),[6,9]);
 const staleProgress=listeners.at(-1);await service.stopSpeaking();staleProgress({currentTime:.15});assert.equal(ranges.length,2,'stopped audio cannot highlight words');
 const beforeReplay=bodies.length;await service.speakWord('دار و گوڵ',{onWord:(start,end)=>ranges.push([start,end])});assert.equal(bodies.length,beforeReplay,'timed audio and alignment replay together');
 listeners.at(-1)({currentTime:.45});assert.deepEqual(ranges.at(-1),[4,5]);
 console.log('PASS: all 34 letter names use separate introduction/name audio with a 300 ms gap; switching letters cancels stale audio and missing offline letters report errors.');
})().catch(e=>{console.error(e);process.exit(1);});


