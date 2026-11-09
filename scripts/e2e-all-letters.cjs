#!/usr/bin/env node
// 🦋 Papula end-to-end walk: plays the app the way a small child would, letter after letter,
// and writes a report (Markdown + HTML + screenshots) of what worked and what did not.
//
//   npx expo export --platform web --output-dir dist-e2e     build the web app once (about 2 minutes)
//   node scripts/e2e-all-letters.cjs                         every letter, headless (the default build folder is dist-e2e)
//   node scripts/e2e-all-letters.cjs --letters=3             only the first 3 letters (quick check)
//   node scripts/e2e-all-letters.cjs --build                 build first, then walk
//   node scripts/e2e-all-letters.cjs --headed --slow=300     watch it in a real browser window
//   node scripts/e2e-all-letters.cjs --phone=360x740         another screen size (default 390x844)
//   node scripts/e2e-all-letters.cjs --out=e2e-report        where the report goes (default e2e-report/)
//   node scripts/e2e-all-letters.cjs --url=http://localhost:8081   use a server that is already running
//
// Needs Playwright (`npm i -D playwright` once, or the one already installed). Sound cannot be heard here: the walk only
// checks that every screen opens, every right answer is accepted, the flower is planted and the garden grows.
// Exit code 0 = every letter finished; 1 = at least one letter failed.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => { const hit = args.find(a => a.startsWith(`--${name}=`)); return hit ? hit.slice(name.length + 3) : fallback; };
const flag = name => args.includes(`--${name}`);
const MAX_LETTERS = Number(opt('letters', 999)), SLOW = Number(opt('slow', 0)), OUT = path.resolve(root, opt('out', 'e2e-report'));
const [W, H] = opt('phone', '390x844').split('x').map(Number);
const DIST = path.resolve(root, opt('dist', 'dist-e2e'));
const NAME = 'ئاری';

// ---------- tiny terminal helpers ----------
const tty = process.stdout.isTTY;
const c = (code, text) => tty ? `\x1b[${code}m${text}\x1b[0m` : text;
const green = t => c('32', t), red = t => c('31', t), yellow = t => c('33', t), dim = t => c('2', t), bold = t => c('1', t), cyan = t => c('36', t);
const say = (...lines) => console.log(...lines);
const wait = ms => new Promise(res => setTimeout(res, ms));

