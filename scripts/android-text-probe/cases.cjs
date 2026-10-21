const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=require('../story-narration-catalog.cjs').createLoader();
const {androidLetterHighlightRuns}=load(path.join(root,'src/services/letterHighlight.ts'));
const cases=[['یاری','ی'],['دیاری','ا'],['منداڵ','د'],['پەپوولە','پ'],['گەڵاوێژگان','ا'],['بێری','ێ'],['کوردی','ک'],['سیری','ی']]
  .map(([text,glyph])=>({text,runs:androidLetterHighlightRuns(text,glyph)}));
const output=path.join(root,'work/joining-probe');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'cases.json'),JSON.stringify(cases));
