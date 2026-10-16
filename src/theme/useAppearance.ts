import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAppearanceColors, normalizeAppearanceTheme, resolveAppearanceStyles } from './appearance';

export function useAppearance() {
  const { parentSettings } = useAppStore();
  const appearanceTheme = normalizeAppearanceTheme(parentSettings?.appearanceTheme);
  return { appearanceTheme, isGarden: true, colors: getAppearanceColors(appearanceTheme) };
}

export function useThemeStyles<T extends Record<string, object>>(original: T): T {
  const { appearanceTheme } = useAppearance();
  return useMemo(() => resolveAppearanceStyles(original, appearanceTheme), [original, appearanceTheme]);
}
