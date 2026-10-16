import React from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Check, Lock, Play, Star } from 'lucide-react-native';
import { Text } from './RTLText';
import { useAppStore } from '../store/useAppStore';
import { lessonPath } from '../services/lessonPath';
import { learningLayout } from '../theme/layout';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
import { soundService } from '../services/soundService';

const unitNames = ['یەکەم هەنگاوەکان', 'دنیای وشەکان', 'پیتە هاوڕێکان', 'با پێکەوە بخوێنینەوە', 'هەنگاوێک بەرەو پێش', 'باخچەی پیتەکان'];
const offsets = [0, 0.65, 1, 0.4, -0.65, -1];
export function LearningPath({ preview = false }: { preview?: boolean }) {
  const s=useThemeStyles(baseStyles);
  const {colors:c}=useAppearance();
  const { currentProfile, setSelectedLetter, setRoute } = useAppStore();
  const { width } = useWindowDimensions();
  const layout = learningLayout(width), nodes = lessonPath(currentProfile);
  const active = Math.max(0, nodes.findIndex(node => node.status === 'current'));
  const start = preview ? Math.floor(active / 6) * 6 : 0;
  const visible = preview ? nodes.slice(start, start + 6) : nodes;
  return <View style={s.path}>{visible.map(node => {
    const unit = Math.floor(node.index / 6), current = node.status === 'current', done = node.status === 'completed', locked = node.status === 'locked';
    const accent=unit%2===0?c.mint:c.coralDark;
    const unitColor=[c.sky,c.peach,c.lavender,c.leaf][unit%4];
    return <View key={node.letter.id}>
      {node.index % 6 === 0 && <View style={[s.unit,{backgroundColor:unitColor}]}><View style={[s.unitBadge,{backgroundColor:accent}]}><Text style={s.unitNumber}>{unit + 1}</Text></View><View style={{ flex: 1 }}><Text style={s.eyebrow}>بەشی {unit + 1}</Text><Text style={s.unitTitle}>{unitNames[unit]}</Text></View><Star size={22} color={c.mint} /></View>}
      <View style={s.nodeRow}><View style={{ alignItems: 'center', transform: [{ translateX: offsets[node.index % 6] * layout.pathOffset }] }}>
        {current && <View style={s.startBadge}><Text style={s.startLabel}>ئێستا نۆرەی تۆیە!</Text></View>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`وانەی ${node.index + 1}، پیتی ${node.letter.glyph}، ${done ? 'تەواو کراوە، دووبارەی بکەوە' : locked ? 'قفڵە، وانەی پێشوو تەواو بکە' : 'ئامادەی دەستپێکردنە'}`}
          accessibilityState={{ disabled: locked }} disabled={locked} activeOpacity={0.8}
          onPress={() => { void soundService.stopSpeaking(); soundService.playPop(); setSelectedLetter(node.letter); setRoute('letter-detail'); }}
          style={[s.node, { width: layout.nodeSize, height: layout.nodeSize, borderRadius: layout.nodeSize / 2 }, done && [s.done,{backgroundColor:accent,borderColor:accent}], current && [s.current,{backgroundColor:c.peach,borderColor:c.coralDark}], locked && [s.locked,{backgroundColor:c.paper,borderColor:c.edge}]]}>
          <Text style={[s.glyph, done && { color: '#fff' }, locked && { color: c.muted }]}>{node.letter.glyph}</Text>
          <View style={[s.status, current && { backgroundColor: c.coral }, done && { backgroundColor: accent }]}>{done ? <Check color="#fff" size={15} /> : locked ? <Lock color={c.muted} size={13} /> : <Play color="#fff" size={13} fill="#fff" />}</View>
        </TouchableOpacity><Text style={[s.nodeLabel, current && { color: c.mint }]}>{done ? 'دووبارە بکەوە' : locked ? `وانەی ${node.index + 1}` : 'دەست پێ بکە'}</Text>
      </View></View>
      {node.index < nodes.length - 1 && (node.index + 1) % 6 !== 0 && <View style={[s.connector,{backgroundColor:c.edge}]} />}
    </View>;
  })}<Text style={s.note}>هەر وانەیەک تەواو بکە، پیتی دواتر دەکرێتەوە. هەر کاتێک دەتوانیت وانە فێربووەکان دووبارە بکەیتەوە.</Text></View>;
}
const baseStyles = StyleSheet.create({
  path: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: 20 },
  unit: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, backgroundColor: '#e6f3ea', borderRadius: 24, marginVertical: 16 },
  unitBadge: { width: 42, height: 42, borderRadius: 15, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' },
  unitNumber: { color: '#fff', fontSize: 21, fontFamily: 'IBMPlexSansArabic_700Bold' }, eyebrow: { fontFamily: 'IBMPlexSansArabic_500Medium', fontSize: 12, color: c.muted },
  unitTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19, color: c.ink }, nodeRow: { minHeight: 124, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  node: { borderWidth: 3, borderBottomWidth: 7, borderColor: '#d8e3dc', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  current: { backgroundColor: '#fff2d2', borderColor: '#e6ab3c' }, done: { backgroundColor: c.mint, borderColor: c.mintDark }, locked: { backgroundColor: '#e9efea', borderColor: '#d6e0d9' },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 38, color: c.ink, textAlign: 'center' },
  status: { position: 'absolute', bottom: -5, right: -5, width: 26, height: 26, borderRadius: 13, backgroundColor: '#e0e9e2', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.background },
  nodeLabel: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: c.muted, marginTop: 7 },
  startBadge: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#c3dfcb', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8 }, startLabel: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 12, color: c.mint },
  connector: { width: 8, height: 22, backgroundColor: '#dce8de', borderRadius: 4, alignSelf: 'center' },
  note: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 14, lineHeight: 25, color: c.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 10 },
});
