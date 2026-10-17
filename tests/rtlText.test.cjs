const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const load = require('../scripts/story-narration-catalog.cjs').createLoader();
const { ibmTextStyle } = load(path.resolve(__dirname, '../src/theme/typography.ts'));

let fontContext;
const react = { forwardRef: render => render,
  createContext: value => fontContext = { value, Provider: 'FontProvider' }, useContext: context => context.value,
  createElement: (type, props, ...children) => ({ type, props: { ...props, ...(children.length ? { children: children[0] } : {}) } }) };
react.default = react;
const native = { Platform: { OS: 'web' }, Text: 'Text', TextInput: 'TextInput', StyleSheet: { create: value => {
  // RN Web removes this property and logs a development error when registered.
  for (const style of Object.values(value)) assert.ok(!('direction' in style), 'keep layout direction outside StyleSheet.create');
  return value;
}, flatten: value => value } };
const mod = { exports: {} };
const source = fs.readFileSync(path.join(__dirname, '../src/components/RTLText.tsx'), 'utf8');
new Function('exports', 'module', 'require', ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText)(mod.exports, mod, name => name === 'react' ? react : name.endsWith('/typography') ? { ibmTextStyle }
  : name.endsWith('/rtl') ? { rtlProps: { dir: 'rtl' } } : native);

test('RTL applies to mixed text and inputs while preserving centering, refs and handlers', () => {
  const unwrap = element => element.type === 'FontProvider' ? element.props.children : element;
  for (const name of ['Text', 'TextInput']) {
    const ref = {};
    const onPress = () => {};
    const element = unwrap(mod.exports[name]({ style: { textAlign: 'center', writingDirection: 'ltr' }, children: 'سڵاو 12! 🌱', onPress }, ref));
    const style = Object.assign({}, ...element.props.style);
    assert.equal(style.textAlign, 'center');
    assert.equal(style.writingDirection, 'rtl');
    assert.equal(style.direction, 'rtl');
    assert.equal(element.props.dir, 'rtl');
    assert.equal(style.fontFamily, 'IBMPlexSansArabic_400Regular');
    assert.equal(element.props.ref, ref);
    assert.equal(element.props.onPress, onPress);
    assert.equal(element.props.children, 'سڵاو 12! 🌱');
    assert.equal(Object.assign({}, ...unwrap(mod.exports[name]({}, ref)).props.style).textAlign, 'right');
  }
});

test('nested highlighted letters retain their parent paragraph weight', () => {
  const parent = mod.exports.Text({ style: { fontWeight: '700' }, children: 'دار' }, {});
  fontContext.value = parent.props.value;
  const child = mod.exports.Text({ style: { color: '#ff795d' }, children: 'د' }, {}).props.children;
  assert.equal(Object.assign({}, ...child.props.style).fontFamily, 'IBMPlexSansArabic_700Bold');
  fontContext.value = {};
});

test('all text weights use real IBM faces, including legacy font names and unstyled labels', () => {
  for (const [input, expected] of [[{}, '400Regular'], [{ fontWeight: '900' }, '700Bold'], [{ fontWeight: 'bold' }, '700Bold'],
    [{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }, '600SemiBold'], [{ fontWeight: '500' }, '500Medium']]) {
    assert.equal(ibmTextStyle(input).fontFamily, 'IBMPlexSansArabic_' + expected);
  }
  const layout = fs.readFileSync(path.resolve(__dirname, '../src/app/_layout.tsx'), 'utf8');
  assert.ok(!layout.includes('Vazirmatn'), 'IBM must never be an alias for a different font');
  const html = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  assert.ok(!html.includes('fonts.googleapis.com'), 'web must use the same bundled fonts offline');
  assert.ok(!/font-family:[^;]+!important/.test(html), 'web must not override the selected static font face');
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
});

test('on phones right-aligned Kurdish text follows its own direction; centred text stays centred', () => {
  native.Platform.OS = 'android';
  try {
    const unwrap = element => element.type === 'FontProvider' ? element.props.children : element;
    const flat = style => Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
    assert.equal(flat(unwrap(mod.exports.Text({ style: { textAlign: 'right' } }, null)).props.style).textAlign, 'auto');
    assert.equal(flat(unwrap(mod.exports.Text({ style: { textAlign: 'center' } }, null)).props.style).textAlign, 'center');
    assert.equal(flat(unwrap(mod.exports.Text({}, null)).props.style).textAlign, 'auto');
  } finally { native.Platform.OS = 'web'; }
});
