import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { Home, BookOpen, Puzzle, Shapes } from 'lucide-react-native';
import { useAppStore, AppRoute } from '../store/useAppStore';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
import { soundService } from '../services/soundService';

const tabs = [
  { route: 'home', label: 'ماڵەوە', Icon: Home }, { route: 'alphabet', label: 'ڕێڕەو', Icon: Shapes },
  { route: 'stories', label: 'چیرۆک', Icon: BookOpen }, { route: 'match-game', label: 'یاری', Icon: Puzzle },
] as const;
export function GardenNavigation() {
  const { route, setRoute } = useAppStore();
  const { isGarden,colors:c } = useAppearance();
  const styles=useThemeStyles(baseStyles);
  if (!isGarden || !['home', 'alphabet', 'stories', 'match-game', 'daily-practice', 'stickers', 'badges', 'my-words'].includes(route)) return null;
  return <View style={styles.nav}>{tabs.map(({ route: destination, label, Icon }) => <TouchableOpacity key={destination}
    accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: route === destination }}
    onPress={() => { void soundService.stopSpeaking(); setRoute(destination as AppRoute); }} style={[styles.tab, route === destination && styles.selected]}>
    <Icon size={23} color={route === destination ? c.ink : c.muted} /><Text style={styles.label}>{label}</Text>
  </TouchableOpacity>)}</View>;
}
const baseStyles = StyleSheet.create({
  nav: { flexDirection: 'row', direction: 'rtl', backgroundColor: c.paper, borderTopWidth: 1, borderColor: c.edge, padding: 8, gap: 6, width: '100%', maxWidth: 840, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 20, gap: 4 },
  selected: { backgroundColor: c.lavender },
  label: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 12, color: c.ink },
});
