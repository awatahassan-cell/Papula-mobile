import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReducedMotion } from './Motion';
import { useAppearance } from '../theme/useAppearance';

const native = Platform.OS !== 'web';
const STAR = 'M10 1 L12.6 7.4 L19 10 L12.6 12.6 L10 19 L7.4 12.6 L1 10 L7.4 7.4Z';
const CLOUD = 'M12 38 Q2 38 4 28 Q6 20 16 21 Q18 8 32 9 Q40 0 52 8 Q66 6 68 20 Q78 22 74 32 Q72 38 64 38Z';

/**
 * Quiet life over the page at night: a few faint twinkling stars. Screens are opaque (so a page change never shows the
 * previous page through it), which means this sits on top, so it is kept faint and never covers text by day.
 */
export function AmbientSky() {
  const { isNight } = useAppearance();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) { t.setValue(0.5); return; }
    t.setValue(0);
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 26000, easing: Easing.linear, useNativeDriver: native, isInteraction: false }));
    loop.start();
    return () => loop.stop();
  }, [reduced, t]);
  const items = useMemo(() => Array.from({ length: isNight ? 12 : 0 }, (_, i) => ({
    x: ((i * 61 + 13) % 100) / 100, y: ((i * 37 + 9) % 100) / 100, size: isNight ? 10 + (i % 3) * 6 : 90 + (i % 2) * 40, phase: (i % 5) / 5,
  })), [isNight]);
  return <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
    {items.map((item, i) => isNight
      ? <Animated.View key={i} style={{ position: 'absolute', left: item.x * width, top: item.y * height, opacity: t.interpolate({ inputRange: [0, item.phase || 0.001, Math.min(1, item.phase + 0.18), 1], outputRange: [0.1, 0.1, 0.55, 0.1] }) }}><Svg width={item.size} height={item.size} viewBox="0 0 20 20"><Path d={STAR} fill="#fff4b5" /></Svg></Animated.View>
      : <Animated.View key={i} style={{ position: 'absolute', top: item.y * height * 0.8, left: -120, transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [(item.x - 0.4) * width * 0.4, width + 140 + item.phase * 60] }) }] }}><Svg width={item.size} height={item.size * 0.56} viewBox="0 0 78 44"><Path d={CLOUD} fill="#cfe6ff" opacity={0.45} /></Svg></Animated.View>)}
  </View>;
}
