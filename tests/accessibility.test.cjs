const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'..','src');
function walk(dir,out=[]){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file,out);else if(file.endsWith('.tsx'))out.push(file);}return out;}
const problems=[];
for(const file of walk(root)){
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  (function visit(node){
    if(ts.isJsxElement(node)&&['TouchableOpacity','Pressable','TouchableHighlight'].includes(node.openingElement.tagName.getText())){
      const names=node.openingElement.attributes.properties.map(a=>a.name?.getText());
      const labelled=names.includes('accessibilityLabel')||names.includes('aria-label');
      let text=false;
      (function inside(x){
        if(ts.isJsxElement(x)&&/^(Text|BigButton)$/.test(x.openingElement.tagName.getText()))text=true;
        if(ts.isJsxText(x)&&x.getText().trim())text=true;
        if(ts.isJsxExpression(x)&&x.expression&&(ts.isStringLiteral(x.expression)||ts.isTemplateExpression(x.expression)))text=true;
        ts.forEachChild(x,inside);
      })(node);
      if(!labelled&&!text)problems.push(path.relative(root,file)+':'+(sf.getLineAndCharacterOfPosition(node.getStart()).line+1));
    }
    ts.forEachChild(node,visit);
  })(sf);
}
test('every icon-only button has an accessibility label',()=>assert.deepEqual(problems,[],'icon-only buttons without a label: '+problems.join(', ')));
function test(name,fn){try{fn();console.log('PASS: '+name);}catch(e){console.error('FAIL: '+name);throw e;}}
