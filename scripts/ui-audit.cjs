// UI standards audit of the web export: touch targets under 44px, text under 12px, and the spread of corner radii.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const PORT = process.env.PORT || 8099;
const ROUTES = ['garden', '', 'alphabet', 'stories', 'story-reader', 'match-game', 'writing', 'word-writing', 'letter-detail', 'daily-practice', 'stickers', 'badges', 'my-words', 'parent-dashboard', 'onboarding'];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('papoole_parent_settings_v1', JSON.stringify({ appearanceTheme: 'cloud', appearanceMode: 'day', soundFxEnabled: false, language: 'sorani' })); } catch { /* storage unavailable */ } });
  const radii = {}; let total = 0;
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/${route}`);
    await page.waitForTimeout(4500);
    const r = await page.evaluate(() => {
      const small = [], tiny = [], rad = {};
      document.querySelectorAll('[role=button],[role=tab],a,button,[tabindex="0"]').forEach(el => {
        if (el.closest('[aria-hidden="true"]')) return;
        const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
        const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24);
        // Fixed-size controls (pens, small icons) are made 44 px to hit with an invisible hitSlop, which the DOM does not show: those are listed as notes.
        if (b.width < 44 || b.height < 44) small.push(`${label} ${Math.round(b.width)}x${Math.round(b.height)}`);
        const radius = getComputedStyle(el).borderTopLeftRadius; if (radius !== '0px') rad[radius] = (rad[radius] || 0) + 1;
      });
      document.querySelectorAll('div,span').forEach(el => {
        if (![...el.childNodes].some(n => n.nodeType === 3 && /\S/.test(n.textContent))) return;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 12) tiny.push(`${el.textContent.trim().slice(0, 20)} ${size}px`);
      });
      return { small: [...new Set(small)], tiny: [...new Set(tiny)], rad };
    });
    for (const [k, v] of Object.entries(r.rad)) radii[k] = (radii[k] || 0) + v;
    console.log(`${r.small.length || r.tiny.length ? 'ISSUE' : 'ok   '} /${route}`);
    r.small.slice(0, 8).forEach(x => console.log('     small target: ' + x));
    r.tiny.slice(0, 5).forEach(x => console.log('     tiny text: ' + x));
    total += r.small.length + r.tiny.length;
    await page.close();
  }
  console.log('button/tab corner radii in use:', JSON.stringify(radii));
  await browser.close();
  console.log(total ? `${total} issue(s)` : 'no touch-target or text-size issues');
})();
