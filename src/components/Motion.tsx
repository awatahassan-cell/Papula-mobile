import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

/** True while the device asks for less motion; all decorative animation stops. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

const native = Platform.OS !== 'web';

/** A slow, gentle "breathing" pulse that invites a tap on the main button. */
export const Breathe: React.FC<{ children: React.ReactNode; scale?: number; style?: StyleProp<ViewStyle> }> = ({ children, scale = 1.035, style }) => {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    value.setValue(0);
    if (reduced) return;
    const config = { duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: native, isInteraction: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(value, { ...config, toValue: 1 }), Animated.timing(value, { ...config, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [reduced, value]);
  return <Animated.View style={[style, { transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) }] }]}>{children}</Animated.View>;
};

/** Content fades in and rises a little when a screen appears; blocks can be staggered with `delay`. */
export const RiseIn: React.FC<{ children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }> = ({ children, delay = 0, style }) => {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) { value.setValue(1); return; }
    const animation = Animated.timing(value, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [delay, reduced, value]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>{children}</Animated.View>;
};

/** Spring "squish" while pressed, so every button feels alive under a child's finger. */
export function usePressScale(pressed = 0.95) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (target: number) => { if (!reduced) Animated.spring(scale, { toValue: target, friction: 5, tension: 220, useNativeDriver: native }).start(); };
  return { scale, onPressIn: () => to(pressed), onPressOut: () => to(1) };
}
