// Colour-contrast audit of the web export (see rtl-audit.cjs for how to serve it).
// Flags text below 4.5:1 (3:1 for large text) and icons below 3:1, on every route, day and night.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const PORT = process.env.PORT || 8099;
const ROUTES = ['', 'alphabet', 'stories', 'story-reader', 'match-game', 'writing', 'word-writing', 'letter-detail', 'daily-practice', 'stickers', 'badges', 'my-words', 'parent-dashboard', 'onboarding'];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  let total = 0;
  for (const mode of ['day', 'night']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(([m, theme]) => { try { localStorage.setItem('papoole_parent_settings_v1', JSON.stringify({ appearanceTheme: theme, appearanceMode: m, dailyLimitMinutes: 30, bedtimeLockEnabled: false, soundFxEnabled: false, narrationVolume: 0.9, isSubscribed: false, activePlan: 'none', language: 'sorani' })); } catch (e) { /* storage unavailable */ } }, [mode, process.env.THEME || 'cloud']);
    for (const route of ROUTES) {
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/${route}`);
      await page.waitForTimeout(4500);
      const found = await page.evaluate(mode => {
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
        const over = (top, base) => ({ r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 });
        const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
        const page = mode === 'night' ? { r: 35, g: 28, b: 128, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
        const bgOf = el => { const layers = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } } let base = page; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base); return base; };
        const out = [], seen = new Set(), arabic = /[؀-ۿA-Za-z0-9]/;
        document.querySelectorAll('div,span').forEach(el => {
          const cs = getComputedStyle(el), r = el.getBoundingClientRect();
          if (!r.width || !r.height || cs.visibility === 'hidden' || +cs.opacity === 0) return;
          if (![...el.childNodes].some(n => n.nodeType === 3 && arabic.test(n.textContent))) return;
          const fg = parse(cs.color); if (!fg) return;
          const bg = bgOf(el), c = ratio(over(fg, bg), bg), size = parseFloat(cs.fontSize), big = size >= 24 || (size >= 18.6 && +cs.fontWeight >= 700);
          if (c < (big ? 3 : 4.5)) { const key = el.textContent.trim().slice(0, 20) + c.toFixed(1); if (!seen.has(key)) { seen.add(key); out.push(`text "${el.textContent.trim().slice(0, 22)}" ${c.toFixed(1)}:1 fg=${cs.color} bg=rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`); } }
        });
        document.querySelectorAll('svg').forEach(svg => {
          if (svg.closest('[aria-hidden="true"]')) return; // decoration
          const r = svg.getBoundingClientRect(); if (!r.width || r.width > 60 || !svg.querySelector('path,circle,rect,line,polyline') || svg.querySelectorAll('path,circle,ellipse').length > 3) return;
          const cs = getComputedStyle(svg), shape = svg.querySelector('path,circle,rect,line,polyline'), shapeStyle = shape ? getComputedStyle(shape) : cs, stroke = parse(cs.stroke) || parse(shapeStyle.stroke) || parse(shapeStyle.fill) || parse(cs.color); if (!stroke) return;
          const bg = bgOf(svg.parentElement), c = ratio(over(stroke, bg), bg);
          if (c < 3) { const key = 'svg' + cs.stroke + c.toFixed(1); if (!seen.has(key)) { seen.add(key); out.push(`icon ${c.toFixed(1)}:1 stroke=${cs.stroke} bg=rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}) near "${(svg.parentElement.textContent || '').trim().slice(0, 18)}"`); } }
        });
        return out;
      }, [mode, process.env.THEME || 'cloud']);
      console.log(`${found.length ? 'LOW ' : 'ok  '} ${mode} /${route}`);
      found.slice(0, 12).forEach(f => console.log('     ' + f));
      total += found.length;
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(total ? `${total} low-contrast item(s)` : 'contrast OK everywhere');
  process.exit(total ? 1 : 0);
})();
