import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Lock, Route } from 'lucide-react-native';
import { Text } from './RTLText';
import { PapulaMascot } from './PapulaMascot';
import { lessonPath } from '../services/lessonPath';

type PathNode = ReturnType<typeof lessonPath>[number];
const spots = [{ x: 76, y: 238 }, { x: 180, y: 183 }, { x: 280, y: 122 }];

export function AdventureMap({ nodes, isNight, onOpen, onAll }: {
  nodes: PathNode[]; isNight: boolean; onOpen: (node: PathNode) => void; onAll: () => void;
}) {
  return <LinearGradient colors={isNight ? ['#293586', '#476ed2'] : ['#39baf8', '#90e6ff']} style={[s.scene, { direction: 'ltr' }]}>
    <Svg width="100%" height="100%" viewBox="0 0 360 310" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Circle cx="45" cy="49" r="25" fill={isNight ? '#fff2b4' : '#ffdb45'} />
      {isNight ? <Circle cx="57" cy="40" r="23" fill="#293586" /> : null}
      <Path d="M224 51 Q221 34 237 34 Q244 11 263 28 Q284 25 289 47 Q307 49 302 59 H227Z M59 107 Q56 94 70 92 Q77 74 91 87 Q110 84 112 100 Q128 99 128 112 H62Z" fill="#fff" opacity={0.8} />
      <Path d="M0 267 Q88 212 190 267 Q280 218 360 247 V310 H0Z" fill={isNight ? '#258a71' : '#54d98b'} />
      <Path d="M0 293 Q90 263 196 287 Q277 258 360 278 V310 H0Z" fill={isNight ? '#156b67' : '#29bf80'} />
      <Path d="M76 238 C72 176 185 253 180 183 S287 185 280 122" fill="none" stroke="#fff" strokeWidth="8" strokeDasharray="2 16" strokeLinecap="round" />
      {nodes.map((node, i) => <G key={node.letter.id}>
        <Ellipse cx={spots[i].x} cy={spots[i].y + 25} rx="51" ry="20" fill="#c48a44" />
        <Ellipse cx={spots[i].x} cy={spots[i].y + 17} rx="51" ry="20" fill="#ffe2a1" />
        <Ellipse cx={spots[i].x} cy={spots[i].y + 12} rx="49" ry="18" fill="#72dc65" />
      </G>)}
    </Svg>
    <View pointerEvents="none" style={s.mascot}><PapulaMascot size={116} /></View>
    <View style={s.mapLabel}><Route size={17} color="#24416a" /><Text style={s.labelText}>دوورگەی پیتەکان</Text></View>
    {nodes.map((node, i) => {
      const current = node.status === 'current', done = node.status === 'completed', locked = node.status === 'locked';
      return <TouchableOpacity key={node.letter.id} accessibilityRole="button" disabled={locked} accessibilityState={{ disabled: locked }}
        accessibilityLabel={`پیتی ${node.letter.glyph}، ${locked ? 'قفڵە' : done ? 'دووبارە بکەوە' : 'وانەی ئێستا'}`}
        onPress={() => onOpen(node)} activeOpacity={0.85}
        style={[s.node, { left: `${spots[i].x / 3.6}%`, top: spots[i].y - 32, backgroundColor: current ? '#ffd43b' : done ? '#21b977' : '#8b51e8', borderBottomColor: current ? '#dfaa1d' : done ? '#148351' : '#6332b2' }]}>
        {done ? <Check size={30} strokeWidth={3.5} color="#fff" /> : <Text style={[s.glyph, { color: current ? '#5a3a0a' : '#fff' }]}>{node.letter.glyph}</Text>}
        {locked && <View style={s.lock}><Lock size={11} color="#fff" /></View>}
      </TouchableOpacity>;
    })}
    <TouchableOpacity accessibilityRole="button" onPress={onAll} style={s.all}><Text style={s.allText}>هەموو ڕێڕەوی پیتەکان</Text><Route size={17} color="#fff" /></TouchableOpacity>
  </LinearGradient>;
}
const s = StyleSheet.create({
  scene: { height: 310, borderRadius: 30, overflow: 'hidden', position: 'relative' },
  mascot: { position: 'absolute', left: 24, top: 58 },
  mapLabel: { position: 'absolute', right: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, backgroundColor: '#ffffffdf', paddingHorizontal: 12, paddingVertical: 6 },
  labelText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 12, color: '#24416a' },
  node: { position: 'absolute', width: 60, height: 60, marginLeft: -30, borderRadius: 25, borderBottomWidth: 5, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 30, fontFamily: 'IBMPlexSansArabic_700Bold', textAlign: 'center' },
  lock: { position: 'absolute', right: -3, bottom: -1, backgroundColor: '#6332b2', borderRadius: 10, padding: 4 },
  all: { position: 'absolute', right: 12, bottom: 10, minHeight: 44, borderRadius: 17, backgroundColor: '#245f58', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13 },
  allText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 12, color: '#fff' },
});
