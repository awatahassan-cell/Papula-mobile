export type AppearanceTheme = 'garden' | 'sky' | 'lavender' | 'rose' | 'sunset';

// Keep the same responsive layout; saved legacy appearances use the garden palette.
export const normalizeAppearanceTheme = (value: unknown): AppearanceTheme =>
  typeof value === 'string' && ['garden','sky','lavender','rose','sunset'].includes(value) ? value as AppearanceTheme : 'garden';

export const gardenColors = {
  background: '#f4f9f6', paper: '#ffffff', ink: '#243b3a', muted: '#657d79',
  coral: '#f18555', coralDark: '#bd5933', mint: '#22845c', mintDark: '#176445',
  lavender: '#eeebff', sky: '#e4f4ff', peach: '#fff0df', leaf: '#e6f5d8',
  edge: '#dce9e1',
} as const;

export type AppearanceColors = {[K in keyof typeof gardenColors]: string};
export const appearanceThemes: {id:AppearanceTheme;label:string;description:string;colors:AppearanceColors}[] = [
  {id:'garden',label:'باخچە',description:'سەوز و گوڵی ڕەنگاوڕەنگ',colors:gardenColors},
  {id:'sky',label:'ئاسمان',description:'شینی ئاسمان و تیشکی خۆر',colors:{...gardenColors,background:'#f0f7ff',ink:'#243b53',muted:'#627b94',mint:'#2375b8',mintDark:'#18558a',coral:'#d88236',coralDark:'#a45c20',lavender:'#e9edff',sky:'#dcefff',peach:'#fff0d6',leaf:'#e1edff',edge:'#d6e4f0'}},
  {id:'lavender',label:'خەون',description:'مۆری نەرم و گوڵابی',colors:{...gardenColors,background:'#f7f3ff',ink:'#403350',muted:'#7b6a8d',mint:'#8254b3',mintDark:'#60388a',coral:'#be617c',coralDark:'#93435b',lavender:'#eee4ff',sky:'#e7eeff',peach:'#ffeced',leaf:'#efe2fa',edge:'#e5dced'}},
  {id:'rose',label:'گوڵستان',description:'گوڵابی و سەوزی گەڵا',colors:{...gardenColors,background:'#fff4f7',ink:'#513441',muted:'#906d7a',mint:'#b84872',mintDark:'#8b3254',coral:'#9866b7',coralDark:'#71468c',lavender:'#f2e7fb',sky:'#e6f2f8',peach:'#ffe5ec',leaf:'#fbe0eb',edge:'#efdce3'}},
  {id:'sunset',label:'تیشکی خۆر',description:'نارنجی گەرم و زەردی خۆر',colors:{...gardenColors,background:'#fff8ef',ink:'#503c2f',muted:'#8a745e',mint:'#b25d20',mintDark:'#884819',coral:'#bc5365',coralDark:'#8e3748',lavender:'#f5e9f6',sky:'#e3f1f6',peach:'#ffead2',leaf:'#ffe9ca',edge:'#efdfcc'}},
];
export const getAppearanceColors = (value:unknown):AppearanceColors => appearanceThemes.find(theme=>theme.id===normalizeAppearanceTheme(value))!.colors;

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

