export type AppearanceTheme = 'cloud' | 'lagoon' | 'blossom';
/** A parent picks day or night, or lets the app follow the clock. */
export type AppearanceMode = 'day' | 'night' | 'auto';
export type ResolvedMode = 'day' | 'night';

// Earlier versions saved one of five names; keep their choice as close as possible.
const LEGACY_THEMES: Record<string, AppearanceTheme> = { garden: 'cloud', classic: 'cloud', lavender: 'cloud', sky: 'lagoon', rose: 'blossom', sunset: 'blossom' };
const THEME_IDS: AppearanceTheme[] = ['cloud', 'lagoon', 'blossom'];
export const normalizeAppearanceTheme = (value: unknown): AppearanceTheme =>
  typeof value !== 'string' ? 'cloud' : (THEME_IDS as string[]).includes(value) ? value as AppearanceTheme : LEGACY_THEMES[value] ?? 'cloud';
export const normalizeAppearanceMode = (value: unknown): AppearanceMode =>
  value === 'day' || value === 'night' || value === 'auto' ? value : 'auto';
/** «auto» turns to night between 19:00 and 06:00 local time. */
export const resolveAppearanceMode = (mode: unknown, now = new Date()): ResolvedMode => {
  const normalized = normalizeAppearanceMode(mode);
  if (normalized !== 'auto') return normalized;
  const hour = now.getHours();
  return hour >= 19 || hour < 6 ? 'night' : 'day';
};

// The original garden palette is the source: every colour written in a style sheet is matched
// against it and replaced with the chosen palette. Keep these values stable.
export const gardenColors = {
  background: '#f4f9f6', paper: '#ffffff', ink: '#243b3a', muted: '#657d79',
  coral: '#f18555', coralDark: '#bd5933', mint: '#22845c', mintDark: '#176445',
  lavender: '#eeebff', sky: '#e4f4ff', peach: '#fff0df', leaf: '#e6f5d8',
  edge: '#dce9e1',
} as const;

export type AppearanceColors = {[K in keyof typeof gardenColors]: string};
interface Palette { id: AppearanceTheme; label: string; description: string; colors: AppearanceColors; night: AppearanceColors; }
// `mint` is the main action colour (white labels sit on it); `coral` is the second accent.
export const appearanceThemes: Palette[] = [
  { id: 'cloud', label: 'دوورگەی ڕەنگەکان', description: 'مۆر و شین و زەردی گەش',
    colors: { background: '#fff9ec', paper: '#ffffff', ink: '#24304a', muted: '#626980', coral: '#ff795d', coralDark: '#b64028', mint: '#7436d8', mintDark: '#5623aa', lavender: '#eee4ff', sky: '#d7f2ff', peach: '#ffe8d4', leaf: '#dbf7df', edge: '#e9e0d1' },
    night: { background: '#161062', paper: '#241c80', ink: '#f4f1ff', muted: '#c9c2f5', coral: '#ffb84d', coralDark: '#ffd66b', mint: '#8a6dff', mintDark: '#5a3fd6', lavender: '#2e2690', sky: '#1d3a86', peach: '#3a2b74', leaf: '#1d4d6b', edge: '#3f3698' } },
  { id: 'lagoon', label: 'دەریا', description: 'شینی ئاو و سەوزی نەرم',
    colors: { background: '#eaf7f8', paper: '#ffffff', ink: '#12404a', muted: '#456f79', coral: '#ef8a5d', coralDark: '#b4552d', mint: '#0a7c93', mintDark: '#075f72', lavender: '#e4eeff', sky: '#ddf3f8', peach: '#ffebdd', leaf: '#ddf6ea', edge: '#cbe6eb' },
    night: { background: '#062a38', paper: '#0d4257', ink: '#e9fbff', muted: '#9ed1dc', coral: '#ffb26b', coralDark: '#ffd08a', mint: '#0b8aa6', mintDark: '#08657a', lavender: '#123f66', sky: '#0f5568', peach: '#134a57', leaf: '#0f5a55', edge: '#1d6178' } },
  { id: 'blossom', label: 'گوڵی ئاڵ', description: 'پەمبە و هەنگوین',
    colors: { background: '#fff1f6', paper: '#ffffff', ink: '#4a2036', muted: '#855069', coral: '#e5883a', coralDark: '#a9570f', mint: '#c23a74', mintDark: '#992b5a', lavender: '#f6e8ff', sky: '#e6f1fa', peach: '#ffe6da', leaf: '#ffe1eb', edge: '#f3d5e1' },
    night: { background: '#29103f', paper: '#411860', ink: '#ffeff7', muted: '#e3b3cd', coral: '#ffb26b', coralDark: '#ffd08a', mint: '#e0509a', mintDark: '#c23a74', lavender: '#4f2279', sky: '#2d3e7a', peach: '#5a2b55', leaf: '#5b1f58', edge: '#6b2d8f' } },
];
export const getAppearanceColors = (value: unknown, mode: ResolvedMode = 'day'): AppearanceColors => {
  const theme = appearanceThemes.find(item => item.id === normalizeAppearanceTheme(value))!;
  return mode === 'night' ? theme.night : theme.colors;
};