// ---------- static server for the exported web app (single page app fallback) ----------
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon', '.wav': 'audio/wav' };
function serve(dir) {
  const server = http.createServer((req, res) => {
    let file = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

// ---------- what the walk looks for ----------
// Buttons that are part of the frame, never an answer.
const CHROME = /ڕێنمای|ئەستێرە|ئەلبوومەکەم|وەستاندن|گەڕانەوە|گەشتەکەم|ڕێڕەو|^یاری|^چیرۆک|^باخچەکەم$|پەپوولە، سەرەتا|ڕێکخستن|وشەکانم|دووبارە ببیستە|چیرۆکی پیتەکە|مەشقی نووسین|دووبارە یاری بکەم|نووسین$/;
const T = {
  cta: /^بەردەوامبوون لە گەشت/, start: 'دەست پێ بکە', next: 'بڕۆین بۆ هەنگاوی دواتر', plant: 'گوڵەکەم بچێنم', seeGarden: 'باخچەکەم ببینم',
  later: 'دواتر دەیکەم', cheer: 'ئافەرین!', home: 'گەشتەکەم',
};
const KU_DIGITS = '٠١٢٣٤٥٦٧٨٩';
// The task's heading: the second part of the page text (after the star count). A wrong tap changes other words, not this one.
const title = t => String(t).split(' | ')[1] || '';
const toNumber = text => Number(String(text).replace(/[٠-٩]/g, d => KU_DIGITS.indexOf(d)).replace(/[^\d]/g, '')) || 0;

async function main() {
  say(`\n  ${bold('🦋 Papula — walk through every letter')}`);
  if (flag('build') || !fs.existsSync(path.join(DIST, 'index.html'))) {
    if (opt('url')) { /* an external server is used */ } else {
      say(`  ${dim('Building the web app (about 2 minutes)…')}`);
      const built = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', DIST], { cwd: root, stdio: 'inherit' });
      if (built.status !== 0) throw new Error('The web build failed.');
    }
  }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { throw new Error('Playwright is missing. Install it once with: npm i -D playwright'); }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const local = opt('url') ? null : await serve(DIST);
  const base = opt('url') || local.url;

  const browser = await chromium.launch({ headless: !flag('headed'), slowMo: SLOW });
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
  // The app opens one new letter a day. The walk moves its own clock forward a day per letter (the real clock is untouched).
  await context.addInitScript(() => {
    const RealDate = Date, days = () => Number(localStorage.getItem('__e2eDays') || 0) * 86400000;
    class FakeDate extends RealDate { constructor(...a) { if (a.length === 0) super(RealDate.now() + days()); else super(...a); } static now() { return RealDate.now() + days(); } }
    window.Date = FakeDate;
  });
  const page = await context.newPage();
  page.setDefaultTimeout(3500);
  const problems = [];             // console errors and crashes, tagged with the letter being played
  let current = 'start';
  page.on('pageerror', e => problems.push({ letter: current, kind: 'crash', text: e.message.slice(0, 200) }));
  page.on('console', m => { if (m.type() === 'error' && !/audio|play\(\)|autoplay|favicon|net::ERR|404/i.test(m.text())) problems.push({ letter: current, kind: 'console', text: m.text().slice(0, 200) }); });

  const text = () => page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | '));
  const labels = () => page.getByRole('button').evaluateAll(list => list.map(x => (x.getAttribute('aria-label') || x.innerText || '').trim()).filter(Boolean));
  const has = async name => (await page.getByRole('button', { name, exact: true }).count()) + (await page.getByRole('tab', { name, exact: true }).count()) > 0;
  const press = async (name, exact = true) => {
    for (const role of ['button', 'tab']) {                      // the bottom bar items are tabs, everything else is a button
      try { await page.getByRole(role, { name, exact }).last().click({ force: true, timeout: 1500 }); return true; } catch { /* try the next role */ }
    }
    return false;
  };
  let shotCount = 0;
  const shot = async label => { const file = `shots/${String(++shotCount).padStart(3, '0')}-${label.replace(/[^\w؀-ۿ-]+/g, '_')}.png`; await page.screenshot({ path: path.join(OUT, file) }).catch(() => {}); return file; };

  // ---------- first start: welcome, name, age ----------
  await page.goto(base);
  await page.waitForTimeout(5000);
  const guideButtons = page.getByRole('button');
  await guideButtons.last().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.getByPlaceholder('ناوەکەت لێرە بنووسە...').fill(NAME).catch(() => {});
  await page.getByText('دەست پێ بکەین').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  const results = [];
  await shot('home-at-start');

  // ---------- one letter at a time ----------
  for (let n = 1; n <= MAX_LETTERS; n++) {
    await page.waitForTimeout(500);
    if (n > 1) {                                                   // a new day: reload so the home screen sees it
      await page.evaluate(() => localStorage.setItem('__e2eDays', String(Number(localStorage.getItem('__e2eDays') || 0) + 1)));
      await page.reload(); await page.waitForTimeout(5000);
    }
    if (await has(T.cheer)) await press(T.cheer);                 // a butterfly popup may still be open
    if (!(await has(T.cta))) { await press(T.home); await page.waitForTimeout(1200); }
    if (!(await has(T.cta))) {
      say(`  ${yellow('•')} no "${T.cta}" button any more: ${n === 1 ? 'nothing to play' : 'every letter is finished'}.`);
      break;
    }
    const homeText = await text();
    const ctaLabel = (await labels()).find(l => T.cta.test(l)) || '';
    const glyph = (ctaLabel.match(/پیتی\s+(\S+)/) || homeText.match(/\|\s*([^\s|])\s*\|\s*بەردەوام بین/) || [])[1]?.replace(/[:：،.]+$/, '') || '?';
    current = `#${n} ${glyph}`;
    const t0 = Date.now(), log = { n, glyph, rounds: 0, probes: 0, steps: [], notes: [], shots: [], ok: false, planted: false };
    process.stdout.write(`  ${cyan(String(n).padStart(2))}  letter ${bold(glyph)}  `);

    await press(T.cta);
    await page.waitForTimeout(1500);
    log.shots.push(await shot(`${n}-${glyph}-first-screen`));

    // Play until the flower is planted or nothing moves any more.
    let stuck = 0, last = '', planted = false, lastAnswerScreen = '';
    for (let step = 0; step < 40 && !planted; step++) {
      await page.waitForTimeout(900);
      const now = await text();
      const buttons = await labels();
      if (now === last) stuck++; else stuck = 0;
      last = now;
      if (stuck >= 8) { log.notes.push(`stuck on: ${now.slice(0, 90)}`); log.shots.push(await shot(`${n}-${glyph}-STUCK`)); break; }

      if (buttons.includes(T.seeGarden)) { planted = true; log.steps.push('flower planted'); break; }
      if (buttons.includes(T.plant)) { log.steps.push('finished all rounds'); log.shots.push(await shot(`${n}-${glyph}-flower-ready`)); await press(T.plant); continue; }
      if (buttons.includes(T.next)) { await page.waitForTimeout(300); await press(T.next); log.rounds++; continue; }
      if (buttons.includes(T.start) && !buttons.some(b => /^پیتی /.test(b))) { log.steps.push('letter intro'); await press(T.start); continue; }
      if (buttons.includes(T.cheer)) { await press(T.cheer); continue; }

      // An answer screen: try the options one by one until the right one is taken.
      if (now !== lastAnswerScreen) { await page.waitForTimeout(3500); lastAnswerScreen = now; }   // the app first tells the task aloud; answers open after that
      const options = [...new Set((await labels()).filter(b => b !== T.later && !CHROME.test(b)))];
      if (process.env.E2E_DEBUG) say('      options: ' + JSON.stringify(options));
      if (!options.length) { await page.waitForTimeout(800); continue; }
      let moved = false;
      for (let pass = 0; pass < 3 && !moved; pass++) {       // a wrong tap makes the app pause and show the answer, so go round again
        for (const option of options) {
          await press(option, false);                         // the last button with this name is the answer (the picture card above it has the same label)
          await page.waitForTimeout(700);
          const after = await labels();
          if (after.includes(T.next) || after.includes(T.plant) || after.includes(T.seeGarden) || title((await text())) !== title(now)) { moved = true; break; }
          if (process.env.E2E_DEBUG) say(`      tapped «${option}» → ${(await text()).slice(0, 80)}`);
          log.probes++;
          await page.waitForTimeout(1200);
        }
      }
      if (!moved && buttons.includes(T.later)) { log.notes.push('the listening check was skipped («دواتر دەیکەم»)'); await press(T.later); }
    }

    if (planted) {
      await press(T.seeGarden);
      await page.waitForTimeout(1500);
      if (await has(T.cheer)) { log.steps.push('new butterfly popup'); log.shots.push(await shot(`${n}-${glyph}-butterfly`)); await press(T.cheer); }
      const garden = await text();
      const flowers = toNumber((garden.match(/(\d+|[٠-٩]+)\s*گوڵ/) || [])[1]);
      log.flowers = flowers;
      log.planted = flowers >= n;
      if (!log.planted) log.notes.push(`garden says ${flowers} flowers, expected ${n}`);
      log.shots.push(await shot(`${n}-${glyph}-garden`));
      await press(T.home);
    }
    log.ok = planted && log.planted;
    log.seconds = Math.round((Date.now() - t0) / 1000);
    results.push(log);
    say(`${log.ok ? green('✓ planted') : red('✗ failed')}  ${dim(`${log.seconds}s · ${log.rounds} rounds · ${log.probes} tries`)}${log.notes.length ? '  ' + yellow(log.notes.join('; ')) : ''}`);
    if (!log.ok && results.slice(-3).every(r => !r.ok)) { say(`  ${red('✗')} three letters in a row failed — stopping.`); break; }
  }

  // ---------- the other places a child can go, once ----------
  const extras = [];
  const visit = async (label, tab, wantText) => {
    current = label;
    try {
      if (tab && !(await press(tab))) throw new Error(`no "${tab}" button`);
      await page.waitForTimeout(1500);
      const t = await text();
      const ok = wantText ? wantText.test(t) : true;
      extras.push({ label, ok, shot: await shot(label), note: ok ? '' : `expected ${wantText}` });
    } catch (e) { extras.push({ label, ok: false, shot: await shot(label + '-FAILED'), note: e.message }); }
  };
  await visit('game tab', 'یاری', null);
  await visit('path tab', 'ڕێڕەو', null);
  await visit('stories tab', 'چیرۆک', null);
  await visit('garden tab', 'باخچەکەم', /گوڵ/);
  await visit('album (stickers)', 'ئەلبوومەکەم', /ستیکەر/);
  for (const tabName of ['پەپوولە', 'نیشانە']) {
    try { await page.getByRole('tab', { name: tabName }).click({ force: true }); await page.waitForTimeout(1200); extras.push({ label: `album: ${tabName}`, ok: true, shot: await shot(`album-${tabName}`), note: '' }); }
    catch { extras.push({ label: `album: ${tabName}`, ok: false, shot: '', note: 'tab not found' }); }
  }

  await browser.close();
  if (local) local.server.close();

  // ---------- report ----------
  const done = results.filter(r => r.ok).length;
  const seconds = results.reduce((s, r) => s + (r.seconds || 0), 0);
  const md = [
    `# Papula — walk through every letter`,
    ``,
    `${new Date().toISOString().slice(0, 16).replace('T', ' ')} · screen ${W}×${H} · **${done} of ${results.length} letters finished** · ${Math.round(seconds / 60)} min`,
    ``,
    `| # | Letter | Result | Rounds | Tries | Seconds | Notes |`, `|---|---|---|---|---|---|---|`,
    ...results.map(r => `| ${r.n} | ${r.glyph} | ${r.ok ? '✅' : '❌'} | ${r.rounds} | ${r.probes} | ${r.seconds} | ${r.notes.join('; ') || ''} |`),
    ``, `## Other screens`, ...extras.map(e => `- ${e.ok ? '✅' : '❌'} ${e.label}${e.note ? ` — ${e.note}` : ''}`),
    ``, `## Errors the app printed`, ...(problems.length ? problems.slice(0, 40).map(p => `- (${p.letter}) ${p.kind}: ${p.text}`) : ['none']),
    ``, `_Sound is not checked by this walk. Screenshots are in shots/._`,
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'report.md'), md);

  const esc = s => String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Papula walk</title>
<style>body{font:15px system-ui;margin:0;background:#faf7ff;color:#2d2547}main{max-width:980px;margin:auto;padding:20px}h1{font-size:26px}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0}.sum div{background:#fff;border:1px solid #e3dcf7;border-radius:16px;padding:12px 18px}.sum b{font-size:26px;display:block}
.bad{color:#c0392b}.good{color:#1d8a5b}.card{background:#fff;border:1px solid #e3dcf7;border-radius:18px;padding:14px;margin:12px 0}
.card.fail{border-color:#e9a29a;background:#fff6f5}.shots{display:flex;gap:8px;overflow-x:auto;margin-top:8px}.shots img{height:260px;border-radius:12px;border:1px solid #e3dcf7}
.glyph{font:700 34px 'IBM Plex Sans Arabic',serif;margin-inline-end:10px}small{color:#6d6490}</style><main>
<h1>🦋 Papula — walk through every letter</h1>
<div class="sum"><div><b class="${done === results.length ? 'good' : 'bad'}">${done}/${results.length}</b>letters finished</div><div><b>${results.reduce((s, r) => s + r.probes, 0)}</b>answers tried (the walk does not know the right one, so it tries each)</div><div><b>${problems.length}</b>errors printed</div><div><b>${Math.round(seconds / 60)} min</b>total</div></div>
${results.map(r => `<div class="card ${r.ok ? '' : 'fail'}"><span class="glyph">${esc(r.glyph)}</span>${r.ok ? '<span class="good">✓ flower planted</span>' : '<b class="bad">✗ did not finish</b>'} <small>· #${r.n} · ${r.rounds} rounds · ${r.probes} tries · ${r.seconds}s</small>${r.notes.length ? `<div class="bad">${esc(r.notes.join('; '))}</div>` : ''}<div class="shots">${r.shots.map(s => `<img loading="lazy" src="${s}">`).join('')}</div></div>`).join('')}
<h2>Other screens</h2>${extras.map(e => `<div class="card ${e.ok ? '' : 'fail'}">${e.ok ? '✅' : '❌'} ${esc(e.label)} <small>${esc(e.note)}</small>${e.shot ? `<div class="shots"><img loading="lazy" src="${e.shot}"></div>` : ''}</div>`).join('')}
<h2>Errors the app printed</h2>${problems.length ? '<ul>' + problems.slice(0, 40).map(p => `<li><small>(${esc(p.letter)})</small> ${esc(p.kind)}: ${esc(p.text)}</li>`).join('') + '</ul>' : '<p class="good">none</p>'}
</main>`;
  fs.writeFileSync(path.join(OUT, 'report.html'), html);

  say(`\n  ${bold(done === results.length && results.length ? green('All done') : red('Some letters failed'))}: ${done}/${results.length} letters, ${problems.length} errors printed.`);
  say(`  Report: ${cyan(path.relative(process.cwd(), path.join(OUT, 'report.html')))}  ${dim('(also report.md and shots/)')}\n`);
  process.exitCode = done === results.length && results.length > 0 ? 0 : 1;
}

main().catch(error => { console.error(`\n  ${red('✗')} ${error.message}\n`); process.exit(1); });
