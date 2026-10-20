import React, { useEffect } from 'react';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LaunchScreen } from '../components/LaunchScreen';
import { AppErrorScreen } from '../components/AppErrorScreen';
import { rtlProps, rtlLayout } from '../theme/rtl';
import { PapulaMascot } from '../components/PapulaMascot';
import { ReactionOverlay } from '../components/ReactionOverlay';
import { AmbientSky } from '../components/AmbientSky';
import { View, StyleSheet, StatusBar, I18nManager, BackHandler, Modal } from 'react-native';
import { Text } from '../components/RTLText';
import { TactileButton as TouchableOpacity } from '../components/TactileButton';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { LinearGradient } from 'expo-linear-gradient';
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
import { soundService } from '../services/soundService';
import { sectionIntroductions } from '../services/sectionIntroductions';
import { useSessionGuard } from '../components/useSessionGuard';
import { SaveStatusBanner } from '../components/SaveStatusBanner';
import { HelpButton } from '../components/HelpButton';

/** Any screen error lands here instead of a blank screen. */
export const ErrorBoundary = AppErrorScreen;

void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 350, fade: true });
const hideNativeSplash = () => { void SplashScreen.hideAsync().catch(() => {}); };

try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch (e) {
  console.warn(e);
}

// The navigator would otherwise paint its own grey page over the gradient.
const TRANSPARENT_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent' } };