// Apply one shared palette without mutating source styles or changing writing
// coordinates, glyphs and lesson content.
const gardenColorMap: Record<string, string> = {
  '#23875f': gardenColors.mint, '#62b778':gardenColors.mint,
  '#d7e9dc':gardenColors.edge, '#e9f0eb':gardenColors.edge, '#eaf0eb':gardenColors.edge, '#d8e3dc':gardenColors.edge, '#d6e0d9':gardenColors.edge, '#e0e9e2':gardenColors.edge, '#c3dfcb':gardenColors.edge, '#dce8de':gardenColors.edge, '#9baaa1':gardenColors.muted,
  '#ffffff': gardenColors.paper, '#fff': gardenColors.paper,
  '#fffdfa': gardenColors.background, '#fffdf7': gardenColors.background,
  '#fffef7': gardenColors.paper, '#fffbeb': '#fff1d8', '#fff0bd': '#ffedca',
  '#fef3c7': '#ffeac8', '#fde68a': '#f5c487', '#f59e0b': gardenColors.coral,
  '#d97706': gardenColors.coralDark, '#b45309': gardenColors.ink, '#78350f': gardenColors.ink,
  '#92400e': gardenColors.ink, '#1e293b': gardenColors.ink, '#334155': gardenColors.ink,
  '#0f172a': gardenColors.ink, '#fffdf5': gardenColors.paper, '#fff7ed': '#fff1df',
  '#f3f4f6': gardenColors.lavender, '#fef9c3': '#fff0cf',
  '#fbbf24': '#f5b76e', '#fcd34d': '#f5c487', '#ffedd5': '#ffe9d9',
  '#a855f7': '#8358b0', '#7c3aed': '#7950a0', '#dbeafe': gardenColors.sky,
  '#475569': gardenColors.muted, '#64748b': gardenColors.muted,
  '#f1f5f9': gardenColors.lavender, '#e2e8f0': '#e4d9ef', '#cbd5e1': gardenColors.edge,
  '#10b981': gardenColors.mint, '#047857': gardenColors.mint, '#059669': gardenColors.mint,
  '#38bdf8': '#3289a5', '#eaf2f8': gardenColors.sky, '#e0f2fe': gardenColors.sky,
};


const hexRgb = (hex: string) => /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) : null;
const relativeLuminance = ([r, g, b]: number[]) => [r, g, b].map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
/**
 * Night-mode safety net for colours no table knows: a pale fill becomes a deep tint of the palette, a pale
 * border becomes the palette edge, and neutral dark text becomes the light ink. Saturated dark text (red errors,
 * green ticks) keeps its hue but is lightened.
 */
function nightFallback(key: string, value: string, palette: AppearanceColors): string {
  const rgb = hexRgb(value);
  if (!rgb) return value;
  const light = relativeLuminance(rgb);
  const neutral = (Math.max(...rgb) - Math.min(...rgb)) / 255 < 0.25;
  if (/backgroundColor$/i.test(key) && light > 0.72) return palette.lavender;
  if (/border.*Color$/i.test(key) && light > 0.72) return palette.edge;
  if (key === 'color' && light < 0.22) {
    if (neutral) return palette.ink;
    // Keep the hue (green tick, red error) but lift it so it reads on a dark card.
    return '#' + rgb.map(v => Math.round(v + (255 - v) * 0.62).toString(16).padStart(2, '0')).join('');
  }
  return value;
}

