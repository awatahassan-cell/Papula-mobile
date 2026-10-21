import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { TactileButton } from './TactileButton';
import { Text } from './RTLText';
import { useAppearance } from '../theme/useAppearance';
import { accentFill } from '../theme/appearance';
import { soundService } from '../services/soundService';

/** The same raised purple back control, with an optional destination label. */
export function BackButton({ children, onPress, accessibilityLabel, fullWidth = false, disabled = false, style }: {
  children?: string; onPress: () => void; accessibilityLabel?: string;
  fullWidth?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { colors, isNight } = useAppearance();
  return <TactileButton accessibilityRole="button" accessibilityLabel={accessibilityLabel || children || 'گەڕانەوە'}
    accessibilityState={{ disabled }} disabled={disabled}
    onPress={() => { if (disabled) return; void soundService.stopSpeaking(); onPress(); }}
    style={[s.button, children ? s.labeled : s.square, fullWidth && s.full,
      { backgroundColor: accentFill(colors, isNight), borderBottomColor: colors.mintDark }, style, disabled && s.disabled]}>
    <View pointerEvents="none" style={children ? s.iconWell : undefined}>
      <ArrowRight size={children ? 24 : 27} strokeWidth={2.7} color="#ffffff" />
    </View>
    {!!children && <Text style={s.label}>{children}</Text>}
  </TactileButton>;
}

const s = StyleSheet.create({
  button: { alignSelf: 'flex-start', flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
  square: { width: 54, height: 54, borderRadius: 20 },
  labeled: { minHeight: 56, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  full: { width: '100%', alignSelf: 'stretch' },
  iconWell: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff20' },
  label: { flexShrink: 1, fontSize: 16, lineHeight: 27, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  disabled: { opacity: 0.45 },
});
