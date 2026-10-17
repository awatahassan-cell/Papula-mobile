import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAppearanceColors, getAppearanceExtras, normalizeAppearanceMode, normalizeAppearanceTheme, resolveAppearanceMode, resolveAppearanceStyles } from './appearance';

// Hard-coded icon colours chosen for a light card: swap them for a readable equivalent on the page in use.
const DAY_TONE: Record<string, string> = { '#94a3b8': '#64748b', '#f59e0b': '#b45309', '#d97706': '#b45309', '#d79b35': '#9a6a12', '#ea580c': '#c2410c', '#eeb259': '#b7791f' };
const NIGHT_TONE: Record<string, string> = {
  '#94a3b8': '#b8c0e0', '#64748b': '#b8c0e0', '#334155': '#f4f1ff', '#1e293b': '#f4f1ff', '#0f172a': '#f4f1ff',
  '#f59e0b': '#ffd66b', '#d97706': '#ffd66b', '#d79b35': '#ffd66b', '#a36b17': '#ffd66b', '#92400e': '#ffd66b', '#78350f': '#ffd66b', '#ea580c': '#ffb26b',
  '#15803d': '#6ee7a8', '#166534': '#9af0be', '#0369a1': '#7cc4ff', '#ef4444': '#ff8a8a',
};

export function useAppearance() {
  const { parentSettings } = useAppStore();
  const appearanceTheme = normalizeAppearanceTheme(parentSettings?.appearanceTheme);
  const appearanceMode = normalizeAppearanceMode(parentSettings?.appearanceMode);
  // «auto» is evaluated whenever a screen renders, which is often enough for a 19:00 / 06:00 switch.
  const mode = resolveAppearanceMode(appearanceMode);
  const isNight = mode === 'night';
  const tone = (color: string) => (isNight ? NIGHT_TONE : DAY_TONE)[color.toLowerCase()] ?? color;
  return { appearanceTheme, appearanceMode, mode, isNight, tone, isGarden: true, colors: getAppearanceColors(appearanceTheme, mode), extras: getAppearanceExtras(appearanceTheme, mode) };
}

export function useThemeStyles<T extends Record<string, object>>(original: T): T {
  const { appearanceTheme, mode } = useAppearance();
  return useMemo(() => resolveAppearanceStyles(original, appearanceTheme, mode), [original, appearanceTheme, mode]);
}
