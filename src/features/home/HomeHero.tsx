import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Volume2 } from 'lucide-react-native';
import { PapulaMascot } from '../../components/PapulaMascot';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { Breathe } from '../../components/Motion';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance } from '../../theme/useAppearance';
import { GOLD } from '../../theme/tokens';
import { soundService } from '../../services/soundService';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { gardenProgress } from '../../services/gardenQuest';
import { nextLessonLetter } from '../../services/lessonPath';
import { mockLetters } from '../../data/mockLetters';
import { needsWelcomeBack } from '../../data/garden';
import { HOME_TEXT as T } from './homeText';

const STRIP = 6;

/**
 * The child's whole home in one glance: Papula (tap to hear the welcome), one very large button showing today's letter,
 * and the flower path as pictures. A six-year-old needs no reading to know what to press.
 */
export function HomeHero() {
  const { currentProfile, setRoute, setSelectedLetter, welcomePetBack } = useAppStore();
  const sleeping = needsWelcomeBack(currentProfile);
  const [greeted, setGreeted] = useState(false); // the welcome stays on screen after the friend wakes up
  const { colors: c, isNight } = useAppearance();
  const current = nextLessonLetter(currentProfile);
  const next = current || mockLetters[mockLetters.length - 1];
  const strip = useMemo(() => {
    const planted = mockLetters.map(letter => gardenProgress(currentProfile, letter.id).flowerSpot !== undefined);
    const at = Math.max(0, Math.min(mockLetters.findIndex(letter => letter.id === next.id) - 2, mockLetters.length - STRIP));
    return mockLetters.slice(at, at + STRIP).map((letter, i) => ({ letter, planted: planted[at + i], now: letter.id === next.id && !!current }));
  }, [currentProfile, next.id, current]);
  const sky: [string, string] = isNight ? ['#26306b', '#3a2e70'] : ['#dff1ff', '#efe6ff'];
  const go = () => { void soundService.stopSpeaking(); if (current) { setSelectedLetter(next); setRoute('garden-quest'); } else setRoute('garden'); };
  return <LinearGradient testID="home-hero" colors={sky} style={s.card}>
    <TactileButton accessibilityRole="button" accessibilityLabel={sleeping ? T.wake : T.hearMe}
      onPress={() => { if (sleeping) { welcomePetBack(); setGreeted(true); } void soundService.speakWord(sectionIntroductions.home); }} style={s.mascot}>
      <PapulaMascot size={150} mood={sleeping ? 'sleepy' : 'happy'} flap={!sleeping} />
      <View style={[s.bubble, { backgroundColor: c.paper, borderColor: c.edge }]}>{sleeping ? <Text style={s.zzz}>💤</Text> : <Volume2 size={26} color={GOLD.starInk} strokeWidth={2.6} />}</View>
    </TactileButton>
    {(sleeping || greeted) && <View style={[s.say, { backgroundColor: c.paper, borderColor: c.edge }]}><Text style={[s.sayText, { color: c.ink }]}>{greeted ? T.welcomeBack : T.sleeping}</Text></View>}
    <Breathe style={s.full}>
      <TactileButton accessibilityRole="button" accessibilityLabel={current ? T.playLabel(next.name) : T.allDone} onPress={go} style={s.play}>
        <View style={s.letterTile}><Text style={s.letter}>{current ? next.glyph : '🌸'}</Text></View>
        <View style={s.flex}><Text style={s.playText}>{current ? T.play : T.allDone}</Text></View>
        <View style={s.round}><Play size={34} color="#ffffff" fill="#ffffff" /></View>
      </TactileButton>
    </Breathe>
    <View accessible accessibilityLabel={T.strip} style={s.strip}>
      {strip.map(item => <View key={item.letter.id} style={[s.slot, item.now && s.slotNow, { backgroundColor: item.now ? GOLD.soft : c.paper, borderColor: item.now ? GOLD.border : c.edge }]}>
        {item.planted ? <Text style={s.slotPic}>🌸</Text> : item.now ? <Text style={s.slotGlyph}>{item.letter.glyph}</Text> : <Text style={[s.slotPic, s.dim]}>🌱</Text>}
      </View>)}
    </View>
  </LinearGradient>;
}

const s = StyleSheet.create({
  card: { width: '100%', maxWidth: 620, alignSelf: 'center', borderRadius: 32, padding: 16, gap: 14, alignItems: 'center' },
  full: { alignSelf: 'stretch' },
  flex: { flex: 1, minWidth: 0 },
  mascot: { minHeight: 150, minWidth: 150, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', top: -4, right: -26, width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  play: { minHeight: 104, borderRadius: 30, backgroundColor: GOLD.face, borderBottomWidth: 6, borderBottomColor: GOLD.lip, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  letterTile: { width: 76, height: 80, borderRadius: 24, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 52, lineHeight: 74, color: '#3b2f63', fontFamily: 'IBMPlexSansArabic_700Bold' },
  playText: { fontSize: 22, color: GOLD.ink, fontFamily: 'IBMPlexSansArabic_700Bold', textAlign: 'center' },
  round: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6d4ae8', alignItems: 'center', justifyContent: 'center' },
  say: { alignSelf: 'stretch', borderRadius: 20, borderWidth: 2, paddingVertical: 8, paddingHorizontal: 14 },
  sayText: { fontSize: 17, textAlign: 'center', fontFamily: 'IBMPlexSansArabic_600SemiBold' },
  zzz: { fontSize: 28 },
  strip: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  slot: { width: 44, height: 52, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  slotNow: { borderWidth: 3 },
  slotPic: { fontSize: 28 }, slotGlyph: { fontSize: 28, lineHeight: 40, color: '#3b2f63', fontFamily: 'IBMPlexSansArabic_700Bold' },
  dim: { opacity: 0.35 },
});
