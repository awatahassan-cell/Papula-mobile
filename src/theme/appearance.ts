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
  { id: 'cloud', label: 'ماکارۆن', description: 'مۆری نەرم و پاستێلی شیرین',
    colors: { background: '#ffffff', paper: '#ffffff', ink: '#3b2f63', muted: '#5e5586', coral: '#d9532f', coralDark: '#a63d1f', mint: '#6d4ae8', mintDark: '#4f33b8', lavender: '#f1ebff', sky: '#d3ebff', peach: '#ffd9cf', leaf: '#cff3e6', edge: '#e6dcff' },
    night: { background: '#15102b', paper: '#231b45', ink: '#f6f1ff', muted: '#c9bef0', coral: '#ffb08f', coralDark: '#ffd65a', mint: '#b9a8ff', mintDark: '#5a3fd6', lavender: '#2e2560', sky: '#233e66', peach: '#4a2f58', leaf: '#1f4a4a', edge: '#3a2e70' } },
  { id: 'lagoon', label: 'دەریا', description: 'شینی ئاو و سەوزی نەرم',
    colors: { background: '#ffffff', paper: '#ffffff', ink: '#12404a', muted: '#3e6670', coral: '#cf5a2a', coralDark: '#a2441c', mint: '#0a7c93', mintDark: '#075f72', lavender: '#e4eeff', sky: '#ddf3f8', peach: '#ffebdd', leaf: '#ddf6ea', edge: '#cbe6eb' },
    night: { background: '#062a38', paper: '#0d4257', ink: '#e9fbff', muted: '#bfe6ef', coral: '#ffb26b', coralDark: '#ffd08a', mint: '#6fd3e8', mintDark: '#08657a', lavender: '#123f66', sky: '#0f5568', peach: '#134a57', leaf: '#0f5a55', edge: '#1d6178' } },
  { id: 'blossom', label: 'گوڵی ئاڵ', description: 'پەمبە و هەنگوین',
    colors: { background: '#ffffff', paper: '#ffffff', ink: '#4a2036', muted: '#7a4860', coral: '#c25a14', coralDark: '#964208', mint: '#c23a74', mintDark: '#992b5a', lavender: '#f6e8ff', sky: '#e6f1fa', peach: '#ffe6da', leaf: '#ffe1eb', edge: '#f3d5e1' },
    night: { background: '#29103f', paper: '#411860', ink: '#ffeff7', muted: '#e3b3cd', coral: '#ffb26b', coralDark: '#ffd08a', mint: '#ff9ac9', mintDark: '#c23a74', lavender: '#4f2279', sky: '#2d3e7a', peach: '#5a2b55', leaf: '#5b1f58', edge: '#6b2d8f' } },
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
  '#475569': gardenColors.muted, '#64748b': gardenColors.muted, '#94a3b8': gardenColors.muted,
  '#f1f5f9': gardenColors.lavender, '#e2e8f0': '#e4d9ef', '#cbd5e1': gardenColors.edge,
  '#10b981': gardenColors.mint, '#047857': gardenColors.mint, '#059669': gardenColors.mint,
  '#38bdf8': '#3289a5', '#eaf2f8': gardenColors.sky, '#e0f2fe': gardenColors.sky,
};


const hexRgb = (hex: string) => /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) : null;
const relativeLuminance = ([r, g, b]: number[]) => [r, g, b].map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);

const toHex = (rgb: number[]) => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/** WCAG contrast ratio of two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const x = hexRgb(a), y = hexRgb(b);
  if (!x || !y) return 21;
  const la = relativeLuminance(x), lb = relativeLuminance(y);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Blend `color` towards `target` in small steps until it reaches `min` contrast against `against`. */
function blendUntil(color: string, target: string, against: string | string[], min: number): string {
  const grounds = Array.isArray(against) ? against : [against];
  const from = hexRgb(color), to = hexRgb(target);
  if (!from || !to) return color;
  for (let step = 0; step <= 20; step++) {
    const candidate = toHex(from.map((v, i) => v + (to[i] - v) * (step / 20)));
    if (grounds.every(ground => contrastRatio(candidate, ground) >= min)) return candidate;
  }
  return target;
}
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
    return '#' + rgb.map(v => Math.round(v + (255 - v) * 0.74).toString(16).padStart(2, '0')).join('');
  }
  return value;
}

