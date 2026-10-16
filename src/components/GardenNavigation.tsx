import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { Home, BookOpen, Puzzle, Shapes } from 'lucide-react-native';
import { useAppStore, AppRoute } from '../store/useAppStore';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
import { soundService } from '../services/soundService';
import { useResponsive } from '../theme/responsive';

const tabs = [
  { route: 'home', label: 'ماڵەوە', Icon: Home }, { route: 'alphabet', label: 'ڕێڕەو', Icon: Shapes },
  { route: 'stories', label: 'چیرۆک', Icon: BookOpen }, { route: 'match-game', label: 'یاری', Icon: Puzzle },
] as const;
export function GardenNavigation() {
  const { route, setRoute } = useAppStore();
  const { isGarden,colors:c } = useAppearance();
  const styles=useThemeStyles(baseStyles);
  const { tablet } = useResponsive();
  if (!isGarden || !['home', 'alphabet', 'stories', 'match-game', 'daily-practice', 'stickers', 'badges', 'my-words'].includes(route)) return null;
  return <View style={[styles.nav, tablet && styles.navTablet]}>{tabs.map(({ route: destination, label, Icon }) => <TouchableOpacity key={destination}
    accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: route === destination }}
    onPress={() => { void soundService.stopSpeaking(); setRoute(destination as AppRoute); }} style={[styles.tab, tablet && styles.tabTablet, route === destination && styles.selected]}>
    <Icon size={23} color={route === destination ? c.ink : c.muted} /><Text style={styles.label}>{label}</Text>
  </TouchableOpacity>)}</View>;
}
const baseStyles = StyleSheet.create({
  nav: { flexDirection: 'row', direction: 'rtl', backgroundColor: c.paper, borderTopWidth: 1, borderColor: c.edge, padding: 8, gap: 6, width: '100%', maxWidth: 840, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 20, gap: 4 },
  // Tablets: a vertical rail on the reading-start (right) edge.
  navTablet: { flexDirection: 'column', width: 116, maxWidth: 116, alignSelf: 'stretch', borderTopWidth: 0, borderLeftWidth: 1, paddingVertical: 16, paddingHorizontal: 10, gap: 10, justifyContent: 'flex-start' },
  tabTablet: { flex: 0, width: '100%', minHeight: 88, flexDirection: 'column', gap: 6, paddingVertical: 10 },
  selected: { backgroundColor: c.lavender },
  label: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 12, color: c.ink },
});
