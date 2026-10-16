const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
let held = false;
const flatten = style => Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style || {};
const react = { forwardRef: fn => fn, useState: () => [held, value => held = value], createElement: (type, props) => ({ type, props }) };
react.default = react;
const native = { TouchableOpacity: 'Button', StyleSheet: { flatten } };
const mod = { exports: {} };
new Function('exports', 'module', 'require', ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/components/TactileButton.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText)(mod.exports, mod, name => name === 'react' ? react : native);
const Button = mod.exports.TactileButton;

test('holding a raised button sinks its face into the lip while its bottom edge and neighbours stay put; release restores it', () => {
  held = false;
  let ins = 0, outs = 0;
  const style = { minHeight: 58, borderBottomWidth: 5, marginBottom: 2, backgroundColor: '#ffd43b', borderBottomColor: '#e5a91c', transform: [{ translateX: 10 }] };
  const props = { style, onPressIn: () => ins++, onPressOut: () => outs++ };
  const ref = {};
  let button = Button(props, ref);
  button.props.onPressIn({}); button = Button(props, ref);
  const pressed = flatten(button.props.style);
  assert.deepEqual(pressed.transform, [{ translateX: 10 }, { translateY: 4 }]);
  assert.equal(pressed.borderBottomWidth, 1, 'the lip thins to a hairline');
  assert.equal(pressed.minHeight, 54, 'the face is shorter by what it sank');
  assert.equal(pressed.marginBottom, 6, 'layout space is kept so neighbours do not move');
  assert.equal(pressed.borderBottomColor, style.borderBottomColor, 'the lip keeps its darker colour');
  assert.equal(pressed.shadowOpacity, 0);
  assert.equal(button.props.ref, ref);
  button.props.onPressOut({}); button = Button(props, ref);
  assert.deepEqual(flatten(button.props.style), style);
  assert.equal(ins, 1); assert.equal(outs, 1);
});

test('disabled buttons stay still; release also resets a cancelled press', () => {
  held = false;
  let presses = 0;
  const props = { disabled: true, style: { minHeight: 44 }, onPressIn: () => presses++ };
  Button(props, {}).props.onPressIn({});
  assert.equal(held, false); assert.equal(presses, 0);
  held = true;
  assert.deepEqual(flatten(Button(props, {}).props.style), props.style);
  Button({ style: props.style }, {}).props.onPressOut({});
  assert.equal(held, false);
});
