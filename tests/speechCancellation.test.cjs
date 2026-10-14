const fs=require('fs'),assert=require('node:assert/strict');
const ts=require('typescript');
const source=fs.readFileSync(require('path').join(__dirname,'..','src','services','soundService.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const requests=[];let plays=0;const spoken=[];const cached=new Map();const bodies=[];
const bundled={};const mocks={
 '../data/bundledAudio':{BUNDLED_AUDIO:bundled,LEGACY_AUDIO:{}},
 './audioCache':{audioCache:{get:async key=>cached.get(key)||null,put:async(key,uri)=>{cached.set(key,uri);return true;}},audioCacheKey:(text,voice)=>text+voice,bytesToBase64:bytes=>Buffer.from(bytes).toString('base64'),base64ToBytes:text=>new Uint8Array(Buffer.from(text,'base64'))},
 'react-native':{Platform:{OS:'ios'}},
 'expo-audio':{createAudioPlayer:()=>({volume:1,addListener(){},play(){plays++;},pause(){},release(){}})},
 'expo-file-system':{Paths:{cache:'cache'},File:class{constructor(){this.uri='file://test.mp3';}create(){}write(){}delete(){}}},
 'expo-speech':{stop(){},speak(text,options){spoken.push(text);options.onDone?.();}}
};
const moduleFake={exports:{}};
new Function('exports','module','require','fetch',compiled)(moduleFake.exports,moduleFake,name=>mocks[name],(url,options)=>{bodies.push({url,body:JSON.parse(options.body)});return new Promise(resolve=>requests.push(resolve));});
const service=moduleFake.exports.soundService;service.setElevenLabsApiKey('unit-test-key');
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
 assert.equal(plays,1);assert.equal(cached.size,1);
 const count=bodies.length;await service.speakWord('نان');assert.equal(plays,2);assert.equal(bodies.length,count,'cached audio avoids API calls');
 assert.equal(bodies.at(-1).url,'https://api.elevenlabs.io/v1/text-to-dialogue');
 assert.equal(bodies.at(-1).body.model_id,'eleven_v4');assert.equal(bodies.at(-1).body.inputs[0].text,'نان');
 service.setElevenLabsApiKey('');bundled['خۆر'+service.getVoiceId()]=123;const requestsBefore=bodies.length;await service.speakWord('خۆر');assert.equal(plays,3);assert.equal(bodies.length,requestsBefore,'bundled MP3 works without a key or network request');
 console.log('PASS: bundled static MP3 plays without network or API credentials.');
 console.log('PASS: successful Eleven v4 audio persists and replays without another request.');
 console.log('PASS: leaving a screen cancels delayed speech; older replies cannot play after a new request. No live API calls made.');
})().catch(e=>{console.error(e);process.exit(1);});

