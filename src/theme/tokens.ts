/**
 * Fixed brand colours that do not change between palettes: the butter-yellow of the main button and stars, and the
 * state colours of the lesson road (done, current = butter, locked). One name per colour keeps every screen identical.
 */
export const GOLD = { face: '#ffd65a', lip: '#e0b232', ink: '#3b2410', soft: '#ffe69a', border: '#f5c93f', star: '#ffc93c', starInk: '#8a5a00', rim: '#fff1b8' } as const;
export const DONE = { face: '#23946a', lip: '#1a7552' } as const;
export const LOCKED = { face: '#9b7df0', lip: '#7f60d8', badge: '#5a3fd6' } as const;
export const BRAND = { main: '#6d4ae8', hero: '#7a52f4', deep: '#4f33b8' } as const;
