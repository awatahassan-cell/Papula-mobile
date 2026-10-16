import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAppearanceColors, normalizeAppearanceMode, normalizeAppearanceTheme, resolveAppearanceMode, resolveAppearanceStyles } from './appearance';

export function useAppearance() {
  const { parentSettings } = useAppStore();
  const appearanceTheme = normalizeAppearanceTheme(parentSettings?.appearanceTheme);
  const appearanceMode = normalizeAppearanceMode(parentSettings?.appearanceMode);
  // «auto» is evaluated whenever a screen renders, which is often enough for a 19:00 / 06:00 switch.
  const mode = resolveAppearanceMode(appearanceMode);
  return { appearanceTheme, appearanceMode, mode, isNight: mode === 'night', isGarden: true, colors: getAppearanceColors(appearanceTheme, mode) };
}

export function useThemeStyles<T extends Record<string, object>>(original: T): T {
  const { appearanceTheme, mode } = useAppearance();
  return useMemo(() => resolveAppearanceStyles(original, appearanceTheme, mode), [original, appearanceTheme, mode]);
}
