import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { PapulaMascot } from '../../components/PapulaMascot';
import { resamplePolyline } from '../../services/pathSimilarity';
import { StrokeGuide, StrokePoint } from '../../services/types';

const pathFor = (points: StrokePoint[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
const Ink: React.FC<{ points: StrokePoint[]; color: string; width: number }> = ({ points, color, width }) => {
  if (!points.length) return null;
  if (points.length === 1) return <Circle cx={points[0].x} cy={points[0].y} r={width / 2} fill={color} />;
  return <Path d={pathFor(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
};

export interface WritingBoardProps {
  side: number;
  /** Shown in grey behind the writing when `showGuide` is on (the child asked for help). */
  guide?: StrokeGuide;
  showGuide?: boolean;
  disabled?: boolean;
  color?: string;
  /** Progress 0..1 of animated stroke demonstration. */
  demoProgress?: number | null;
  /** Called after every stroke is finished or removed. */
  onStrokesChange: (strokes: StrokePoint[][]) => void;
  /** Change this value to wipe the board (new letter, retry). */
  resetKey: string | number;
}

/** A single square writing surface on a 0-100 coordinate system, with the four school writing lines. */
export const WritingBoard: React.FC<WritingBoardProps> = ({ side, guide, showGuide, disabled, color = '#0369a1', demoProgress = null, onStrokesChange, resetKey }) => {
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [active, setActive] = useState<StrokePoint[]>([]);
  const strokesRef = useRef<StrokePoint[][]>([]);
  const activeRef = useRef<StrokePoint[]>([]);
  const sideRef = useRef(side);
  const disabledRef = useRef(!!disabled);
  const notifyRef = useRef(onStrokesChange);
  useLayoutEffect(() => { sideRef.current = side; disabledRef.current = !!disabled || demoProgress !== null; notifyRef.current = onStrokesChange; });
  useLayoutEffect(() => {
    strokesRef.current = []; activeRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- wipe the board when the caller changes resetKey
    setStrokes([]); setActive([]);
    notifyRef.current([]);
  }, [resetKey]);

  const responder = useMemo(() => {
    const point = (x: number, y: number): StrokePoint => ({
      x: Math.max(0, Math.min(100, x / sideRef.current * 100)),
      y: Math.max(0, Math.min(100, y / sideRef.current * 100)),
    });
    const finish = () => {
      if (activeRef.current.length) {
        strokesRef.current = [...strokesRef.current, activeRef.current];
        setStrokes(strokesRef.current);
        notifyRef.current(strokesRef.current);
      }
      activeRef.current = []; setActive([]);
    };
    // The callbacks read refs at gesture time only, never during render.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => { activeRef.current = [point(event.nativeEvent.locationX, event.nativeEvent.locationY)]; setActive(activeRef.current); },
      onPanResponderMove: event => {
        const next = point(event.nativeEvent.locationX, event.nativeEvent.locationY);
        const last = activeRef.current[activeRef.current.length - 1];
        if (!last || Math.hypot(last.x - next.x, last.y - next.y) >= 0.35) { activeRef.current = [...activeRef.current, next]; setActive(activeRef.current); }
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, []);

  const demoStrokes = guide?.strokes.map(stroke => resamplePolyline(stroke, 1)) || [];
  const demoBudget = Math.floor((demoProgress || 0) * demoStrokes.reduce((sum, stroke) => sum + stroke.length, 0));
  const shownDemo = demoStrokes.map((stroke, i) => stroke.slice(0, Math.max(0, demoBudget - demoStrokes.slice(0, i).reduce((sum, earlier) => sum + earlier.length, 0))));
  const penTip = demoProgress !== null ? [...shownDemo].reverse().find(stroke => stroke.length)?.slice(-1)[0] : undefined;

  return <View style={[styles.frame, { direction: 'ltr' }]}>
    <View accessibilityLabel="بۆردی نووسین" style={{ width: side, height: side, direction: 'ltr' }} {...responder.panHandlers}>
      <Svg width={side} height={side} viewBox="0 0 100 100" pointerEvents="none">
        {[22, 45, 70, 88].map(y => <Line key={y} x1={5} y1={y} x2={95} y2={y} stroke={y === 70 ? '#d97706' : '#d9e2ec'} strokeWidth={y === 70 ? 0.65 : 0.3} />)}
        {showGuide && guide?.outlinePath && <Path d={guide.outlinePath} fill="#cbd5e1" fillRule="evenodd" />}
        {showGuide && !guide?.outlinePath && guide?.strokes.map((s, i) => <Ink key={`g-${i}`} points={s} color="#cbd5e1" width={6} />)}
        {strokes.map((s, i) => <Ink key={i} points={s} color={color} width={3.6} />)}
        <Ink points={active} color={color} width={3.6} />
        {demoProgress !== null && shownDemo.map((s, i) => <Ink key={`d-${i}`} points={s} color="#0369a1" width={3.6} />)}
        {showGuide && strokes.length === 0 && demoProgress === null && guide?.strokes[0]?.[0] && <Circle cx={guide.strokes[0][0].x} cy={guide.strokes[0][0].y} r={2} fill="#047857" />}
      </Svg>
      {penTip && <View pointerEvents="none" style={{ position: 'absolute', left: (side - 46) / 2, top: (penTip.y / 100) * side - 38, transform: [{ translateX: (penTip.x / 100) * side - side / 2 }] }}><PapulaMascot size={46} mood="happy" /></View>}
    </View>
  </View>;
};

const styles = StyleSheet.create({
  frame: { backgroundColor: '#fffef7', borderColor: '#cbd5e1', borderWidth: 2, borderRadius: 24, overflow: 'hidden' },
});

