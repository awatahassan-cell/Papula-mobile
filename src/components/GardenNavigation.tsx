import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { Home, BookOpen, Puzzle, Shapes } from 'lucide-react-native';
import { useAppStore, AppRoute } from '../store/useAppStore';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
import { soundService } from '../services/soundService';
import { useResponsive } from '../theme/responsive';
import { usePressSink } from './Motion';

const tabs = [
  { route: 'home', label: 'ماڵەوە', Icon: Home }, { route: 'alphabet', label: 'ڕێڕەو', Icon: Shapes },
  { route: 'stories', label: 'چیرۆک', Icon: BookOpen }, { route: 'match-game', label: 'یاری', Icon: Puzzle },
] as const;
export function GardenNavigation() {
  const { route, setRoute } = useAppStore();
  const { isGarden, isNight } = useAppearance();
  const styles=useThemeStyles(baseStyles);
  const { tablet } = useResponsive();
  if (!isGarden || !['home', 'alphabet', 'stories', 'match-game', 'daily-practice', 'stickers', 'badges', 'my-words'].includes(route)) return null;
  return <View style={[styles.nav, tablet && styles.navTablet]}>{tabs.map(({ route: destination, label, Icon }) => {
    const active = route === destination;
    return <NavTab key={destination} label={label} Icon={Icon} active={active} tablet={tablet} isNight={isNight}
      onPress={() => { void soundService.stopSpeaking(); setRoute(destination as AppRoute); }} />;
  })}</View>;
}

// One tab: it sinks like a real button while the finger is down.
function NavTab({ label, Icon, active, tablet, isNight, onPress }: { label: string; Icon: typeof Home; active: boolean; tablet: boolean; isNight: boolean; onPress: () => void }) {
  const { colors: c, extras } = useAppearance();
  const styles = useThemeStyles(baseStyles);
  const press = usePressSink(active);
  const tint = active ? (isNight ? extras.ctaText : c.mint) : c.muted;
  return <TouchableOpacity accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }} activeOpacity={0.9}
    onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}
    style={[styles.tab, tablet && styles.tabTablet, active && (isNight ? { backgroundColor: extras.cta } : styles.selected), press.sinkStyle, !active && press.pressed && { backgroundColor: isNight ? 'rgba(255,255,255,0.12)' : c.lavender }]}>
    <Icon size={23} color={tint} />
    <Text style={[styles.label, active && { color: tint, fontFamily: 'IBMPlexSansArabic_700Bold' }]}>{label}</Text>
  </TouchableOpacity>;
}
const baseStyles = StyleSheet.create({
  nav: { flexDirection: 'row', direction: 'rtl', backgroundColor: c.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: c.mintDark, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 12, padding: 8, paddingBottom: 12, gap: 6, width: '100%', maxWidth: 840, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 20, gap: 4 },
  // Tablets: a vertical rail on the reading-start (right) edge.
  navTablet: { borderTopLeftRadius: 0, borderTopRightRadius: 0, flexDirection: 'column', width: 116, maxWidth: 116, alignSelf: 'stretch', borderTopWidth: 0, borderLeftWidth: 1, paddingVertical: 16, paddingHorizontal: 10, gap: 10, justifyContent: 'flex-start' },
  tabTablet: { flex: 0, width: '100%', minHeight: 88, flexDirection: 'column', gap: 6, paddingVertical: 10 },
  dot: { width: 18, height: 4, borderRadius: 3 },
  selected: { backgroundColor: c.lavender },
  label: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 12, color: c.ink },
});
