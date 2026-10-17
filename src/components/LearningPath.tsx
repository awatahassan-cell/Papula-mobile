import { TactileButton as TouchableOpacity } from './TactileButton';
import { BRAND, DONE, GOLD, LOCKED } from '../theme/tokens';
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Animated, Easing, LayoutChangeEvent, Platform, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Check, Lock, Play, Star } from 'lucide-react-native';
import { Text } from './RTLText';
import { PapulaMascot } from './PapulaMascot';
import { useReducedMotion } from './Motion';
import { useAppStore } from '../store/useAppStore';
import { lessonPath } from '../services/lessonPath';
import { learningLayout } from '../theme/layout';
import { useAppearance } from '../theme/useAppearance';
import { accentFill } from '../theme/appearance';
import { soundService } from '../services/soundService';

const unitNames = ['یەکەم هەنگاوەکان', 'دنیای وشەکان', 'پیتە هاوڕێکان', 'با پێکەوە بخوێنینەوە', 'هەنگاوێک بەرەو پێش', 'باخچەی پیتەکان'];
const native = Platform.OS !== 'web';
const ROW = 138, BANNER = 92, TOP = 18, PER_UNIT = 6;

/** Looping 0→1→0 value; stays still when the device asks for reduced motion. */
function useLoop(duration: number, still: boolean) {
  const [value] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    if (still) { value.setValue(0.5); return; }
    value.setValue(0);
    const config = { duration, easing: Easing.inOut(Easing.sin), useNativeDriver: native, isInteraction: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(value, { ...config, toValue: 1 }), Animated.timing(value, { ...config, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [duration, still, value]);
  return value;
}
/** Pulse that grows and fades out, restarting forever. */
function usePulse(still: boolean) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (still) { value.setValue(0); return; }
    value.setValue(0);
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: native, isInteraction: false }));
    loop.start();
    return () => loop.stop();
  }, [still, value]);
  return value;
}

type Spot = { x: number; y: number };

/** The road snakes from side to side: every lesson sits on a wide S-curve. */
function roadPath(points: Spot[]): string {
  if (!points.length) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], mid = (a.y + b.y) / 2;
    d += ` C ${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`;
  }
  return d;
}

