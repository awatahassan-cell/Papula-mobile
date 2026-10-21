import React, { createContext, useCallback, useContext, useId, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { TactileButton } from './TactileButton';
import { useAppearance } from '../theme/useAppearance';
import { accentFill } from '../theme/appearance';
import { soundService } from '../services/soundService';
import { useAppStore } from '../store/useAppStore';
import { exerciseHelp } from '../services/exerciseHelp';
import { sectionIntroductions } from '../services/sectionIntroductions';

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

/**
 * The one voice-help button of the app. It lives in the page header (never floating over content, so it can not hide a
 * button), always in the same place, and reads the focused exercise's instructions aloud.
 */
export function HelpPill({ fallbackText, disabled = false }: { fallbackText?: string; disabled?: boolean }) {
  const { colors, isNight } = useAppearance();
  const route = useAppStore().route;
  const hint = useContext(HelpContext)?.hint;
  const unavailable = disabled || !!hint?.disabled;
  const text = hint?.text || fallbackText || (route === 'story-reader' ? exerciseHelp.story : route === 'letter-detail' ? exerciseHelp.letter : sectionIntroductions[route] || sectionIntroductions.home);
  return <TactileButton testID="voice-help-button" accessibilityRole="button" accessibilityLabel="ڕێنمایی دەنگی ببیستە"
    accessibilityState={{ disabled: unavailable }} disabled={unavailable}
    onPress={() => { if (!unavailable) void soundService.speakWord(text); }} style={[styles.button, { backgroundColor: accentFill(colors, isNight), borderBottomColor: colors.mintDark }, unavailable && styles.disabled]}>
    <CircleHelp size={24} color="#ffffff" strokeWidth={2.4} />
  </TactileButton>;
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  disabled: { opacity: 0.45 },
});
