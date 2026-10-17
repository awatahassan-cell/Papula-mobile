import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from './RTLText';
import { PapulaMascot, Mood } from './PapulaMascot';
import { useReducedMotion } from './Motion';
import { useAppearance } from '../theme/useAppearance';
import { soundService } from '../services/soundService';
import { haptics } from '../services/haptics';

type Cue = 'correct' | 'wrong' | 'fanfare';
const native = Platform.OS !== 'web';
const COPY: Record<Cue, { text: string; mood: Mood; ms: number }> = {
  correct: { text: 'ئافەرین!', mood: 'happy', ms: 1250 },
  fanfare: { text: 'پیرۆزە!', mood: 'surprised', ms: 1900 },
  wrong: { text: 'هەوڵ بدەرەوە، دەتوانیت!', mood: 'sad', ms: 1100 },
};
const CONFETTI = ['#ffd43b', '#ff69a8', '#5eead4', '#ffffff', '#ff9c87', '#a78bfa'];

/**
 * Full-screen reaction: when an answer is right the whole screen takes the app colours and the happy butterfly
 * bounces in with confetti; a wrong answer gets a soft, sad butterfly. It never blocks touches and fades away by itself.
 */
export function ReactionOverlay() {
  const { isNight, extras } = useAppearance();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [cue, setCue] = useState<Cue | null>(null);
  const [round, setRound] = useState(0);
  const [fade] = useState(() => new Animated.Value(0)), [pop] = useState(() => new Animated.Value(0)), [fall] = useState(() => new Animated.Value(0));
  const lastAt = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => soundService.onCue(next => {
    const now = Date.now();
    if (now - lastAt.current < 700 && next !== 'fanfare') return; // quick repeated answers must not flicker
    lastAt.current = now;
    if (next === 'wrong') haptics.tryAgain(); else haptics.success();
    if (timer.current) clearTimeout(timer.current);
    setCue(next); setRound(r => r + 1);
  }), []);

  useEffect(() => {
    if (!cue) return;
    const { ms } = COPY[cue];
    fade.setValue(0); pop.setValue(0); fall.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: reduced ? 1 : 170, useNativeDriver: native }),
      Animated.spring(pop, { toValue: 1, friction: 4.5, tension: 120, useNativeDriver: native }),
      Animated.timing(fall, { toValue: 1, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: native }),
    ]).start();
    timer.current = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: reduced ? 1 : 280, useNativeDriver: native }).start(() => setCue(null));
    }, ms);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    x: ((i * 47) % 100) / 100, delay: (i % 5) * 0.05, size: 8 + (i % 4) * 4, color: CONFETTI[i % CONFETTI.length], star: i % 3 === 0, drift: ((i % 7) - 3) * 14, spin: 120 + i * 30,
  })), []);

  if (!cue) return null;
  const copy = COPY[cue], glad = cue !== 'wrong';
  const side = Math.min(width * 0.72, 330);
  const colors: [string, string] = glad ? (isNight ? ['#4b2fb8', '#6a4cf0'] : extras.hero) : (isNight ? ['#1a1570', '#241c80'] : ['#5b6b8c', '#7b88a8']);
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.root, { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, glad ? 1 : 0.92] }) }]}>
    <LinearGradient colors={colors} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
    {glad && !reduced && pieces.map((piece, i) => <Animated.View key={i} style={{ position: 'absolute', left: piece.x * width, top: -30, opacity: fall.interpolate({ inputRange: [0, 0.08 + piece.delay, 0.85, 1], outputRange: [0, 1, 1, 0] }),
      transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height + 60 - i * 6] }) }, { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] }) }, { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] }) }] }}>
      <Svg width={piece.size * 1.6} height={piece.size * 1.6} viewBox="0 0 20 20">{piece.star ? <Path d="M10 1 L12.6 7.4 L19 10 L12.6 12.6 L10 19 L7.4 12.6 L1 10 L7.4 7.4Z" fill={piece.color} /> : <Circle cx="10" cy="10" r="7" fill={piece.color} />}</Svg>
    </Animated.View>)}
    <View style={s.center}>
      <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
        <PapulaMascot size={glad ? side : side * 0.7} mood={copy.mood} />
      </Animated.View>
      <Animated.View style={{ opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <Text style={[s.text, glad ? s.big : s.small]}>{copy.text}</Text>
      </Animated.View>
    </View>
  </Animated.View>;
}

const s = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', zIndex: 999, elevation: 999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontFamily: 'IBMPlexSansArabic_700Bold', color: '#ffffff', textAlign: 'center', paddingHorizontal: 24, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 3 } },
  big: { fontSize: 44 },
  small: { fontSize: 24 },
});