export function LearningPath({ onFocusY }: { preview?: boolean; onFocusY?: (y: number) => void }) {
  const { colors: c, isNight } = useAppearance();
  const { currentProfile, setSelectedLetter, setRoute } = useAppStore();
  const { width: windowWidth } = useWindowDimensions();
  const layout = learningLayout(windowWidth);
  const nodes = lessonPath(currentProfile);
  const reduced = useReducedMotion();
  const drift = useLoop(4200, reduced), twinkle = useLoop(2300, reduced), bob = useLoop(1900, reduced), pulse = usePulse(reduced);
  const [measured, setMeasured] = useState(0);
  const W = Math.max(260, Math.min(measured || windowWidth - layout.padding * 2, 720));
  const N = layout.nodeSize;
  const activeIndex = Math.max(0, nodes.findIndex(node => node.status === 'current'));

  const plan = useMemo(() => {
    let y = TOP;
    const banners: { unit: number; y: number }[] = [], spots: Spot[] = [];
    const amplitude = Math.min(W * 0.32, 150), lo = N / 2 + 10, hi = W - N / 2 - 10;
    nodes.forEach((node, i) => {
      if (i % PER_UNIT === 0) { banners.push({ unit: i / PER_UNIT, y }); y += BANNER + 38; }
      const x = Math.max(lo, Math.min(hi, W / 2 + amplitude * Math.sin(i * 1.05 + 0.35)));
      spots.push({ x, y: y + N / 2 });
      y += ROW;
    });
    return { banners, spots, height: y + 70 };
  }, [nodes.length, W, N]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (onFocusY && plan.spots[activeIndex]) onFocusY(Math.max(0, plan.spots[activeIndex].y - 190)); }, [activeIndex, plan, onFocusY]);

  const road = isNight ? { edge: '#2b2596', body: '#4a43b0', dash: 'rgba(255,255,255,0.45)', trail: '#ffd66b' } : { edge: '#e4c68a', body: '#f6e6bd', dash: '#ffffff', trail: '#7cdb45' };
  // The road is drawn per unit so it never runs through a banner.
  const units = useMemo(() => Array.from({ length: Math.ceil(nodes.length / PER_UNIT) }, (_, u) => plan.spots.slice(u * PER_UNIT, u * PER_UNIT + PER_UNIT)), [plan, nodes.length]);

  const decor = (i: number) => {
    const p = plan.spots[i], right = p.x < W / 2, x = right ? W - 62 : 6, y = p.y - 6, kind = i % 4;
    const sway = drift.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
    const slide = drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
    const glow = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    if (kind === 0) return <Animated.View key={'d' + i} pointerEvents="none" style={[s.decor, { left: x - 8, top: y - 36, transform: [{ translateX: slide }] }]}>
      <Svg width={78} height={44} viewBox="0 0 78 44"><Path d="M12 38 Q2 38 4 28 Q6 20 16 21 Q18 8 32 9 Q40 0 52 8 Q66 6 68 20 Q78 22 74 32 Q72 38 64 38Z" fill={isNight ? '#ffffff' : '#cfe6ff'} opacity={isNight ? 0.22 : 0.9} /></Svg></Animated.View>;
    if (kind === 1) return <Animated.View key={'d' + i} pointerEvents="none" style={[s.decor, { left: x, top: y - 20, transform: [{ rotate: sway }] }]}>
      <Svg width={54} height={72} viewBox="0 0 54 72"><Rect x="23" y="40" width="9" height="30" rx="4" fill="#9a6a3a" /><Circle cx="27" cy="26" r="22" fill={isNight ? '#1f8f6b' : '#43c463'} /><Circle cx="15" cy="34" r="13" fill={isNight ? '#2aa57c' : '#63d77f'} /><Circle cx="40" cy="33" r="14" fill={isNight ? '#2aa57c' : '#63d77f'} /><Circle cx="22" cy="20" r="4" fill={GOLD.face} /><Circle cx="36" cy="27" r="4" fill="#ff69a8" /></Svg></Animated.View>;
    if (kind === 2) return <Animated.View key={'d' + i} pointerEvents="none" style={[s.decor, { left: x, top: y + 8, transform: [{ rotate: sway }] }]}>
      <Svg width={52} height={50} viewBox="0 0 52 50"><Path d="M14 48 V26 M26 48 V16 M38 48 V28" stroke="#3fae5a" strokeWidth="4" strokeLinecap="round" /><Circle cx="14" cy="22" r="8" fill="#ff69a8" /><Circle cx="14" cy="22" r="3" fill={GOLD.soft} /><Circle cx="26" cy="12" r="9" fill={GOLD.face} /><Circle cx="26" cy="12" r="3.4" fill="#ff9c87" /><Circle cx="38" cy="24" r="8" fill="#a064ff" /><Circle cx="38" cy="24" r="3" fill={GOLD.soft} /></Svg></Animated.View>;
    return <Animated.View key={'d' + i} pointerEvents="none" style={[s.decor, { left: x + 8, top: y - 30, opacity: glow }]}>
      <Svg width={34} height={34} viewBox="0 0 34 34"><Path d="M17 2 L21 13 L32 17 L21 21 L17 32 L13 21 L2 17 L13 13Z" fill={isNight ? GOLD.rim : '#ffc928'} /></Svg></Animated.View>;
  };

  const trail = plan.spots.slice(Math.floor(activeIndex / PER_UNIT) * PER_UNIT, activeIndex + 1);

  return <View onLayout={(event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width)} style={[s.path, { height: plan.height }]}>
    <Svg width={W} height={plan.height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {units.map((points, u) => <React.Fragment key={u}>
        <Path d={roadPath(points)} stroke={road.edge} strokeWidth={46} strokeLinecap="round" fill="none" />
        <Path d={roadPath(points)} stroke={road.body} strokeWidth={36} strokeLinecap="round" fill="none" />
        <Path d={roadPath(points)} stroke={road.dash} strokeWidth={4} strokeDasharray="1 13" strokeLinecap="round" fill="none" />
      </React.Fragment>)}
      {trail.length > 1 && <Path d={roadPath(trail)} stroke={road.trail} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.9} />}
    </Svg>

    {plan.spots.map((_, i) => decor(i))}

    {plan.banners.map(({ unit, y }) => {
      const accent = unit % 2 === 0 ? c.mint : c.coralDark;
      const unitColor = [c.sky, c.peach, c.lavender, c.leaf][unit % 4];
      return <View key={'b' + unit} style={[s.unit, { top: y, backgroundColor: unitColor }]}>
        <View style={[s.unitBadge, { backgroundColor: accent === c.mint ? accentFill(c, isNight) : accent }]}><Text style={[s.unitNumber, accent === c.coralDark && isNight && { color: '#2a1b00' }]}>{unit + 1}</Text></View>
        <View style={{ flex: 1 }}><Text style={[s.eyebrow, { color: c.muted }]}>بەشی {unit + 1}</Text><Text style={[s.unitTitle, { color: c.ink }]}>{unitNames[unit]}</Text></View>
        <Star size={22} color={c.mint} fill={c.mint} />
      </View>;
    })}

    {nodes.map((node, i) => {
      const p = plan.spots[i], current = node.status === 'current', done = node.status === 'completed', locked = node.status === 'locked';
      const size = current ? N + 14 : N;
      const faceColor = done ? DONE.face : current ? GOLD.face : LOCKED.face, lip = done ? DONE.lip : current ? GOLD.lip : LOCKED.lip;
      return <React.Fragment key={node.letter.id}>
        {current && <Animated.View pointerEvents="none" style={[s.ring, { left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, borderRadius: size * 0.34, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }] }]} />}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`وانەی ${node.index + 1}، پیتی ${node.letter.glyph}، ${done ? 'تەواو کراوە، دووبارەی بکەوە' : locked ? 'قفڵە، وانەی پێشوو تەواو بکە' : 'ئامادەی دەستپێکردنە'}`}
          accessibilityState={{ disabled: locked }} disabled={locked} activeOpacity={0.9}
          onPress={() => { void soundService.stopSpeaking(); soundService.playPop(); setSelectedLetter(node.letter); setRoute('letter-detail'); }}
          style={[s.node, { left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, borderRadius: size * 0.34, backgroundColor: faceColor, borderBottomColor: lip }, current && s.nodeCurrent]}>
          <Text style={[s.glyph, { color: current ? GOLD.ink : '#fff', fontSize: current ? 44 : 36 }]}>{node.letter.glyph}</Text>
          <View style={[s.status, { backgroundColor: done ? DONE.face : locked ? LOCKED.badge : BRAND.main }]}>{done ? <Check color="#fff" size={15} /> : locked ? <Lock color="#fff" size={13} /> : <Play color="#fff" size={13} fill="#fff" />}</View>
        </TouchableOpacity>
        <Text style={[s.nodeLabel, { left: p.x - 60, top: p.y + size / 2 + 8, color: current ? (isNight ? '#ffd66b' : c.mint) : c.muted }]}>{done ? 'دووبارە بکەوە' : locked ? `وانەی ${node.index + 1}` : 'دەست پێ بکە'}</Text>
        {current && <View pointerEvents="none" style={[s.startBadge, { left: p.x - 70, top: p.y - size / 2 - 34, backgroundColor: isNight ? '#241c80' : '#ffffff', borderColor: isNight ? '#ffd66b' : '#c9b6ff' }]}><Text style={[s.startLabel, { color: isNight ? '#ffd66b' : c.mint }]}>ئێستا نۆرەی تۆیە!</Text></View>}
        {current && <Animated.View pointerEvents="none" style={[s.butterfly, { left: p.x < W / 2 ? p.x + size / 2 + 4 : p.x - size / 2 - 64, top: p.y - size / 2 - 14, transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [6, -10] }) }, { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-5, 7] }) }, { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '10deg'] }) }] }]}><PapulaMascot size={60} /></Animated.View>}
      </React.Fragment>;
    })}
    <Text style={[s.note, { top: plan.height - 58, color: c.muted }]}>هەر وانەیەک تەواو بکە، پیتی دواتر دەکرێتەوە. هەر کاتێک دەتوانیت وانە فێربووەکان دووبارە بکەیتەوە.</Text>
  </View>;
}