export function resolveAppearanceStyles<T extends Record<string, object>>(styles: T, theme: unknown = 'cloud', mode: ResolvedMode = 'day'): T {
  const palette = getAppearanceColors(theme, mode);
  const night = mode === 'night';
  const hairline = night ? 'rgba(255,255,255,0.16)' : palette.edge;
  const replacements: Record<string,string> = {};
  for(const key of Object.keys(gardenColors) as (keyof AppearanceColors)[]) replacements[gardenColors[key]] = palette[key];
  Object.assign(replacements,{'#8d6636':palette.coralDark,'#eaf0ed':palette.edge,'#e6f3ea':palette.leaf,'#e3f5ec':palette.leaf,'#f2faf6':palette.background,'#eff8ed':palette.leaf,'#c8ead8':palette.leaf,'#62a384':palette.mint,'#fff9e8':palette.paper,'#fff1d8':palette.peach,'#fff3df':palette.peach,'#f0dfc0':palette.edge,'#efd2a0':palette.edge,'#e4d9ef':palette.edge,'#f5c487':palette.peach,'#fff1df':palette.peach});
  if (night) {
    // Pale feedback tints would clash with light text on a dark page: use deep versions of the same meaning.
    Object.assign(replacements, { '#dcfce7': '#145a3a', '#bbf7d0': '#14604a', '#ecfdf5': palette.leaf, '#fef3c7': '#5b4a12', '#fffbeb': '#5b4a12', '#fef9c3': '#5b4a12', '#ffeac8': '#5b4a12', '#fee2e2': '#5c1f2a', '#ffedca': '#5b4a12', '#fff0cf': '#5b4a12' });
  }
  const cards = ['panel', 'card', 'storyCard', 'sectionCard', 'karaokeCard', 'quizCard', 'modalCard'];
  const controls = ['buttonBase', 'button', 'next', 'listen', 'playBtn', 'tool', 'arrow', 'navBtn', 'secondary', 'letterNav'];
  const glowing = ['button', 'next', 'playBtn', 'success', 'primary'];
  const soft = (opacity: number, radius: number, y: number, tint: string = palette.mintDark) => ({
    shadowColor: night ? '#000000' : tint, shadowOpacity: night ? Math.min(0.6, opacity * 3) : opacity,
    shadowOffset: { width: 0, height: y }, shadowRadius: radius, elevation: Math.round(radius / 3),
  });
  return Object.fromEntries(Object.entries(styles).map(([name, style]) => {
    const result: Record<string, unknown> = { ...style };
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string' && /color$/i.test(key)) {
        // Inverted text on filled controls must remain white for contrast.
        const mapped = key === 'color' && ['#fff', '#ffffff'].includes(value.toLowerCase())
          ? '#ffffff' : replacements[(gardenColorMap[value.toLowerCase()] ?? value).toLowerCase()] ?? gardenColorMap[value.toLowerCase()] ?? value;
        result[key] = night && mapped === value ? nightFallback(key, value, palette) : mapped;
      }
    }
    if (typeof result.fontFamily === 'string' && result.fontFamily.includes('IBM Plex Sans Arabic')) {
      const bold = ['bold', '700', '800', '900'].includes(String(result.fontWeight));
      result.fontFamily = bold ? 'IBMPlexSansArabic_700Bold' : 'IBMPlexSansArabic_400Regular';
    }
    if (name === 'iconButton' && result.width === 36) { result.width = 44; result.height = 44; result.borderRadius = 22; }

    // Shape language: large soft cards with a hairline edge and a gentle coloured shadow, no chunky borders.
    // One family: buttons and cards are both raised tiles with a darker bottom lip.
    if (controls.includes(name)) {
      result.borderRadius = 28;
      result.borderBottomWidth = 4;
      result.borderBottomColor = darken(typeof result.backgroundColor === 'string' ? result.backgroundColor : palette.mint, 0.22);
      Object.assign(result, glowing.includes(name) ? soft(0.22, 12, 6, palette.mint) : soft(0.1, 8, 3));
    }
    if (cards.includes(name)) {
      result.borderRadius = 30;
      result.borderWidth = 2;
      result.borderColor = hairline;
      result.borderBottomWidth = 4;
      if (name === 'panel' || name === 'karaokeCard') result.backgroundColor = palette.paper;
      result.borderBottomColor = darken(hairline, 0.12);
      Object.assign(result, soft(0.1, 12, 5));
    }
    if (name === 'boardFrame') {
      // The writing board: white paper by day, deep navy with glowing ink at night (pens and guides adapt).
      result.borderColor = night ? 'rgba(255,255,255,0.22)' : '#ffffff'; result.borderWidth = 3; result.borderRadius = 32; result.backgroundColor = night ? '#1a1570' : '#ffffff';
      Object.assign(result, soft(0.16, 20, 10));
    }
    if (name === 'cardUnlocked') { result.backgroundColor = palette.peach; result.borderColor = palette.edge; }
    if (name === 'cardInProgress') { result.backgroundColor = palette.sky; result.borderColor = palette.edge; }
    if (name === 'cardMastered') { result.backgroundColor = palette.leaf; result.borderColor = palette.edge; }
    if (name === 'glyphText') { result.fontSize = 44; result.color = palette.ink; }
    if (name === 'filterBtn') result.minHeight = 48;
    if (name === 'container') { result.width = '100%'; result.maxWidth = 840; result.alignSelf = 'center'; result.backgroundColor='transparent'; }
    if (name === 'coverBanner') result.backgroundColor = palette.lavender;
    if (name === 'illustrationCard') { result.backgroundColor = palette.sky; result.borderRadius = 32; }
    if (name === 'playBtn') result.backgroundColor = palette.mint;
    if (typeof result.borderRadius === 'number' && result.borderRadius >= 18 && result.backgroundColor
      && !['disabled', 'backdrop', 'overlay'].includes(name) && !cards.includes(name) && !controls.includes(name)) {
      Object.assign(result, soft(0.08, 10, 4));
    }
    return [name, result];
  })) as T;
}

