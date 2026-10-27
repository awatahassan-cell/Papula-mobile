import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Play, Volume2 } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { CharacterPicture } from '../../components/CharacterPicture';
import { TactileButton } from '../../components/TactileButton';
import { useReducedMotion } from '../../components/Motion';
import { useAppearance } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { soundService } from '../../services/soundService';
import { introWords } from '../../services/letterIntro';
import { SPOKEN_GUIDES } from '../../data/spokenGuides';
import { mockLetters } from '../../data/mockLetters';

type Letter = (typeof mockLetters)[number];
const REPEATS = 3, SAFETY_MS = 7000;

/**
 * The start of a letter's journey, all by ear: the letter is said a few times, then «the letter is in these words»
 * and five pictures are named one by one. Only then does the practice begin.
 */
export function LetterIntro({ letter, onDone }: { letter: Letter; onDone: () => void }) {
  const { colors: c, isNight } = useAppearance();
  const reduced = useReducedMotion();
  const words = useMemo(() => introWords(letter, text => soundService.canSpeak(text)), [letter]);
  const [stage, setStage] = useState<'letter' | 'words'>('letter');
  const [heard, setHeard] = useState(0), [current, setCurrent] = useState(-1), [again, setAgain] = useState(0);
  const [pulse] = useState(() => new Animated.Value(0));
  const run = useRef(0), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const stopAll = () => { run.current++; timers.current.forEach(clearTimeout); timers.current = []; void soundService.stopSpeaking(); };
  useEffect(() => stopAll, []);
  useEffect(() => {
    if (reduced) return;
    const config = { duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web', isInteraction: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { ...config, toValue: 1 }), Animated.timing(pulse, { ...config, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  /** Says one thing and carries on when it ends; a missing or stuck recording never holds the child up. */
  const speak = (token: number, text: string, options: Record<string, unknown>, next: () => void) => {
    if (token !== run.current) return;
    let moved = false;
    const go = () => { if (moved || token !== run.current) return; moved = true; next(); };
    later(go, SAFETY_MS);
    void soundService.speakWord(text, { ...options, onEnd: () => later(go, 350), onError: go });
  };
  useEffect(() => {
    stopAll();
    const token = run.current;
    if (stage === 'letter') {
      const say = (n: number) => {
        if (token !== run.current) return;
        if (n === REPEATS) { setStage('words'); return; }
        setHeard(n + 1);
        speak(token, letter.glyph, { letterName: letter.name }, () => say(n + 1));
      };
      later(() => say(0), 400);
    } else {
      const parts: { text: string; index: number; letterName?: string }[] = [
        { text: `پیتی ${letter.name}`, index: -1 },
        ...(soundService.canSpeak(SPOKEN_GUIDES.letterWords) ? [{ text: SPOKEN_GUIDES.letterWords, index: -1 }] : []),
        ...words.map((item, index) => ({ text: item.word, index })),
      ].filter(part => part.index >= 0 || soundService.canSpeak(part.text));
      const say = (n: number) => {
        if (token !== run.current) return;
        if (n === parts.length) { setCurrent(-1); return; }
        setCurrent(parts[n].index);
        speak(token, parts[n].text, {}, () => say(n + 1));
      };
      later(() => say(0), 300);
    }
    return stopAll;
  }, [stage, again]); // eslint-disable-line react-hooks/exhaustive-deps

  const fill = accentFill(c, isNight);
  const play = <TactileButton accessibilityRole="button" accessibilityLabel="دەست پێ بکە" onPress={() => { stopAll(); onDone(); }} style={[s.go, { backgroundColor: fill }]}><Play size={40} color="#ffffff" fill="#ffffff" /></TactileButton>;
  const replay = () => { setCurrent(-1); setHeard(0); if (stage === 'letter') setAgain(n => n + 1); else setAgain(n => n + 1); };
  return <ScrollView testID="letter-intro" contentContainerStyle={[s.page, { backgroundColor: c.background }]}>
    <View style={s.top}>
      <TactileButton accessibilityRole="button" accessibilityLabel="دووبارە ببیستە" onPress={replay} style={[s.round, { backgroundColor: c.sky }]}><Volume2 size={30} color={c.mint} /></TactileButton>
      <View style={s.dots}>{[0, 1, 2].map(i => <View key={i} style={[s.dot, { backgroundColor: stage === 'words' || i < heard ? c.mint : c.edge }]} />)}</View>
    </View>
    {stage === 'letter'
      ? <Animated.View style={[s.bigCard, { backgroundColor: c.paper, borderColor: c.mint, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }]}><Text style={[s.huge, { color: c.ink }]}>{letter.glyph}</Text></Animated.View>
      : <>
        <View style={[s.smallCard, { backgroundColor: c.paper, borderColor: c.mint }]}><Text style={[s.mid, { color: c.ink }]}>{letter.glyph}</Text></View>
        <View style={s.grid}>{words.map((item, i) => <TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={item.word} onPress={() => { stopAll(); setCurrent(i); void soundService.speakWord(item.word); }}
          style={[s.word, { backgroundColor: c.paper, borderColor: current === i ? '#f59e0b' : c.edge }, current === i && s.on]}>
          <CharacterPicture symbol={item.picture} size={72} animate={false} /><Text style={[s.wordText, { color: c.ink }]}>{item.word}</Text></TactileButton>)}</View>
      </>}
    {play}
  </ScrollView>;
}

const s = StyleSheet.create({
  page: { flexGrow: 1, padding: 14, gap: 14, alignItems: 'center', width: '100%', maxWidth: 650, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  round: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 9 }, dot: { width: 27, height: 11, borderRadius: 6 },
  bigCard: { width: '100%', minHeight: 300, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  huge: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 190, lineHeight: 250, textAlign: 'center' },
  smallCard: { minWidth: 120, paddingHorizontal: 24, borderRadius: 28, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  mid: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 76, lineHeight: 104, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  word: { width: '30%', minWidth: 100, flexGrow: 1, minHeight: 126, borderRadius: 24, borderWidth: 4, borderBottomWidth: 7, alignItems: 'center', justifyContent: 'center', gap: 2, padding: 6 },
  on: { transform: [{ scale: 1.07 }] },
  wordText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19, textAlign: 'center' },
  go: { width: '100%', maxWidth: 360, minHeight: 72, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' },
});
