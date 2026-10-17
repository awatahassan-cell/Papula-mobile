import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Volume2 } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { StrokeGuide, StrokePoint } from '../../services/types';
import { soundService } from '../../services/soundService';
import { rubricNarration, WritingRubric } from '../../services/writingRubric';
import { useThemeStyles } from '../../theme/useAppearance';

const pathFor = (points: StrokePoint[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
const Ink: React.FC<{ points: StrokePoint[]; color: string; width: number; dash?: string }> = ({ points, color, width, dash }) => {
  if (!points.length) return null;
  if (points.length === 1) return <Circle cx={points[0].x} cy={points[0].y} r={width} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray={dash} />;
  return <Path d={pathFor(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />;
};

/** Visual side-by-side review + spoken audio guidance for pre-literate children. */
export const WritingResultDetails: React.FC<{ guide: StrokeGuide; strokes: StrokePoint[][]; rubric: WritingRubric; aligned?: StrokePoint[][]; stars?: 1 | 2 | 3 }> = ({ guide, strokes, rubric, aligned, stars = 1 }) => {
  const styles = useThemeStyles(baseStyles);
  const narration = rubricNarration(rubric, stars);
  const canHear = narration.every(text => soundService.canSpeak(text));
  const ids = guide.componentIds || guide.strokes.map((_, i) => i);
  const missing = new Set(rubric.missingComponentIds);

  useEffect(() => {
    if (!rubric.passes && canHear) {
      void soundService.speakPhrases(narration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.previews}>
        <View style={styles.previewBox}>
          <Svg width={104} height={104} viewBox="0 0 100 100">
            {guide.outlinePath ? <Path d={guide.outlinePath} fill="#94a3b8" fillRule="evenodd" /> : guide.strokes.map((s, i) => <Ink key={i} points={s} color="#94a3b8" width={5} />)}
          </Svg>
          <Text style={styles.caption}>نموونە</Text>
        </View>
        <View style={styles.previewBox}>
          <Svg width={104} height={104} viewBox="0 0 100 100">
            {guide.outlinePath && <Path d={guide.outlinePath} fill="#e2e8f0" fillRule="evenodd" />}
            {guide.strokes.map((s, i) => missing.has(ids[i] ?? i) ? <Ink key={`m${i}`} points={s} color="#ef4444" width={s.length === 1 ? 4 : 3} dash="3 2" /> : null)}
            {(aligned || strokes).map((s, i) => <Ink key={i} points={s} color="#0369a1" width={3.2} />)}
          </Svg>
          <Text style={styles.caption}>نووسینی تۆ</Text>
        </View>
      </View>
      {canHear && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="ڕێنماییەکە ببیستە"
          style={styles.listen}
          onPress={() => void soundService.speakPhrases(narration)}
        >
          <Volume2 size={22} color="#78350f" />
          <Text style={styles.listenText}>ڕێنماییەکە ببیستە</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  wrap: { width: '100%', gap: 10, alignItems: 'center' },
  previews: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  previewBox: { alignItems: 'center', gap: 4, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1.5, borderColor: '#e2e8f0', padding: 6 },
  caption: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 13, color: '#475569' },
  listen: { width: '100%', minHeight: 50, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#fde68a', borderBottomWidth: 4, borderBottomColor: '#d97706', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  listenText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#78350f' },
});