/** Mix a #rrggbb colour with black; anything else gets a translucent black lip. */
export function darken(color: string, amount: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return `rgba(0,0,0,${Math.min(0.4, amount)})`;
  const n = parseInt(match[1], 16);
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

export interface AppearanceExtras {
  /** Three stops for the page background. */
  gradient: [string, string, string];
  /** Two stops for the big lesson card (day). */
  hero: [string, string];
  /** Main call-to-action: a white pill on the day hero, a glowing gold button at night. */
  cta: string; ctaText: string;
  /** Frosted card fill and its hairline edge. */
  glass: string; glassEdge: string;
  /** Accent that glows at night (gold) and warms the day. */
  glow: string;
}
const EXTRAS: Record<AppearanceTheme, { day: Omit<AppearanceExtras, 'cta' | 'ctaText' | 'glass' | 'glassEdge' | 'glow'>; night: Omit<AppearanceExtras, 'cta' | 'ctaText' | 'glass' | 'glassEdge' | 'glow'> }> = {
  cloud: { day: { gradient: ['#ffffff', '#ffffff', '#ffffff'], hero: ['#7c5cff', '#4ea8ff'] }, night: { gradient: ['#120f55', '#231c80', '#3b2a96'], hero: ['#5a3fd6', '#7c5cff'] } },
  lagoon: { day: { gradient: ['#ffffff', '#ffffff', '#ffffff'], hero: ['#0a7c93', '#3fb6a8'] }, night: { gradient: ['#05202c', '#0a3a4d', '#12506a'], hero: ['#08657a', '#0b8aa6'] } },
  blossom: { day: { gradient: ['#ffffff', '#ffffff', '#ffffff'], hero: ['#c23a74', '#f08a5d'] }, night: { gradient: ['#1f0a33', '#35134f', '#53206e'], hero: ['#992b5a', '#c23a74'] } },
};
export const getAppearanceExtras = (theme: unknown, mode: ResolvedMode = 'day'): AppearanceExtras => {
  const base = EXTRAS[normalizeAppearanceTheme(theme)][mode];
  return mode === 'night'
    ? { ...base, cta: '#ffd66b', ctaText: '#2a1b00', glass: 'rgba(255,255,255,0.09)', glassEdge: 'rgba(255,255,255,0.2)', glow: '#ffd66b' }
    : { ...base, cta: '#ffffff', ctaText: getAppearanceColors(theme, 'day').mintDark, glass: 'rgba(255,255,255,0.84)', glassEdge: '#ffffff', glow: '#ffb38a' };
};
