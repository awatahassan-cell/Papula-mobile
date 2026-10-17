// Regenerates the app icons from vector art:  node scripts/make-icons.cjs
// Needs Playwright with a Chromium (PLAYWRIGHT_PATH, CHROME_PATH like the audit scripts).
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const OUT = path.resolve(__dirname, '../assets');

// The butterfly is drawn in a 400x400 box, centred on (200,200).
function butterfly(mono) {
  const c = (full, flat) => (mono ? flat : full);
  const ink = mono ? '#ffffff' : '#3b1a7a';
  return `
  <g>
    <!-- upper wings -->
    <path d="M196 188 C150 90 70 40 28 92 C-6 136 40 206 196 214 Z" fill="${c('url(#wingA)', '#fff')}"/>
    <path d="M204 188 C250 90 330 40 372 92 C406 136 360 206 204 214 Z" fill="${c('url(#wingA)', '#fff')}"/>
    <!-- lower wings -->
    <path d="M196 214 C120 214 52 250 62 316 C72 372 158 372 196 286 Z" fill="${c('url(#wingB)', '#fff')}"/>
    <path d="M204 214 C280 214 348 250 338 316 C328 372 242 372 204 286 Z" fill="${c('url(#wingB)', '#fff')}"/>
    ${mono ? '' : `
    <!-- wing patterns -->
    <ellipse cx="96" cy="108" rx="30" ry="40" transform="rotate(-38 96 108)" fill="#ffd43b"/>
    <ellipse cx="304" cy="108" rx="30" ry="40" transform="rotate(38 304 108)" fill="#ffd43b"/>
    <circle cx="86" cy="104" r="10" fill="#fff4b5"/><circle cx="314" cy="104" r="10" fill="#fff4b5"/>
    <circle cx="118" cy="300" r="22" fill="#ffc1db"/><circle cx="282" cy="300" r="22" fill="#ffc1db"/>
    <circle cx="150" cy="164" r="9" fill="#ffffff" opacity=".85"/><circle cx="250" cy="164" r="9" fill="#ffffff" opacity=".85"/>
    <circle cx="58" cy="150" r="7" fill="#ffffff" opacity=".7"/><circle cx="342" cy="150" r="7" fill="#ffffff" opacity=".7"/>
    <!-- wing edges -->
    <path d="M196 188 C150 90 70 40 28 92 C-6 136 40 206 196 214" fill="none" stroke="#5a2bb8" stroke-width="7" stroke-linejoin="round"/>
    <path d="M204 188 C250 90 330 40 372 92 C406 136 360 206 204 214" fill="none" stroke="#5a2bb8" stroke-width="7" stroke-linejoin="round"/>
    <path d="M196 214 C120 214 52 250 62 316 C72 372 158 372 196 286" fill="none" stroke="#d63f86" stroke-width="7" stroke-linejoin="round"/>
    <path d="M204 214 C280 214 348 250 338 316 C328 372 242 372 204 286" fill="none" stroke="#d63f86" stroke-width="7" stroke-linejoin="round"/>`}
    <!-- antennae -->
    <path d="M190 118 C176 70 150 46 128 50 M210 118 C224 70 250 46 272 50" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="127" cy="52" r="11" fill="${mono ? '#fff' : '#ffd43b'}"/><circle cx="273" cy="52" r="11" fill="${mono ? '#fff' : '#ffd43b'}"/>
    <!-- body -->
    <ellipse cx="200" cy="232" rx="22" ry="86" fill="${mono ? '#fff' : '#4b1fa0'}"/>
    <!-- head -->
    <circle cx="200" cy="148" r="46" fill="${mono ? '#fff' : '#ffdb55'}" ${mono ? '' : 'stroke="#3b1a7a" stroke-width="6"'}/>
    ${mono ? '' : `
    <ellipse cx="170" cy="162" rx="11" ry="7" fill="#ff9c87"/><ellipse cx="230" cy="162" rx="11" ry="7" fill="#ff9c87"/>
    <circle cx="183" cy="142" r="7" fill="#24304a"/><circle cx="217" cy="142" r="7" fill="#24304a"/>
    <circle cx="185" cy="139" r="2.4" fill="#fff"/><circle cx="219" cy="139" r="2.4" fill="#fff"/>
    <path d="M184 166 Q200 184 216 166" fill="none" stroke="#743440" stroke-width="6" stroke-linecap="round"/>`}
  </g>`;
}
const defs = `<defs>
  <linearGradient id="wingA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a064ff"/><stop offset="1" stop-color="#7a35e0"/></linearGradient>
  <linearGradient id="wingB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff86bd"/><stop offset="1" stop-color="#ff5a9f"/></linearGradient>
  <linearGradient id="sky" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#8746df"/><stop offset="0.6" stop-color="#5a74f0"/><stop offset="1" stop-color="#27a3f0"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
</defs>`;
const sky = `<rect width="1024" height="1024" fill="url(#sky)"/>
  <circle cx="512" cy="520" r="430" fill="url(#glow)"/>
  <g fill="#fff" opacity=".9"><path d="M120 820 q-8-52 48-56 q16-56 78-34 q50-22 76 24 q50 2 46 40 q-2 26-30 26 H150 q-30 0-30-0z" opacity=".85"/><path d="M700 190 q-6-40 38-44 q12-44 62-26 q40-16 60 20 q40 2 36 32 q-2 20-24 20 H724 q-24 0-24 0z" opacity=".8"/></g>
  <g fill="#fff4b5"><path d="M860 700 l12 30 30 12-30 12-12 30-12-30-30-12 30-12z"/><path d="M170 250 l9 22 22 9-22 9-9 22-9-22-22-9 22-9z"/><circle cx="880" cy="420" r="9"/><circle cx="130" cy="560" r="8"/><circle cx="300" cy="900" r="8"/></g>`;
const svg = (inner, w = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 1024 1024">${defs}${inner}</svg>`;
const place = (scale, mono) => `<g transform="translate(${512 - 200 * scale} ${512 - 205 * scale}) scale(${scale})">${butterfly(mono)}</g>`;

const jobs = [
  ['icon.png', svg(sky + place(2.0, false)), false, 1024],
  ['android-icon-background.png', svg(sky), false, 512],
  ['android-icon-foreground.png', svg(place(1.55, false)), true, 512],
  ['android-icon-monochrome.png', svg(place(1.55, true)), true, 432],
  ['splash-icon.png', svg(place(2.0, false)), true, 1024],
  ['favicon.png', svg(sky + place(2.1, false)), false, 48],
];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  for (const [name, markup, transparent, size] of jobs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
    await page.screenshot({ path: path.join(OUT, name), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    console.log('wrote', name, size);
  }
  fs.writeFileSync(path.join(OUT, 'icon-preview.svg'), svg(sky + place(2.0, false)));
  await browser.close();
})();
