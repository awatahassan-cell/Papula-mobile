const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const moduleFake={exports:{}};
new Function('exports','module','require',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/services/audioCache.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(moduleFake.exports,moduleFake,()=>({default:{}}));
const {AudioCache,bytesToBase64,base64ToBytes,audioCacheKey}=moduleFake.exports;
const items=new Map(),storage={getItem:async key=>items.get(key)||null,setItem:async(key,value)=>items.set(key,value)};
const uri='data:audio/mpeg;base64,AQID';
(async()=>{
 for(let size=0;size<50;size++){const bytes=Uint8Array.from({length:size},(_,i)=>(i*71)%256);assert.equal(bytesToBase64(bytes),Buffer.from(bytes).toString('base64'));assert.deepEqual(base64ToBytes(bytesToBase64(bytes)),bytes);}
 assert.notEqual(audioCacheKey('نان','a'),audioCacheKey('نان','b'));assert.notEqual(audioCacheKey('نان','a'),audioCacheKey('نان','a','other-model'));
 const cache=new AudioCache(storage,2,1000);assert.equal(await cache.put('a',uri),true);assert.equal(await new AudioCache(storage).get('a'),uri,'persistent across app instances');
 await cache.put('b',uri);await cache.put('c',uri);assert.equal(await cache.count(),2);assert.equal(await cache.get('a'),null);
 const large=new AudioCache(storage);assert.equal(await large.put('large','data:audio/mpeg;base64,'+'A'.repeat(500000)),true);
 assert.equal(await cache.put('bad','data:audio/mpeg;base64,'),false);assert.equal(await cache.put('bad','https://example.com/audio.mp3'),false);
 const fail=new AudioCache({getItem:async()=>null,setItem:async()=>{throw Error('disk full');}});assert.equal(await fail.put('a',uri),false);assert.equal(await fail.get('a'),null);
 assert.equal(await new AudioCache({getItem:async()=>'{bad',setItem:async()=>{}}).count(),0);
 const bounded=new AudioCache(storage,64,uri.length);await bounded.put('d',uri);assert.equal(await bounded.count(),1);
 console.log('PASS: portable audio encoding, persistent offline cache, voice/model isolation, bounded eviction, corrupted data and storage failures. No live API calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
