import { TactileButton as TouchableOpacity } from './TactileButton';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Lock, Route } from 'lucide-react-native';
import { Text } from './RTLText';
import { PapulaMascot } from './PapulaMascot';
import { lessonPath } from '../services/lessonPath';

type PathNode = ReturnType<typeof lessonPath>[number];
const anchors = [{ x: 292, y: 103 }, { x: 86, y: 196 }, { x: 288, y: 270 }];

export function AdventureMap({ nodes, isNight, onOpen, onAll }: {
  nodes: PathNode[]; isNight: boolean; onOpen: (node: PathNode) => void; onAll: () => void;
}) {
  const currentIndex = nodes.findIndex(node => node.status === 'current');
  const order = currentIndex === 0 ? [1, 2, 0] : currentIndex === 2 ? [0, 2, 1] : [0, 1, 2];
  const spots = order.map(index => anchors[index]);
  return <LinearGradient colors={isNight ? ['#293586', '#476ed2'] : ['#39baf8', '#90e6ff']} style={[s.scene, { direction: 'ltr' }]}>
    <Svg width="100%" height="100%" viewBox="0 0 360 310" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Circle cx="52" cy="49" r="25" fill={isNight ? '#fff2b4' : '#ffe76c'} />
      {!isNight && <Circle cx="52" cy="49" r="18" fill="#ffce32" />}
      {isNight ? <Circle cx="57" cy="40" r="23" fill="#293586" /> : null}
      <Path d="M224 51 Q221 34 237 34 Q244 11 263 28 Q284 25 289 47 Q307 49 302 59 H227Z M59 107 Q56 94 70 92 Q77 74 91 87 Q110 84 112 100 Q128 99 128 112 H62Z" fill="#fff" opacity={0.8} />
      <Path d="M0 255 Q100 238 220 288 Q290 271 360 269 V310 H0Z" fill={isNight ? '#258a71' : '#a4ee62'} />
      <Path d="M0 293 Q90 263 196 287 Q277 258 360 278 V310 H0Z" fill={isNight ? '#156b67' : '#6bdc53'} />
      <Path d="M292 103 C165 113 55 114 86 196 S185 294 288 270" fill="none" stroke="#ffffffcc" strokeWidth="5" strokeDasharray="4 12" strokeLinecap="round" />
      {nodes.map((node, i) => <G key={node.letter.id}>
        <Ellipse cx={spots[i].x} cy={spots[i].y + 25} rx={node.status === 'current' ? 50 : 37} ry="18" fill="#d4a257" />
        <Ellipse cx={spots[i].x} cy={spots[i].y + 17} rx={node.status === 'current' ? 50 : 37} ry="18" fill="#f4ce7f" />
        <Ellipse cx={spots[i].x} cy={spots[i].y + 12} rx={node.status === 'current' ? 49 : 36} ry="16" fill="#7cdb45" />
      </G>)}
    </Svg>
    <View pointerEvents="none" style={s.mascot}><PapulaMascot size={118} mood={isNight ? 'sleepy' : 'happy'} /></View>
    <View style={s.mapLabel}><Route size={17} color="#24416a" /><Text style={s.labelText}>دوورگەی پیتەکان</Text></View>
    {nodes.map((node, i) => {
      const current = node.status === 'current', done = node.status === 'completed', locked = node.status === 'locked';
      return <TouchableOpacity key={node.letter.id} accessibilityRole="button" disabled={locked} accessibilityState={{ disabled: locked }}
        accessibilityLabel={`پیتی ${node.letter.glyph}، ${locked ? 'قفڵە' : done ? 'دووبارە بکەوە' : 'وانەی ئێستا'}`}
        onPress={() => onOpen(node)} activeOpacity={0.85}
        style={[s.node, current && s.currentNode, { left: `${spots[i].x / 3.6}%`, top: spots[i].y - (current ? 42 : 28), backgroundColor: current ? '#ffd43b' : done ? '#187940' : '#a66be5', borderBottomColor: current ? '#dfaa1d' : done ? '#116330' : '#8f52ca' }]}>
        {done ? <Check size={30} strokeWidth={3.5} color="#fff" /> : <Text style={[s.glyph, { color: current ? '#5a3a0a' : '#fff' }]}>{node.letter.glyph}</Text>}
        {locked && <View style={s.lock}><Lock size={11} color="#fff" /></View>}
      </TouchableOpacity>;
    })}
    {currentIndex >= 0 && <View pointerEvents="none" style={[s.currentLabel, { left: `${anchors[1].x / 3.6}%` }]}><Text style={s.currentLabelText}>نۆرەی تۆیە!</Text></View>}
    <TouchableOpacity accessibilityRole="button" onPress={onAll} style={s.all}><Text style={s.allText}>هەموو ڕێڕەوی پیتەکان</Text><Route size={17} color="#fff" /></TouchableOpacity>
  </LinearGradient>;
}
const s = StyleSheet.create({
  scene: { height: 310, borderRadius: 27, borderWidth: 3, borderColor: '#b9efff', overflow: 'hidden', position: 'relative' },
  mascot: { position: 'absolute', right: 12, top: 128, transform: [{ rotate: '7deg' }] },
  mapLabel: { position: 'absolute', right: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, backgroundColor: '#ffffffdf', paddingHorizontal: 12, paddingVertical: 6 },
  labelText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 12, color: '#24416a' },
  node: { position: 'absolute', width: 55, height: 55, marginLeft: -27.5, borderRadius: 20, borderWidth: 3, borderColor: '#fff', borderBottomWidth: 6, alignItems: 'center', justifyContent: 'center' },
  currentNode: { width: 76, height: 76, marginLeft: -38, borderRadius: 25, borderWidth: 4, borderColor: '#fff4b5', borderBottomWidth: 7 },
  currentLabel: { position: 'absolute', top: 117, marginLeft: -43, backgroundColor: '#7436d8', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, transform: [{ rotate: '-6deg' }] },
  currentLabelText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 11, color: '#fff' },
  glyph: { fontSize: 30, fontFamily: 'IBMPlexSansArabic_700Bold', textAlign: 'center' },
  lock: { position: 'absolute', right: -3, bottom: -1, backgroundColor: '#6332b2', borderRadius: 10, padding: 4 },
  all: { position: 'absolute', left: 8, bottom: 4, minHeight: 44, borderRadius: 15, backgroundColor: '#245f58', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  allText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 12, color: '#fff' },
});
