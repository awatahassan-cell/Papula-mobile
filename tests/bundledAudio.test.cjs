const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'..'),directory=path.join(root,'assets/audio/cached');
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json')));
const moduleFake={exports:{}};
new Function('exports','module','require',ts.transpileModule(fs.readFileSync(path.join(root,'src/data/bundledAudio.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(moduleFake.exports,moduleFake,asset=>{const file=path.resolve(root,'src/data',asset);assert.ok(fs.existsSync(file));return file;});
const {BUNDLED_AUDIO,LEGACY_AUDIO}=moduleFake.exports;
for(const entry of manifest){const bytes=fs.readFileSync(path.join(directory,entry.file));assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.ok(bytes.toString('ascii',0,3)==='ID3'||bytes[0]===255);if(entry.source==='browser'){assert.ok(BUNDLED_AUDIO[entry.key]);assert.equal(JSON.parse(entry.key)[1],entry.text);}else assert.ok(LEGACY_AUDIO[entry.legacyKey]);}
assert.equal(Object.keys(BUNDLED_AUDIO).length,manifest.filter(m=>m.source==='browser').length);
assert.equal(Object.keys(LEGACY_AUDIO).length,manifest.filter(m=>m.source==='legacy').length);
assert.ok(!/sk_[a-zA-Z0-9]{20}/.test(fs.readFileSync(path.join(root,'src/services/soundService.ts'),'utf8')),'source must not contain a literal API credential');
console.log(`PASS: ${manifest.length} independent MP3 files, static Metro imports, complete manifest and byte/hash validation.`);
