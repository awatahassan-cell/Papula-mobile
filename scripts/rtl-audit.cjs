// Browser RTL audit: serve the web export (npx expo export --platform web) on PORT, then run
//   node scripts/rtl-audit.cjs
// It opens every route on a phone and a tablet, by day and by night, and reports text that is not
// right-to-left, flex rows that start on the left, and content that spills off the screen.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const PORT = process.env.PORT || 8099;
const ROUTES = ['garden', '', 'alphabet', 'stories', 'story-reader', 'match-game', 'writing', 'word-writing', 'letter-detail', 'daily-practice', 'stickers', 'badges', 'my-words', 'parent-dashboard', 'onboarding'];
const SIZES = [['phone', 390, 844], ['tablet', 1024, 768]];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  let problems = 0;
  for (const [label, width, height] of SIZES) for (const mode of ['day', 'night']) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript(m => { try { localStorage.setItem('papoole_parent_settings_v1', JSON.stringify({ appearanceTheme: 'cloud', appearanceMode: m, dailyLimitMinutes: 30, bedtimeLockEnabled: false, soundFxEnabled: false, narrationVolume: 0.9, isSubscribed: false, activePlan: 'none', language: 'sorani' })); } catch { /* storage unavailable */ } }, mode);
    for (const route of ROUTES) {
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/${route}`);
      await page.waitForTimeout(4500);
      const found = await page.evaluate(() => {
        const out = [], vw = innerWidth, arabic = /[؀-ۿ]/;
        const scrolls = el => { for (let e = el; e; e = e.parentElement) { const o = getComputedStyle(e).overflowX; if ((o === 'auto' || o === 'scroll') && e.scrollWidth > e.clientWidth) return true; } return false; };
        document.querySelectorAll('div,span,input,textarea').forEach(el => {
          if (el.closest('[aria-hidden="true"]')) return; // decoration clipped by its own frame
          const cs = getComputedStyle(el), r = el.getBoundingClientRect();
          if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') return;
          const own = [...el.childNodes].some(n => n.nodeType === 3 && arabic.test(n.textContent));
          const label = (el.textContent || el.placeholder || '').trim().slice(0, 24);
          if (own && (cs.direction !== 'rtl' || cs.textAlign === 'left')) out.push(`text not RTL: "${label}" (${cs.direction}, ${cs.textAlign})`);
          if (cs.display === 'flex' && cs.flexDirection === 'row' && cs.position !== 'absolute') {
            const kids = [...el.children].filter(k => { const kr = k.getBoundingClientRect(); return kr.width > 0 && getComputedStyle(k).position !== 'absolute'; });
            if (kids.length >= 2 && !scrolls(el)) {
              const a = kids[0].getBoundingClientRect(), b = kids[kids.length - 1].getBoundingClientRect();
              if (a.left + a.width / 2 < b.left + b.width / 2 - 2) out.push(`row starts on the left: "${label}"`);
            }
          }
          if (!scrolls(el) && (r.right > vw + 2 || r.left < -2) && cs.position !== 'fixed' && r.width < vw * 2) out.push(`spills off screen: "${label}" [${Math.round(r.left)}..${Math.round(r.right)}]`);
        });
        if (document.documentElement.scrollWidth > vw + 2) out.push('page scrolls sideways');
        return [...new Set(out)];
      });
      console.log(`${found.length ? 'FAIL' : 'ok  '} ${label} ${mode} /${route} ${found.length ? '' : ''}`);
      found.slice(0, 6).forEach(f => console.log('     ' + f));
      problems += found.length;
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(problems ? `${problems} problem(s)` : 'all screens are RTL-correct');
  process.exit(problems ? 1 : 0);
})();