const MainRouter: React.FC = () => {
  const { isGarden, isNight, colors: appearanceColors, extras } = useAppearance();
  const {
    route,
    isHydrated, loadError, retryLoad,
    openParentGateWithCallback,
    setRoute,
    goBack,
    exitConfirmOpen,
    setExitConfirmOpen,
    allMissionsCelebrationOpen,
    setAllMissionsCelebrationOpen,
    profiles,
  } = useAppStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (profiles.length === 0 && route !== 'onboarding') {
      setRoute('onboarding');
    }
  }, [isHydrated, profiles.length, route, setRoute]);

  const { tablet } = useResponsive();
  const session = useSessionGuard();
  const isBedtimeActive = session.bedtime;

  useEffect(() => {
    const text = sectionIntroductions[route];
    if (!isHydrated || !text || session.blocked || exitConfirmOpen) return;
    const timer = setTimeout(() => { void soundService.speakWord(text); }, 200);
    return () => clearTimeout(timer);
  }, [route, isHydrated, session.blocked, exitConfirmOpen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  if (!isHydrated) return <LaunchScreen error={loadError} onRetry={retryLoad} onLayout={hideNativeSplash} />;

  const bedtimeOverlay = session.blocked ? (
      <View {...rtlProps} style={[styles.bedtimeContainer, styles.overlay, rtlLayout]}>
        <View style={styles.bedtimeCard}>
          <PapulaMascot size={140} mood="sleepy" />
          <Text style={styles.bedtimeTitle}>{isBedtimeActive ? 'کاتی خەوتنی منداڵانە' : session.exhausted ? 'ئەمڕۆ زۆر باش مەشقت کرد!' : 'کاتی پشووە'}</Text>
          <Text style={styles.bedtimeSub}>
            {isBedtimeActive ? 'خەوێکی ئاسوودە بۆ تۆی شیرین! لە کاتی دیاریکراودا پێکەوە بەردەوام دەبین.' : session.exhausted ? 'کاتی فێربوونی ئەمڕۆ تەواو بوو. ئێستا پشوو بدە؛ سبەی لە شوێنی خۆت بەردەوام دەبین.' : 'چاو و دەستەکانت پشوو بدە. هەر کاتێک ئامادە بوویت، بەردەوام دەبین.'}
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
            کردنەوە لەلایەن دایک و باوک
          </BigButton>
          {!isBedtimeActive && !session.exhausted && <BigButton onPress={session.continueLearning} style={styles.bedtimeBtn}>ئامادەم، بەردەوام بین</BigButton>}
        </View>
      </View>
  ) : null;

  return (
    <SafeAreaView {...rtlProps} onTouchStart={session.touch} style={[styles.safeArea, rtlLayout, isGarden && { backgroundColor: appearanceColors.background }]} edges={isGarden ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <LinearGradient pointerEvents="none" colors={extras.gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle={isNight ? 'light-content' : 'dark-content'} backgroundColor={isGarden ? appearanceColors.background : '#ffffff'} />
      {route !== 'onboarding' && <TopHeader />}
      <SaveStatusBanner />
      {!!sectionIntroductions[route] && !['letter-detail','story-reader','match-game'].includes(route) && <HelpButton key={route} text={sectionIntroductions[route]} />}
      {session.warning && <TouchableOpacity accessibilityRole="button" onPress={session.takeBreak} style={{ padding: 10, backgroundColor: appearanceColors.peach }}><Text style={{ color: appearanceColors.ink, textAlign: 'center' }}>دوو خولەک یان کەمتر ماوە؛ با پاشان پشوو بدەین. پشوو بدەم</Text></TouchableOpacity>}
      {/* Phones: tab bar under the content. Tablets: a rail on the right (first child of an RTL row). */}
      <View style={[styles.body, tablet && styles.bodyRow]}>
        {tablet && <GardenNavigation />}
        <View style={styles.main}>
          <GardenPageHeader />
          <View {...rtlProps} style={[styles.screenContainer, rtlLayout, isGarden && { backgroundColor: 'transparent' }]}>
            <ThemeProvider value={TRANSPARENT_THEME}>
              <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: appearanceColors.background, ...rtlLayout } }} />
            </ThemeProvider>
          </View>
          {!tablet && <GardenNavigation />}
          <AmbientSky />
        </View>
      </View>

      {/* Global Modals */}
      <ParentGateModal />
      <PaywallModal />
      <ReactionOverlay />
      <DailyMissionsRewardCelebration
        isOpen={allMissionsCelebrationOpen}
        onClose={() => setAllMissionsCelebrationOpen(false)}
      />
      {exitConfirmOpen && (
        <Modal transparent animationType="fade" visible={exitConfirmOpen} onRequestClose={() => setExitConfirmOpen(false)}>
          <View {...rtlProps} style={[styles.exitBackdrop, rtlLayout]}>
            <View style={[styles.exitCard, { backgroundColor: appearanceColors.paper, borderColor: appearanceColors.edge }]}>
              <PapulaMascot size={78} mood="sad" />
              <Text style={[styles.exitTitle, { color: appearanceColors.ink }]}>بەڕاستی دەتەوێت دەربچیت؟</Text>
              <Text style={[styles.exitSubtitle, { color: appearanceColors.muted }]}>
                پەپوولە چاوەڕێی گەڕانەوەت دەکات بۆ فێربوونی زیاتر!
              </Text>
              <View style={styles.exitBtnRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="نەخێر، بمێنەوە"
                  onPress={() => setExitConfirmOpen(false)}
                  style={[styles.exitStayBtn, { backgroundColor: appearanceColors.mint, borderBottomColor: appearanceColors.mintDark }]}
                >
                  <Text style={styles.exitStayText}>نەخێر، بمێنەوە</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="بەڵێ، دەرچوون"
                  onPress={() => {
                    setExitConfirmOpen(false);
                    BackHandler.exitApp();
                  }}
                  style={[styles.exitLeaveBtn, { backgroundColor: appearanceColors.lavender, borderColor: appearanceColors.edge }]}
                >
                  <Text style={[styles.exitLeaveText, { color: appearanceColors.ink }]}>بەڵێ، دەرچوون</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {bedtimeOverlay}
    </SafeAreaView>
  );
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  const [fontTimeout, setFontTimeout] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFontTimeout(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError && !fontTimeout) return <LaunchScreen fontsReady={false} onLayout={hideNativeSplash} />;

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
  exitBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 43, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  exitCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    elevation: 10,
  },
  exitTitle: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 21,
    textAlign: 'center',
  },
  exitSubtitle: {
    fontFamily: 'IBMPlexSansArabic_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  exitBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  exitStayBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  exitStayText: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  exitLeaveBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  exitLeaveText: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 15,
  },
});
