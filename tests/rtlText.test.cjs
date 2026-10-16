const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const react = { forwardRef: render => render, createElement: (type, props) => ({ type, props }) };
react.default = react;
const native = { Text: 'Text', TextInput: 'TextInput', StyleSheet: { create: value => value } };
const mod = { exports: {} };
const source = fs.readFileSync(path.join(__dirname, '../src/components/RTLText.tsx'), 'utf8');
new Function('exports', 'module', 'require', ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText)(mod.exports, mod, name => name === 'react' ? react : native);

test('RTL applies to mixed text and inputs while preserving centering, refs and handlers', () => {
  for (const name of ['Text', 'TextInput']) {
    const ref = {};
    const onPress = () => {};
    const element = mod.exports[name]({ style: { textAlign: 'center', writingDirection: 'ltr' }, children: 'سڵاو 12! 🌱', onPress }, ref);
    const style = Object.assign({}, ...element.props.style);
    assert.equal(style.textAlign, 'center');
    assert.equal(style.writingDirection, 'rtl');
    assert.equal(style.direction, 'rtl');
    assert.equal(element.props.ref, ref);
    assert.equal(element.props.onPress, onPress);
    assert.equal(element.props.children, 'سڵاو 12! 🌱');
    assert.equal(Object.assign({}, ...mod.exports[name]({}, ref).props.style).textAlign, 'right');
  }
});

test('all screens and shared components use RTL text primitives', () => {
  function inspect(file) {
    const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) || node.moduleSpecifier.text !== 'react-native') continue;
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        assert.ok(!bindings.elements.some(item => ['Text', 'TextInput'].includes(item.name.text)), file);
      }
    }
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.tsx') && entry.name !== 'RTLText.tsx') inspect(file);
    }
  }
  walk(path.join(__dirname, '../src'));
  inspect(path.join(__dirname, '../App.tsx'));
});
