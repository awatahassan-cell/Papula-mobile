import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BUTTERFLY_MOODS, Mood } from './butterflyMoods';
import { useReducedMotion } from './Motion';

export type { Mood } from './butterflyMoods';
const native = Platform.OS !== 'web';

/**
 * The Papula butterfly in six moods (happy, angry, sad, surprised, sleepy, calm). Local vector artwork: crisp at any
 * size and offline. `size` is the width; the wings flap gently unless the device asks for reduced motion.
 */
export function PapulaMascot({ size = 120, mood = 'happy', flap = true, art: custom }: { size?: number; mood?: Mood; flap?: boolean; art?: { wings: string; body: string } }) {
  const reduced = useReducedMotion();
  const [wing] = useState(() => new Animated.Value(0));
  const still = reduced || !flap;
  const slow = mood === 'sleepy' || mood === 'sad';
  useEffect(() => {
    if (still) { wing.setValue(0); return; }
    const config = { duration: slow ? 1500 : 650, easing: Easing.inOut(Easing.sin), useNativeDriver: native, isInteraction: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(wing, { ...config, toValue: 1 }), Animated.timing(wing, { ...config, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [still, slow, wing]);
  const art = custom ? { ...BUTTERFLY_MOODS[mood], ...custom } : BUTTERFLY_MOODS[mood], height = (size * 290) / 320;
  return <View accessible accessibilityRole="image" accessibilityLabel={art.label} style={{ width: size, height }}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ scaleX: wing.interpolate({ inputRange: [0, 1], outputRange: [1, slow ? 0.94 : 0.84] }) }] }]}><SvgXml xml={art.wings} width={size} height={height} /></Animated.View>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><SvgXml xml={art.body} width={size} height={height} /></View>
  </View>;
}
