const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'..');
const profileData=JSON.stringify([{id:'child-1',masteredLetterIds:['dal'],stars:23}]);
const oldSettings={dailyLimitMinutes:45,bedtimeLockEnabled:true,soundFxEnabled:false,narrationVolume:0.4,isSubscribed:false,activePlan:'none',language:'sorani'};
const storage=new Map([['papoole_child_profiles_v1',profileData],['papoole_parent_settings_v1',JSON.stringify(oldSettings)]]);
const asyncStorage={getItem:async key=>storage.get(key)??null,setItem:async(key,value)=>storage.set(key,value)};
function loader(){
 const cache=new Map();
 function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file);
  const mod={exports:{}};cache.set(file,mod.exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  new Function('exports','module','require',code)(mod.exports,mod,p=>p.endsWith('.webp')?1:p==='@react-native-async-storage/async-storage'?asyncStorage:p.endsWith('.json')?JSON.parse(fs.readFileSync(path.resolve(path.dirname(file),p),'utf8')):load(path.resolve(path.dirname(file),p+'.ts')));
  cache.set(file,mod.exports);return mod.exports;
 }return load;
}
(async()=>{
 let load=loader();let repo=load(root+'/src/services/repositories.ts').authRepo;
 const previous=await repo.getParentSettings();assert.equal(previous.appearanceTheme,'cloud','old installs get the new default palette');assert.equal(previous.appearanceMode,'auto');
 for(const [key,value] of Object.entries(oldSettings))assert.equal(previous[key],value,'old preference '+key+' preserved');
 await repo.saveParentSettings({...previous,appearanceTheme:'cloud'});
 load=loader();repo=load(root+'/src/services/repositories.ts').authRepo;
 assert.equal((await repo.getParentSettings()).appearanceTheme,'cloud','theme survives application restart');
 await repo.saveParentSettings({...await repo.getParentSettings(),appearanceTheme:'classic'});
 assert.equal((await loader()(root+'/src/services/repositories.ts').authRepo.getParentSettings()).appearanceTheme,'cloud','legacy classic maps to the default palette');
 for(const [legacy,expected] of [['garden','cloud'],['lavender','cloud'],['sky','lagoon'],['rose','blossom'],['sunset','blossom']]){storage.set('papoole_parent_settings_v1',JSON.stringify({...oldSettings,appearanceTheme:legacy}));assert.equal((await loader()(root+'/src/services/repositories.ts').authRepo.getParentSettings()).appearanceTheme,expected,'legacy '+legacy+' migrates to '+expected);}
 storage.set('papoole_parent_settings_v1',JSON.stringify({...oldSettings,appearanceTheme:'unknown-future-theme',appearanceMode:'sometimes'}));
 {const safe=await loader()(root+'/src/services/repositories.ts').authRepo.getParentSettings();assert.equal(safe.appearanceTheme,'cloud','unknown theme falls back safely');assert.equal(safe.appearanceMode,'auto','unknown mode falls back safely');}
 assert.equal(storage.get('papoole_child_profiles_v1'),profileData,'migrating appearance never changes child progress');
 const {resolveAppearanceStyles,appearanceThemes,normalizeAppearanceTheme,getAppearanceColors}=load(root+'/src/theme/appearance.ts');
 assert.equal(appearanceThemes.length,3,'parents choose between three palettes');
 const luminance=color=>{const rgb=color.match(/[a-f0-9]{2}/gi).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
 for(const theme of appearanceThemes){assert.ok(1.05/(luminance(theme.colors.mint)+.05)>=4.5,'white control labels remain readable in '+theme.id+' day');assert.ok(1.05/(luminance(theme.night.mint)+.05)>=3,'white labels on large night buttons stay readable in '+theme.id);assert.ok(luminance(theme.night.background)<.05&&luminance(theme.night.ink)>.7,theme.id+' night is dark with light text');assert.ok(luminance(theme.colors.background)>.7&&luminance(theme.colors.ink)<.1,theme.id+' day is light with dark text');}
 assert.equal(normalizeAppearanceTheme({toString:()=> 'sky'}),'cloud','malformed saved themes fall back safely');
 const {normalizeAppearanceMode,resolveAppearanceMode}=load(root+'/src/theme/appearance.ts');
 assert.equal(normalizeAppearanceMode('night'),'night');assert.equal(normalizeAppearanceMode(7),'auto');
 assert.equal(resolveAppearanceMode('auto',new Date('2026-10-16T12:00:00')),'day');assert.equal(resolveAppearanceMode('auto',new Date('2026-10-16T19:00:00')),'night');assert.equal(resolveAppearanceMode('auto',new Date('2026-10-16T05:59:00')),'night');assert.equal(resolveAppearanceMode('auto',new Date('2026-10-16T06:00:00')),'day');assert.equal(resolveAppearanceMode('day',new Date('2026-10-16T23:00:00')),'day','a parent choice always wins');
 for(const theme of appearanceThemes){
  assert.equal(normalizeAppearanceTheme(theme.id),theme.id);
  await repo.saveParentSettings({...await repo.getParentSettings(),appearanceTheme:theme.id});
  const restarted=await loader()(root+'/src/services/repositories.ts').authRepo.getParentSettings();
  assert.equal(restarted.appearanceTheme,theme.id,'each parent-selected palette survives restart');
  assert.equal(restarted.dailyLimitMinutes,oldSettings.dailyLimitMinutes);
  await repo.saveParentSettings({...await repo.getParentSettings(),appearanceMode:'night'});
  assert.equal((await loader()(root+'/src/services/repositories.ts').authRepo.getParentSettings()).appearanceMode,'night','night mode survives restart');
  for(const mode of ['day','night']){
   const colors=getAppearanceColors(theme.id,mode);
   const styled=resolveAppearanceStyles({primary:{backgroundColor:'#23875f'},label:{color:'#ffffff'},text:{color:'#243b3a'},glyph:{fontSize:104,writingDirection:'rtl',color:'#243b3a'},card:{backgroundColor:'#ffffff',borderRadius:20},boardFrame:{backgroundColor:'#fffef7'}},theme.id,mode);
   assert.equal(styled.primary.backgroundColor,colors.mint);assert.equal(styled.label.color,'#ffffff');
   assert.equal(styled.text.color,colors.ink,'text follows the palette ink in '+mode);assert.equal(styled.card.backgroundColor,colors.paper,'cards follow the palette paper in '+mode);
   assert.equal(styled.card.borderRadius,30,'cards are large and soft');assert.equal(styled.card.borderBottomWidth,1.5,'no chunky card edge');
   assert.equal(styled.boardFrame.backgroundColor,'#fffdf5','the writing sheet stays light in '+mode);
   assert.equal(styled.glyph.fontSize,104);assert.equal(styled.glyph.writingDirection,'rtl');
  }
 }
 assert.equal(new Set(appearanceThemes.map(theme=>theme.colors.mint)).size,3,'all three palettes visibly differ');assert.equal(new Set(appearanceThemes.map(theme=>theme.night.background)).size,3,'night palettes differ too');
 assert.equal(storage.get('papoole_child_profiles_v1'),profileData,'choosing palettes preserves child progress');
 const original=Object.freeze({board:Object.freeze({width:460,height:460,borderRadius:22,backgroundColor:'#fffef7',overflow:'hidden'}),paragraph:Object.freeze({writingDirection:'rtl',textAlign:'right',fontFamily:'IBMPlexSansArabic_700Bold',fontSize:26,color:'#1e293b'}),buttonText:Object.freeze({color:'#ffffff'})});
 assert.deepEqual(resolveAppearanceStyles(original,'classic'),resolveAppearanceStyles(original,'garden'),'both saved settings migrate to one design');
 const garden=resolveAppearanceStyles(original,'garden');
 assert.equal(garden.board.width,460);assert.equal(garden.board.height,460);
 assert.equal(garden.paragraph.writingDirection,'rtl');assert.equal(garden.paragraph.textAlign,'right');
 assert.equal(garden.paragraph.fontFamily,original.paragraph.fontFamily);assert.equal(garden.paragraph.fontSize,26);
 assert.equal(garden.buttonText.color,'#ffffff','filled-button labels keep contrast');
 assert.equal(original.paragraph.color,'#1e293b','original styles are not mutated');
 console.log('PASS: three palettes x day/night; legacy themes migrate; child progress, RTL, glyph typography and writing board geometry remain intact.');
})().catch(error=>{console.error(error);process.exitCode=1;});
