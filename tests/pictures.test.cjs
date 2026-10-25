const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const load=require('../scripts/story-narration-catalog.cjs').createLoader();
const { PICTURES, pictureFor }=load(path.resolve(__dirname,'../src/art/pictures.ts'));

test('every picture is a single emoji key and a complete 100x100 SVG', () => {
  const keys = Object.keys(PICTURES);
  assert.ok(keys.length >= 45, 'the first set of pictures is in place');
  for (const key of keys) {
    assert.ok(!/️/.test(key), `keys have no variation selector: ${key}`);
    assert.equal(Array.from(key).length, 1, `one character per key: ${key}`);
    const svg = PICTURES[key];
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">') && svg.endsWith('</svg>'), key);
    for (const tag of svg.match(/<ellipse[^>]*>/g) || []) assert.ok(/ rx="/.test(tag) && / ry="/.test(tag), `ellipse needs rx and ry in ${key}: ${tag}`);
    assert.equal((svg.match(/</g) || []).length, (svg.match(/>/g) || []).length, `brackets match in ${key}`);
    assert.equal((svg.match(/<g[ >]/g) || []).length, (svg.match(/<\/g>/g) || []).length, `groups close in ${key}`);
  }
});

test('lookup ignores the variation selector used by some emoji', () => {
  assert.equal(pictureFor('☀️'), PICTURES['☀']);
  assert.equal(pictureFor('🦁'), PICTURES['🦁']);
  assert.equal(pictureFor('🧭'), undefined, 'undrawn emoji fall back to text');
});
