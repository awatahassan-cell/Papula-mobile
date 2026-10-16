import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../../components/RTLText';
import { StrokeGuide, StrokePoint } from '../../services/types';
import { WritingRubric } from '../../services/writingRubric';

const pathFor = (points: StrokePoint[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
const Ink: React.FC<{ points: StrokePoint[]; color: string; width: number; dash?: string }> = ({ points, color, width, dash }) => {
  if (!points.length) return null;
  if (points.length === 1) return <Circle cx={points[0].x} cy={points[0].y} r={width} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray={dash} />;
  return <Path d={pathFor(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />;
};
const STATUS = { good: { mark: '✓', color: '#047857', bar: '#34d399' }, ok: { mark: '~', color: '#b45309', bar: '#fbbf24' }, fix: { mark: '!', color: '#b91c1c', bar: '#f87171' } } as const;

/** Side-by-side review: the model, the child's writing and what is missing, plus a per-criterion breakdown. */
export const WritingResultDetails: React.FC<{ guide: StrokeGuide; strokes: StrokePoint[][]; rubric: WritingRubric; aligned?: StrokePoint[][] }> = ({ guide, strokes, rubric, aligned }) => {
  const ids = guide.componentIds || guide.strokes.map((_, i) => i);
  const missing = new Set(rubric.missingComponentIds);
  return <View style={styles.wrap}>
    <View style={styles.previews}>
      <View style={styles.previewBox}>
        <Svg width={120} height={120} viewBox="0 0 100 100">
          {guide.outlinePath ? <Path d={guide.outlinePath} fill="#94a3b8" fillRule="evenodd" /> : guide.strokes.map((s, i) => <Ink key={i} points={s} color="#94a3b8" width={5} />)}
        </Svg>
        <Text style={styles.caption}>نموونە</Text>
      </View>
      <View style={styles.previewBox}>
        <Svg width={120} height={120} viewBox="0 0 100 100">
          {guide.outlinePath && <Path d={guide.outlinePath} fill="#e2e8f0" fillRule="evenodd" />}
          {guide.strokes.map((s, i) => missing.has(ids[i] ?? i) ? <Ink key={`m${i}`} points={s} color="#ef4444" width={s.length === 1 ? 4 : 3} dash="3 2" /> : null)}
          {(aligned || strokes).map((s, i) => <Ink key={i} points={s} color="#0369a1" width={3.2} />)}
        </Svg>
        <Text style={styles.caption}>نووسینی تۆ</Text>
      </View>
    </View>
    {missing.size > 0 && <Text style={styles.legend}>هێڵی سووری پچڕپچڕ: ئەو بەشانەی نەنووسراون</Text>}
    {rubric.criteria.map(c => {
      const look = STATUS[c.status];
      return <View key={c.id} style={styles.row} accessible accessibilityLabel={`${c.labelKu}: ${c.score} لە ١٠٠`}>
        <Text style={[styles.mark, { color: look.color }]}>{look.mark}</Text>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}><Text style={styles.label}>{c.labelKu}</Text><Text style={styles.score}>{c.score}٪</Text></View>
          <View style={styles.track}><View style={[styles.fill, { width: `${c.score}%`, backgroundColor: look.bar }]} /></View>
          {!!c.tipKu && <Text style={styles.tip}>{c.tipKu}</Text>}
        </View>
      </View>;
    })}
  </View>;
};

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 10 },
  previews: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  previewBox: { alignItems: 'center', gap: 4, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 6 },
  caption: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 12, color: '#475569' },
  legend: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, color: '#b91c1c', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  mark: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, width: 22, textAlign: 'center' },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 14, color: '#1e293b' },
  score: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: '#475569' },
  track: { height: 8, borderRadius: 6, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  tip: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 13, lineHeight: 22, color: '#475569' },
});
