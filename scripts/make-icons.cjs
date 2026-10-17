// Regenerates the app icons from vector art:  node scripts/make-icons.cjs
// Needs Playwright with a Chromium (PLAYWRIGHT_PATH, CHROME_PATH like the audit scripts).
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const OUT = path.resolve(__dirname, '../assets');

// The butterfly is the happy mascot from assets/butterfly (viewBox 320x290).
const mascot = fs.readFileSync(path.join(OUT, 'butterfly/butterfly-happy.svg'), 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const butterfly = mono => mono ? mascot.replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/fill="[^"]*"/g, 'fill="#ffffff"').replace(/stroke="[^"]*"/g, 'stroke="#ffffff"') : mascot;
const defs = `<defs>
  <linearGradient id="sky" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#8746df"/><stop offset="0.6" stop-color="#5a74f0"/><stop offset="1" stop-color="#27a3f0"/></linearGradient>
  <linearGradient id="night" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#120f55"/><stop offset="1" stop-color="#2f2699"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
</defs>`;
const sky = `<rect width="1024" height="1024" fill="url(#sky)"/>
  <circle cx="512" cy="520" r="430" fill="url(#glow)"/>
  <g fill="#fff" opacity=".9"><path d="M120 820 q-8-52 48-56 q16-56 78-34 q50-22 76 24 q50 2 46 40 q-2 26-30 26 H150 q-30 0-30-0z" opacity=".85"/><path d="M700 190 q-6-40 38-44 q12-44 62-26 q40-16 60 20 q40 2 36 32 q-2 20-24 20 H724 q-24 0-24 0z" opacity=".8"/></g>
  <g fill="#fff4b5"><path d="M860 700 l12 30 30 12-30 12-12 30-12-30-30-12 30-12z"/><path d="M170 250 l9 22 22 9-22 9-9 22-9-22-22-9 22-9z"/><circle cx="880" cy="420" r="9"/><circle cx="130" cy="560" r="8"/><circle cx="300" cy="900" r="8"/></g>`;
const svg = (inner, w = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 1024 1024">${defs}${inner}</svg>`;
// `width` is the butterfly's width in a 1024 canvas.
const place = (width, mono) => { const k = width / 320; return `<g transform="translate(${512 - 160 * k} ${520 - 145 * k}) scale(${k})">${butterfly(mono)}</g>`; };

const skyDark = `<rect width="1024" height="1024" fill="url(#night)"/><circle cx="512" cy="520" r="430" fill="url(#glow)" opacity=".4"/>
  <g fill="#fff4b5"><path d="M860 700 l12 30 30 12-30 12-12 30-12-30-30-12 30-12z"/><path d="M170 250 l9 22 22 9-22 9-9 22-9-22-22-9 22-9z"/><circle cx="880" cy="420" r="9"/><circle cx="130" cy="560" r="8"/><circle cx="300" cy="900" r="8"/><circle cx="700" cy="150" r="7"/></g>`;
const jobs = [
  ['icon.png', svg(sky + place(780, false)), false, 1024],
  ['android-icon-background.png', svg(sky), false, 512],
  ['android-icon-foreground.png', svg(place(560, false)), true, 512],
  ['android-icon-monochrome.png', svg(place(560, true)), true, 432],
  ['splash-icon.png', svg(place(780, false)), true, 1024],
  ['icon-dark.png', svg(skyDark + place(780, false)), false, 1024],
  ['icon-tinted.png', svg('<rect width="1024" height="1024" fill="#000"/>' + place(780, false)), false, 1024, 'grayscale(1) contrast(1.15)'],
  ['favicon.png', svg(sky + place(800, false)), false, 48],
];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  for (const [name, markup, transparent, size, filter] of jobs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px;${filter ? `filter:${filter}` : ''}}</style>${markup}`);
    await page.screenshot({ path: path.join(OUT, name), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    console.log('wrote', name, size);
  }
  fs.writeFileSync(path.join(OUT, 'icon-preview.svg'), svg(sky + place(780, false)));
  await browser.close();
})();