const s = StyleSheet.create({
  path: { width: '100%', maxWidth: 720, alignSelf: 'center', position: 'relative' },
  decor: { position: 'absolute' },
  unit: { position: 'absolute', left: 0, right: 0, height: BANNER - 12, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: 28, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.12)' },
  unitBadge: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  unitNumber: { color: '#fff', fontSize: 22, fontFamily: 'IBMPlexSansArabic_700Bold' },
  eyebrow: { fontFamily: 'IBMPlexSansArabic_500Medium', fontSize: 12 },
  unitTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19 },
  node: { position: 'absolute', borderWidth: 3, borderColor: '#ffffff', borderBottomWidth: 7, alignItems: 'center', justifyContent: 'center' },
  nodeCurrent: { borderColor: GOLD.rim, shadowColor: GOLD.face, shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  ring: { position: 'absolute', borderWidth: 4, borderColor: GOLD.face },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', textAlign: 'center' },
  status: { position: 'absolute', bottom: -6, right: -6, width: 27, height: 27, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff' },
  nodeLabel: { position: 'absolute', width: 120, textAlign: 'center', fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13 },
  startBadge: { position: 'absolute', width: 140, alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingVertical: 4 },
  startLabel: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 12, textAlign: 'center' },
  butterfly: { position: 'absolute' },
  note: { position: 'absolute', left: 10, right: 10, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 14, lineHeight: 25, textAlign: 'center' },
});