/** The accent as a *fill* that carries white labels (at night the accent colour itself is the light text tone). */
export function accentFill(palette: AppearanceColors, night: boolean, color: string = palette.mint): string {
  return night ? blendUntil(color, '#000000', '#ffffff', 4.5) : color;
}

export function resolveAppearanceStyles<T extends Record<string, object>>(styles: T, theme: unknown = 'cloud', mode: ResolvedMode = 'day'): T {
  const palette = getAppearanceColors(theme, mode);
  const night = mode === 'night';
  const hairline = night ? 'rgba(255,255,255,0.16)' : palette.edge; // white page by day: cards need a visible soft edge
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
    // Buttons are raised candy tiles with a darker bottom lip (they sink when pressed); cards stay soft and flat.
    if (controls.includes(name)) {
      result.borderRadius = 28;
      result.borderBottomWidth = 4;
      result.borderBottomColor = darken(typeof result.backgroundColor === 'string' ? result.backgroundColor : palette.mint, 0.22);
      Object.assign(result, glowing.includes(name) ? soft(0.22, 12, 6, palette.mint) : soft(0.1, 8, 3));
    }
    if (cards.includes(name)) {
      result.borderRadius = 30;
      result.borderWidth = 1.5;
      result.borderColor = hairline;
      result.borderBottomWidth = 1.5;
      if (name === 'panel' || name === 'karaokeCard') result.backgroundColor = palette.paper;
      Object.assign(result, soft(0.13, 18, 8));
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
    if (night) {
      // The night accent is one colour for both fills and text; split it so white labels sit on a deep fill and accent text is light.
      if (name === 'disabled' && typeof result.backgroundColor === 'string') result.backgroundColor = palette.lavender;
      else if (typeof result.backgroundColor === 'string' && [palette.mint, palette.coral].includes(result.backgroundColor)) result.backgroundColor = blendUntil(result.backgroundColor, '#000000', '#ffffff', 4.5);
      if (result.color === palette.mint || result.color === palette.mintDark) result.color = blendUntil(String(result.color), '#ffffff', [palette.lavender, palette.peach, palette.leaf, palette.sky], 4.5);
    } else {
      // Day: the accent and coral fills carry white labels, so they must reach 4.5:1 on white.
      if (typeof result.backgroundColor === 'string' && [palette.coral, palette.mint].includes(result.backgroundColor)) result.backgroundColor = blendUntil(result.backgroundColor, '#000000', '#ffffff', 4.5);
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
  cloud: { day: { gradient: ['#ffffff', '#ffffff', '#ffffff'], hero: ['#6d4ae8', '#b06cf0'] }, night: { gradient: ['#15102b', '#1a1436', '#231b45'], hero: ['#5a3fd6', '#8a62f5'] } },
  lagoon: { day: { gradient: ['#ffffff', '#ffffff', '#ffffff'], hero: ['#0a7c93', '#3fb6a8'] }, night: { gradient: ['#05202c', '#0a3a4d', '#12506a'], hero: ['#08657a', '#0b8aa6'] } },
  blossom: { day: { gradient: ['#ffffff', '#ffffff', '#ffffff'], hero: ['#c23a74', '#f08a5d'] }, night: { gradient: ['#1f0a33', '#35134f', '#53206e'], hero: ['#992b5a', '#c23a74'] } },
};
export const getAppearanceExtras = (theme: unknown, mode: ResolvedMode = 'day'): AppearanceExtras => {
  const base = EXTRAS[normalizeAppearanceTheme(theme)][mode];
  return mode === 'night'
    ? { ...base, cta: '#ffd66b', ctaText: '#2a1b00', glass: 'rgba(255,255,255,0.09)', glassEdge: 'rgba(255,255,255,0.2)', glow: '#ffd66b' }
    : { ...base, cta: '#ffffff', ctaText: getAppearanceColors(theme, 'day').mintDark, glass: 'rgba(255,255,255,0.84)', glassEdge: '#ffffff', glow: '#ffb38a' };
};
