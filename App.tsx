import React from 'react';
import { rtlProps, rtlLayout } from './src/theme/rtl';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Text } from './src/components/RTLText';
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
import { AppProvider, useAppStore } from './src/store/useAppStore';
import { TopHeader } from './src/components/TopHeader';
import { ParentGateModal } from './src/components/ParentGateModal';
import { DailyMissionsRewardCelebration } from './src/components/DailyMissionsRewardCelebration';
import { PaywallModal } from './src/features/paywall/PaywallModal';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { AlphabetGridScreen } from './src/features/alphabet/AlphabetGridScreen';
import { LetterDetailScreen } from './src/features/alphabet/LetterDetailScreen';
import { MatchGameScreen } from './src/features/alphabet/MatchGameScreen';
import { WritingScreen } from './src/features/writing/WritingScreen';
import { StoriesListScreen } from './src/features/stories/StoriesListScreen';
import { StoryReaderScreen } from './src/features/stories/StoryReaderScreen';
import { DailyPracticeScreen } from './src/features/daily/DailyPracticeScreen';
import { StickersAlbumScreen } from './src/features/stickers/StickersAlbumScreen';
import { BadgesComponent } from './src/components/BadgesComponent';
import { MyWordsScreen } from './src/features/words/MyWordsScreen';
import { ParentDashboardScreen } from './src/features/parent/ParentDashboardScreen';
import { BigButton } from './src/components/BigButton';
import { GardenNavigation } from './src/components/GardenNavigation';
import { GardenPageHeader } from './src/components/GardenPageHeader';
import { useAppearance } from './src/theme/useAppearance';

const MainRouter: React.FC = () => {
  const { isGarden, colors: appearanceColors } = useAppearance();
  const {
    route,
    parentSettings,
    openParentGateWithCallback,
    setRoute,
    allMissionsCelebrationOpen,
    setAllMissionsCelebrationOpen,
  } = useAppStore();

  const isBedtimeActive = parentSettings.bedtimeLockEnabled;

  if (isBedtimeActive && route !== 'parent-dashboard') {
    return (
      <View {...rtlProps} style={[styles.bedtimeContainer, rtlLayout]}>
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
    );
  }

  return (
    <SafeAreaView {...rtlProps} style={[styles.safeArea, rtlLayout, isGarden && { backgroundColor: appearanceColors.background }]} edges={isGarden ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={isGarden ? appearanceColors.background : '#ffffff'} />
      {route !== 'onboarding' && <TopHeader />}
      <GardenPageHeader />

      <View style={[styles.screenContainer, isGarden && { backgroundColor: 'transparent' }]}>
        {route === 'onboarding' && <OnboardingScreen />}
        {route === 'home' && <HomeScreen />}
        {route === 'alphabet' && <AlphabetGridScreen />}
        {route === 'letter-detail' && <LetterDetailScreen />}
        {route === 'match-game' && <MatchGameScreen />}
        {route === 'writing' && <WritingScreen />}
        {route === 'stories' && <StoriesListScreen />}
        {route === 'story-reader' && <StoryReaderScreen />}
        {route === 'daily-practice' && <DailyPracticeScreen />}
        {route === 'stickers' && <StickersAlbumScreen />}
        {route === 'badges' && (
          <View style={{ padding: 16 }}>
            <BadgesComponent />
          </View>
        )}
        {route === 'my-words' && <MyWordsScreen />}
        {route === 'parent-dashboard' && <ParentDashboardScreen />}
      </View>

      {/* Global Modals */}
      <GardenNavigation />
      <ParentGateModal />
      <PaywallModal />
      <DailyMissionsRewardCelebration
        isOpen={allMissionsCelebrationOpen}
        onClose={() => setAllMissionsCelebrationOpen(false)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainRouter />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
