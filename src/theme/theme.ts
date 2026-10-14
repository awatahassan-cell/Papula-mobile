/**
 * Theme tokens for the Kurdish Kids App (پەپوولە)
 * Playful, soft, high-contrast, child-friendly tokens.
 */

export const colors = {
  primary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // warm golden amber
    600: '#d97706',
    700: '#b45309',
  },
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    300: '#6ee7b7',
    500: '#10b981', // friendly mint green
    600: '#059669',
  },
  coral: {
    50: '#fff1f2',
    100: '#ffe4e6',
    400: '#fb7185',
    500: '#f43f5e', // playful coral/rose
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    300: '#7dd3fc',
    500: '#0ea5e9', // bright sky blue
    600: '#0284c7',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    400: '#c084fc',
    500: '#a855f7', // royal purple
  },
  chalkboard: {
    bg: '#1e293b',
    guide: 'rgba(255, 255, 255, 0.25)',
    activeStroke: '#38bdf8',
    successStroke: '#4ade80',
  },
  background: '#fffdf7',
  cardBg: '#ffffff',
  text: {
    main: '#1e293b',
    muted: '#64748b',
    light: '#94a3b8',
    inverted: '#ffffff',
  },
} as const;

export const spacing = {
  touchMin: 64, // Touch target at least 64pt for children
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const typography = {
  fontFamily: "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif",
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
    huge: 72,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
};
