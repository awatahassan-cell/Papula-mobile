import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { Compass, BookOpen, Puzzle, Route } from 'lucide-react-native';
import { useAppStore, AppRoute } from '../store/useAppStore';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
import { soundService } from '../services/soundService';
import { useResponsive } from '../theme/responsive';

const tabs = [
  { route: 'home', label: 'ماڵەوە', Icon: Compass }, { route: 'alphabet', label: 'ڕێڕەو', Icon: Route },
  { route: 'stories', label: 'چیرۆک', Icon: BookOpen }, { route: 'match-game', label: 'یاری', Icon: Puzzle },
] as const;
export function GardenNavigation() {
  const { route, setRoute } = useAppStore();
  const { isGarden,colors:c,isNight,extras } = useAppearance();
  const styles=useThemeStyles(baseStyles);
  const { tablet } = useResponsive();
  if (!isGarden || !['home', 'alphabet', 'stories', 'match-game', 'daily-practice', 'stickers', 'badges', 'my-words'].includes(route)) return null;
  return <View style={[styles.nav, tablet && styles.navTablet]}>{tabs.map(({ route: destination, label, Icon }) => <TouchableOpacity key={destination}
    accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: route === destination }}
    onPress={() => { void soundService.stopSpeaking(); setRoute(destination as AppRoute); }} style={[styles.tab, tablet && styles.tabTablet, route === destination && (isNight ? { backgroundColor: extras.cta } : tablet ? styles.selected : null)]}>
    <View style={[styles.iconFrame, { backgroundColor: route === destination ? '#ffd43b' : c.lavender }]}><Icon size={23} strokeWidth={2.3} color={route === destination ? '#5a3a0a' : c.mint} /></View>
    <Text style={[styles.label, route === destination && { color: isNight ? extras.ctaText : c.mint, fontFamily: 'IBMPlexSansArabic_700Bold' }]}>{label}</Text>
    {route === destination && !isNight && !tablet && <View style={[styles.dot, { backgroundColor: c.mint }]} />}
  </TouchableOpacity>)}</View>;
}
const baseStyles = StyleSheet.create({
  iconFrame: { width: 40, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', backgroundColor: c.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: c.mintDark, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 12, padding: 8, paddingBottom: 12, gap: 6, width: '100%', maxWidth: 840, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 20, gap: 4 },
  // Tablets: a vertical rail on the reading-start (right) edge.
  navTablet: { borderTopLeftRadius: 0, borderTopRightRadius: 0, flexDirection: 'column', width: 116, maxWidth: 116, alignSelf: 'stretch', borderTopWidth: 0, borderLeftWidth: 1, paddingVertical: 16, paddingHorizontal: 10, gap: 10, justifyContent: 'flex-start' },
  tabTablet: { flex: 0, width: '100%', minHeight: 88, flexDirection: 'column', gap: 6, paddingVertical: 10 },
  dot: { width: 18, height: 4, borderRadius: 3 },
  selected: { backgroundColor: c.lavender },
  label: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 12, color: c.ink },
});
