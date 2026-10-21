import React, { createContext, useCallback, useContext, useId, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Volume2 } from 'lucide-react-native';
import { TactileButton } from './TactileButton';
import { useAppearance } from '../theme/useAppearance';
import { accentFill } from '../theme/appearance';
import { soundService } from '../services/soundService';

interface Hint { owner: string; text: string; disabled: boolean; }
interface HelpContextValue { hint: Hint | null; register: (hint: Hint) => () => void; }
const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [hint, setHint] = useState<Hint | null>(null);
  const register = useCallback((next: Hint) => {
    setHint(next);
    // A departing screen must not clear the next screen's instructions.
    return () => setHint(current => current?.owner === next.owner ? null : current);
  }, []);
  const value = useMemo(() => ({ hint, register }), [hint, register]);
  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

/** Supplies the focused exercise's audio to the single, stationary app button. */
export function HelpHint({ text, disabled = false }: { text: string; disabled?: boolean }) {
  const owner = useId();
  const register = useContext(HelpContext)?.register;
  useFocusEffect(useCallback(() => register?.({ owner, text, disabled }), [register, owner, text, disabled]));
  return null;
}

/** Outside every ScrollView and navigator: one position, voice only, on every page. */
export function HelpDock({ fallbackText, disabled = false }: { fallbackText: string; disabled?: boolean }) {
  const { colors, isNight } = useAppearance();
  const hint = useContext(HelpContext)?.hint;
  const unavailable = disabled || !!hint?.disabled;
  const text = hint?.text || fallbackText;
  return <View pointerEvents="box-none" testID="help-dock" style={[styles.dock, { direction: 'ltr' }]}>
    <TactileButton testID="voice-help-button" accessibilityRole="button" accessibilityLabel="ڕێنمایی دەنگی ببیستە"
      accessibilityState={{ disabled: unavailable }} disabled={unavailable}
      onPress={() => { if (!unavailable) void soundService.speakWord(text); }} style={[styles.button, { backgroundColor: accentFill(colors, isNight), borderBottomColor: colors.mintDark }, unavailable && styles.disabled]}>
      <Volume2 size={32} color="#ffffff" strokeWidth={2.4} />
    </TactileButton>
  </View>;
}

const styles = StyleSheet.create({
  dock: { ...StyleSheet.absoluteFill, zIndex: 20 },
  button: { position: 'absolute', left: 16, bottom: 16, width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
  disabled: { opacity: 0.45 },
});
