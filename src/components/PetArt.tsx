import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { PapulaMascot } from './PapulaMascot';
import { Text } from './RTLText';
import { useReducedMotion } from './Motion';
import { PET_STAGES, PetMood, PetStage } from '../data/garden';

const native = Platform.OS !== 'web';
const INK = '#573147';

/** Cute eyes for the early stages: open and round, smiling arcs when fed, closed lines when sleepy. */
function Face({ x, y, gap, mood, scale = 1 }: { x: number; y: number; gap: number; mood: PetMood; scale?: number }) {
  const eye = (cx: number) => mood === 'sleepy' ? <Path key={cx} d={`M${cx - 7 * scale} ${y} Q${cx} ${y + 6 * scale} ${cx + 7 * scale} ${y}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
    : mood === 'happy' ? <Path key={cx} d={`M${cx - 7 * scale} ${y + 3 * scale} Q${cx} ${y - 7 * scale} ${cx + 7 * scale} ${y + 3 * scale}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
    : <G key={cx}><Circle cx={cx} cy={y} r={6 * scale} fill={INK} /><Circle cx={cx + 2} cy={y - 2} r={2} fill="#fff" /></G>;
  return <G>{eye(x - gap)}{eye(x + gap)}
    <Circle cx={x - gap - 10 * scale} cy={y + 12 * scale} r={6 * scale} fill="#ff9fb8" opacity={0.7} /><Circle cx={x + gap + 10 * scale} cy={y + 12 * scale} r={6 * scale} fill="#ff9fb8" opacity={0.7} />
    <Path d={`M${x - 7 * scale} ${y + 12 * scale} Q${x} ${y + (mood === 'sleepy' ? 15 : 22) * scale} ${x + 7 * scale} ${y + 12 * scale}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" /></G>;
}

function Egg({ mood }: { mood: PetMood }) {
  return <Svg width="100%" height="100%" viewBox="0 0 200 200">
    <Ellipse cx={100} cy={185} rx={52} ry={9} fill="#000" opacity={0.08} />
    <Path d="M100 38C138 38 156 88 156 124C156 160 132 182 100 182C68 182 44 160 44 124C44 88 62 38 100 38Z" fill="#fff4d7" stroke="#f0c987" strokeWidth={4} />
    <Circle cx={70} cy={80} r={9} fill="#ffc74c" opacity={0.85} /><Circle cx={136} cy={96} r={7} fill="#ed5aa9" opacity={0.75} /><Circle cx={118} cy={64} r={5} fill="#9457e8" opacity={0.7} /><Circle cx={60} cy={142} r={6} fill="#30b9e4" opacity={0.7} />
    <Face x={100} y={118} gap={20} mood={mood} />
  </Svg>;
}
function Caterpillar({ mood }: { mood: PetMood }) {
  const segments = [[46, 150, 20], [74, 156, 23], [104, 158, 25], [134, 152, 24]] as const;
  return <Svg width="100%" height="100%" viewBox="0 0 200 200">
    <Ellipse cx={104} cy={186} rx={78} ry={8} fill="#000" opacity={0.08} />
    {segments.map(([cx, cy, r], i) => <G key={cx}><Circle cx={cx} cy={cy} r={r} fill={i % 2 ? '#7ddc8a' : '#5ec576'} stroke="#3d9b55" strokeWidth={3} /><Rect x={cx - 3} y={cy + r - 4} width={6} height={10} rx={3} fill="#3d9b55" /></G>)}
    <Circle cx={150} cy={118} r={40} fill="#8fe39a" stroke="#3d9b55" strokeWidth={3.5} />
    <Path d="M136 82C132 66 124 60 118 62M164 82C168 66 176 60 182 62" stroke="#3d9b55" strokeWidth={4} fill="none" strokeLinecap="round" /><Circle cx={118} cy={62} r={5} fill="#ed5aa9" /><Circle cx={182} cy={62} r={5} fill="#ed5aa9" />
    <Face x={150} y={112} gap={15} mood={mood} scale={0.9} />
  </Svg>;
}
function Cocoon({ mood }: { mood: PetMood }) {
  return <Svg width="100%" height="100%" viewBox="0 0 200 200">
    <Path d="M20 24H180" stroke="#8a6a4a" strokeWidth={9} strokeLinecap="round" /><Path d="M100 24V52" stroke="#c9b79c" strokeWidth={4} />
    <Path d="M100 50C146 50 156 104 150 138C145 170 124 188 100 188C76 188 55 170 50 138C44 104 54 50 100 50Z" fill="#f1e6d2" stroke="#cdb98f" strokeWidth={4} />
    <Path d="M56 92C86 104 114 104 144 92M52 118C86 132 114 132 148 118M54 146C86 158 114 158 146 146" stroke="#d9c7a3" strokeWidth={4} fill="none" strokeLinecap="round" />
    <Face x={100} y={122} gap={18} mood={mood === 'calm' ? 'sleepy' : mood} />
  </Svg>;
}

/** The companion in its current growth stage: egg, caterpillar, cocoon, then the butterfly (crowned at the top stage). */
export function PetArt({ stage, mood, size = 180, bounceKey = 0 }: { stage: PetStage; mood: PetMood; size?: number; bounceKey?: number }) {
  const reduced = useReducedMotion();
  const [bob] = useState(() => new Animated.Value(0)), [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) { bob.setValue(0); return; }
    const config = { duration: mood === 'sleepy' ? 2600 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: native, isInteraction: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(bob, { ...config, toValue: 1 }), Animated.timing(bob, { ...config, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [reduced, mood, bob]);
  useEffect(() => {
    if (!bounceKey || reduced) return;
    pop.setValue(0);
    Animated.sequence([Animated.timing(pop, { toValue: 1, duration: 160, useNativeDriver: native }), Animated.spring(pop, { toValue: 0, friction: 3, tension: 140, useNativeDriver: native })]).start();
  }, [bounceKey, reduced, pop]);
  const box = size * stage.size + (stage.id === 'baby' || stage.id === 'butterfly' || stage.id === 'royal' ? size * 0.2 : size * 0.15);
  const butterfly = stage.id === 'baby' || stage.id === 'butterfly' || stage.id === 'royal';
  return <View style={{ width: size, height: size * 0.95, alignItems: 'center', justifyContent: 'flex-end' }} accessible accessibilityRole="image" accessibilityLabel={`${stage.name}${mood === 'sleepy' ? '، خەواڵووە' : ''}`}>
    <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.05] }) }, { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }}>
      {butterfly ? <View><PapulaMascot size={box} mood={mood === 'sleepy' ? 'sleepy' : mood === 'happy' ? 'happy' : 'calm'} flap={mood !== 'sleepy'} />
        {stage.id === 'royal' && <Text style={[s.crown, { fontSize: box * 0.26, top: -box * 0.12 }]}>👑</Text>}</View>
        : <View style={{ width: box, height: box }}>{stage.id === 'egg' ? <Egg mood={mood} /> : stage.id === 'caterpillar' ? <Caterpillar mood={mood} /> : <Cocoon mood={mood} />}</View>}
    </Animated.View>
    {mood === 'sleepy' && <Text style={[s.zzz, { fontSize: size * 0.14, top: size * 0.05 }]}>💤</Text>}
    {mood === 'happy' && <Text style={[s.zzz, { fontSize: size * 0.13, top: size * 0.04 }]}>💗</Text>}
  </View>;
}
export { PET_STAGES };
const s = StyleSheet.create({
  crown: { position: 'absolute', alignSelf: 'center', textAlign: 'center', left: 0, right: 0 },
  zzz: { position: 'absolute', right: 6 },
});
