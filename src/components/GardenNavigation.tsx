import { TactileButton as TouchableOpacity } from './TactileButton';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { Compass, BookOpen, Puzzle, Route, Flower2 } from 'lucide-react-native';
import { useAppStore, AppRoute } from '../store/useAppStore';
import { useAppearance } from '../theme/useAppearance';
import { soundService } from '../services/soundService';
import { useResponsive } from '../theme/responsive';

const tabs = [
  { route: 'home', label: 'ماڵەوە', Icon: Compass },
  { route: 'alphabet', label: 'ڕێڕەو', Icon: Route },
  { route: 'stories', label: 'چیرۆک', Icon: BookOpen },
  { route: 'match-game', label: 'یاری', Icon: Puzzle },
  { route: 'garden', label: 'باخچە', Icon: Flower2 },
] as const;

export function GardenNavigation() {
  const { route, setRoute } = useAppStore();
  const { isGarden, colors: c, isNight, extras } = useAppearance();
  const { tablet } = useResponsive();

  if (!isGarden || !['home', 'alphabet', 'stories', 'match-game', 'daily-practice', 'stickers', 'badges', 'my-words', 'garden'].includes(route)) {
    return null;
  }

  return (
    <View style={tablet ? styles.railWrap : styles.dockOuter}>
      <View
        style={[
          styles.nav,
          { backgroundColor: c.paper, borderColor: c.edge, shadowColor: isNight ? '#000000' : c.mintDark },
          tablet && styles.navTablet,
        ]}
      >
        {tabs.map(({ route: destination, label, Icon }) => {
          const active = route === destination;
          const activeBg = isNight ? extras.cta : c.mint;
          const activeLip = isNight ? '#d4a72c' : c.mintDark;
          const activeInk = isNight ? extras.ctaText : '#ffffff';

          return (
            <TouchableOpacity
              key={destination}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                void soundService.stopSpeaking();
                setRoute(destination as AppRoute);
              }}
              style={[
                styles.tab,
                tablet && styles.tabTablet,
                active && {
                  backgroundColor: activeBg,
                  borderBottomWidth: 4,
                  borderBottomColor: activeLip,
                },
              ]}
            >
              <Icon size={21} strokeWidth={active ? 2.6 : 2.2} color={active ? activeInk : c.mint} />
              <Text
                style={[
                  styles.label,
                  { color: active ? activeInk : c.muted },
                  active && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockOuter: {
    width: '100%',
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 4,
    alignItems: 'center',
  },
  railWrap: {
    alignSelf: 'stretch',
  },
  nav: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 2,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    padding: 6,
    gap: 6,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    minHeight: 54,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    gap: 2,
  },
  navTablet: {
    borderRadius: 0,
    flexDirection: 'column',
    width: 116,
    maxWidth: 116,
    flex: 1,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderLeftWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 10,
    justifyContent: 'flex-start',
  },
  tabTablet: {
    flex: 0,
    width: '100%',
    minHeight: 82,
    flexDirection: 'column',
    gap: 6,
    paddingVertical: 10,
  },
  label: {
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    fontSize: 12,
  },
  labelActive: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
  },
});
