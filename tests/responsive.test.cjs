const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const file=path.join(__dirname,'../src/theme/responsive.ts');
const mod={exports:{}};
new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod.exports,mod,p=>p==='react-native'?{useWindowDimensions:()=>({width:0,height:0})}:require(p));
const {responsive,writingBoardSide}=mod.exports;
const phone=responsive(390,844),tabletP=responsive(768,1024),tabletL=responsive(1024,768);
assert.deepEqual([phone.tablet,phone.wide],[false,false]);
assert.deepEqual([tabletP.tablet,tabletP.wide,tabletP.landscape],[true,false,false]);
assert.deepEqual([tabletL.tablet,tabletL.wide,tabletL.landscape],[true,true,true]);
assert.ok(tabletL.pageMax>840&&phone.pageMax===840,'wide pages may grow past the phone column');
// the board never overflows its container and grows on tablets
assert.ok(writingBoardSide(phone)<=390-40);
assert.equal(writingBoardSide(phone),350);
assert.ok(writingBoardSide(tabletP)>writingBoardSide(phone));
const side=writingBoardSide(tabletL);assert.ok(side>=280&&side<=560&&side<=768-300,'landscape board must fit beside the controls: '+side);
assert.ok(writingBoardSide(responsive(320,568))>=160);
console.log('PASS: responsive helpers');