export function resolveAppearanceStyles<T extends Record<string, object>>(styles: T, mode: AppearanceTheme | 'classic' = 'garden'): T {
  const palette = getAppearanceColors(mode);
  const replacements: Record<string,string> = {};
  for(const key of Object.keys(gardenColors) as (keyof AppearanceColors)[]) replacements[gardenColors[key]] = palette[key];
  Object.assign(replacements,{'#8d6636':palette.coralDark,'#eaf0ed':palette.edge,'#e6f3ea':palette.leaf,'#e3f5ec':palette.leaf,'#f2faf6':palette.background,'#eff8ed':palette.leaf,'#c8ead8':palette.leaf,'#62a384':palette.mint,'#fff9e8':palette.peach,'#fff1d8':palette.peach,'#fff3df':palette.peach,'#f0dfc0':palette.edge,'#efd2a0':palette.edge,'#e4d9ef':palette.edge,'#f5c487':palette.peach,'#fff1df':palette.peach});
  return Object.fromEntries(Object.entries(styles).map(([name, style]) => {
    const result: Record<string, unknown> = { ...style };
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string' && /color$/i.test(key)) {
        // Inverted text on filled controls must remain white for contrast.
        result[key] = key === 'color' && ['#fff', '#ffffff'].includes(value.toLowerCase())
          ? '#ffffff' : gardenColorMap[value.toLowerCase()] ?? value;
      }
    }
    if (typeof result.fontFamily === 'string' && result.fontFamily.includes('IBM Plex Sans Arabic')) {
      const bold = ['bold', '700', '800', '900'].includes(String(result.fontWeight));
      result.fontFamily = bold ? 'IBMPlexSansArabic_700Bold' : 'IBMPlexSansArabic_400Regular';
    }
    if (name === 'iconButton' && result.width === 36) {
      result.width = 44; result.height = 44; result.borderRadius = 22;
    }
    const filledControl = ['buttonBase', 'button', 'next', 'listen', 'playBtn', 'tool', 'arrow', 'navBtn', 'secondary', 'letterNav'].includes(name);
    if (filledControl) {
      result.borderRadius = 22;
      result.borderBottomWidth = 3;
      result.borderBottomColor = name === 'button' || name === 'next' ? gardenColors.mintDark : gardenColors.edge;
    }
    if (['panel', 'card', 'storyCard', 'sectionCard', 'karaokeCard', 'quizCard', 'modalCard'].includes(name)) {
      result.borderRadius = 32;
      if (!result.borderColor) result.borderColor = '#efd2a0';
      if (!result.borderWidth) result.borderWidth = 3;
      result.borderBottomWidth = 5;
      if (name === 'panel' || name === 'karaokeCard') result.backgroundColor = '#fff9e8';
    }
    if (name === 'boardFrame') {
      result.borderColor = '#efd2a0'; result.borderWidth = 4; result.borderRadius = 32;
    }
    if (name === 'cardUnlocked') { result.backgroundColor = '#fff1d8'; result.borderColor = '#e8bc7c'; }
    if (name === 'cardInProgress') { result.backgroundColor = gardenColors.sky; result.borderColor = '#87bed1'; }
    if (name === 'cardMastered') { result.backgroundColor = '#e3f3dc'; result.borderColor = '#93bd7b'; }
    if (name === 'glyphText') { result.fontSize = 44; result.color = gardenColors.ink; }
    if (name === 'filterBtn') result.minHeight = 48;
    if (name === 'container') { result.width = '100%'; result.maxWidth = 840; result.alignSelf = 'center'; result.backgroundColor='transparent'; }
    if (name === 'primary') result.borderBottomColor = gardenColors.coralDark;
    if (name === 'success') result.borderBottomColor = gardenColors.mintDark;
    if (name === 'coverBanner') result.backgroundColor = gardenColors.lavender;
    if (name === 'illustrationCard') { result.backgroundColor = gardenColors.sky; result.borderRadius = 32; }
    if (name === 'playBtn') { result.backgroundColor = gardenColors.mint; result.borderBottomColor = gardenColors.mintDark; }
    if (typeof result.borderRadius === 'number' && result.borderRadius >= 18 && result.backgroundColor
      && !['disabled', 'backdrop', 'overlay'].includes(name)) {
      result.shadowColor = '#705139'; result.shadowOpacity = 0.09;
      result.shadowOffset = { width: 0, height: 3 }; result.shadowRadius = 4;
      result.elevation = 2;
    }
    if(normalizeAppearanceTheme(mode)!=='garden') for(const [key,value] of Object.entries(result)) {
      if(typeof value==='string' && /color$/i.test(key) && !(key==='color' && value.toLowerCase()==='#ffffff')) result[key]=replacements[value.toLowerCase()] ?? value;
    }
    return [name, result];
  })) as T;
}
