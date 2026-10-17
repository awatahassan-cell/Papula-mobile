/**
 * Fixed brand colours that do not change between palettes: the gold of the main button and stars, and the
 * state colours of the lesson road (done, current = gold, locked). One name per colour keeps every screen identical.
 */
export const GOLD = { face: '#ffd43b', lip: '#dfaa1d', ink: '#5a3a0a', soft: '#ffe46a', border: '#ffd02d', star: '#ffcc26', starInk: '#9b6000', rim: '#fff4b5' } as const;
export const DONE = { face: '#187940', lip: '#116330' } as const;
export const LOCKED = { face: '#a66be5', lip: '#8f52ca', badge: '#6332b2' } as const;
export const BRAND = { main: '#7436d8', hero: '#8746df', deep: '#6130aa' } as const;
