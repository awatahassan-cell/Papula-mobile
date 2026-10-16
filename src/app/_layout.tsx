import React from 'react';
import { Stack } from 'expo-router';
import { rtlProps, rtlLayout } from '../theme/rtl';
import { View, StyleSheet, StatusBar, ActivityIndicator, I18nManager } from 'react-native';
import { Text } from '../components/RTLText';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { AppProvider, useAppStore } from '../store/useAppStore';
import { TopHeader } from '../components/TopHeader';
import { ParentGateModal } from '../components/ParentGateModal';
import { DailyMissionsRewardCelebration } from '../components/DailyMissionsRewardCelebration';
import { PaywallModal } from '../features/paywall/PaywallModal';
import { BigButton } from '../components/BigButton';
import { GardenNavigation } from '../components/GardenNavigation';
import { GardenPageHeader } from '../components/GardenPageHeader';
import { useAppearance } from '../theme/useAppearance';
import { useResponsive } from '../theme/responsive';

try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch (e) {
  console.warn(e);
}

const MainRouter: React.FC = () => {
  const { isGarden, isNight, colors: appearanceColors } = useAppearance();
  const {
    route,
    parentSettings,
    openParentGateWithCallback,
    setRoute,
    allMissionsCelebrationOpen,
    setAllMissionsCelebrationOpen,
  } = useAppStore();

  const { tablet } = useResponsive();
  const isBedtimeActive = parentSettings.bedtimeLockEnabled;

  const bedtimeOverlay = isBedtimeActive && route !== 'parent-dashboard' ? (
      <View {...rtlProps} style={[styles.bedtimeContainer, styles.overlay, rtlLayout]}>
        <View style={styles.bedtimeCard}>
          <Text style={styles.moonEmoji}>🌙</Text>
          <Text style={styles.bedtimeTitle}>کاتی خەوتنی منداڵانە</Text>
          <Text style={styles.bedtimeSub}>
            ئەپڵیکەیشن بەهۆی قفڵی کاتی خەوتنەوە داخراوە. خەوێکی ئاسوودە بۆ تۆی شیرین!
          </Text>

          <BigButton
            onPress={() => {
              openParentGateWithCallback(() => {
                setRoute('parent-dashboard');
              });
            }}
            variant="outline"
            size="md"
            style={styles.bedtimeBtn}
          >
            کردنەوە لەلایەن دایک و باوک 🔒
          </BigButton>
        </View>
      </View>
  ) : null;

  return (
    <SafeAreaView {...rtlProps} style={[styles.safeArea, rtlLayout, isGarden && { backgroundColor: appearanceColors.background }]} edges={isGarden ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <StatusBar barStyle={isNight ? 'light-content' : 'dark-content'} backgroundColor={isGarden ? appearanceColors.background : '#ffffff'} />
      {route !== 'onboarding' && <TopHeader />}
      {/* Phones: tab bar under the content. Tablets: a rail on the right (first child of an RTL row). */}
      <View style={[styles.body, tablet && styles.bodyRow]}>
        {tablet && <GardenNavigation />}
        <View style={styles.main}>
          <GardenPageHeader />
          <View style={[styles.screenContainer, isGarden && { backgroundColor: 'transparent' }]}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: appearanceColors.background } }} />
          </View>
          {!tablet && <GardenNavigation />}
        </View>
      </View>

      {/* Global Modals */}
      <ParentGateModal />
      <PaywallModal />
      <DailyMissionsRewardCelebration
        isOpen={allMissionsCelebrationOpen}
        onClose={() => setAllMissionsCelebrationOpen(false)}
      />
      {bedtimeOverlay}
    </SafeAreaView>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainRouter />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyRow: { flexDirection: 'row' },
  main: { flex: 1, minWidth: 0 },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffdfa',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#fffdfa',
  },
  bedtimeContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bedtimeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    maxWidth: 360,
    width: '100%',
  },
  moonEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  bedtimeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  bedtimeSub: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bedtimeBtn: {
    width: '100%',
  },
});
