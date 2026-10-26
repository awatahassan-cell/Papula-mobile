const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx$/.test(e.name) && !/app[\\/]/.test(path.join(dir, e.name)) ? [path.join(dir, e.name)] : []);
const ui = walk(path.join(__dirname, '../src')).map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Every screen a child or parent should be able to open must have a button that leads to it.
// (A navigation change once removed the only buttons to the games and to the practice screen.)
test('every main screen has a way in from the interface', () => {
  const reachable = route => new RegExp(`setRoute\\('${route}'\\)|route: '${route}'`).test(ui);
  for (const route of ['alphabet', 'garden', 'stories', 'match-game', 'daily-practice', 'stickers', 'parent-dashboard', 'word-writing', 'garden-quest', 'writing', 'my-words']) {
    assert.ok(reachable(route), `no button opens ${route}`);
  }
});

test('the bottom tabs include the games', () => {
  const nav = fs.readFileSync(path.join(__dirname, '../src/components/GardenNavigation.tsx'), 'utf8');
  for (const route of ['home', 'alphabet', 'match-game', 'garden', 'stories']) assert.ok(nav.includes(`route: '${route}'`), route);
  const store = fs.readFileSync(path.join(__dirname, '../src/store/useAppStore.tsx'), 'utf8');
  assert.ok(/MAIN_TABS: AppRoute\[\] = \[[^\]]*'match-game'/.test(store), 'games behave like a main tab for the back button');
});
