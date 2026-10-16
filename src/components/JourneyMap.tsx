import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { LetterItem } from '../services/types';

export interface MapNode { letter: LetterItem; index: number; status: 'completed' | 'current' | 'locked'; }

// Where each visible lesson sits along the winding road (viewBox 358 x 376, read right to left).
const SPOTS = [{ x: 292, y: 322 }, { x: 178, y: 238 }, { x: 206, y: 148 }, { x: 150, y: 70 }];
const ROAD = 'M292 322 C210 306 250 252 178 238 C110 226 160 170 206 148 C250 128 190 96 150 70';

/** The night home screen: lessons as stars along a road, the current one glowing. */
export const JourneyMap: React.FC<{ nodes: MapNode[]; onOpen: (node: MapNode) => void; width?: number; height?: number; ink: string; gold: string; mint: string; dim: string; edge: string; wing1: string; wing2: string }> = ({ nodes, onOpen, width = 358, height = 376, ink, gold, mint, dim, edge, wing1, wing2 }) => {
  const shown = nodes.slice(0, SPOTS.length);
  return <Svg width="100%" height="100%" viewBox="0 0 358 376" preserveAspectRatio="xMidYMid meet" accessibilityLabel="نەخشەی وانەکان">
    <Path d={ROAD} fill="none" stroke={ink} strokeOpacity={0.35} strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" />
    {shown.map((node, i) => {
      const { x, y } = SPOTS[i];
      const current = node.status === 'current', done = node.status === 'completed';
      const r = current ? 38 : 26;
      return <G key={node.letter.id} onPress={() => node.status !== 'locked' && onOpen(node)}>
        {current && <Circle cx={x} cy={y} r={r + 10} fill="none" stroke={gold} strokeOpacity={0.5} strokeWidth={3} />}
        {current && <Circle cx={x} cy={y} r={r + 18} fill={gold} fillOpacity={0.12} />}
        <Circle cx={x} cy={y} r={r} fill={current ? gold : done ? mint : dim} stroke={current || done ? 'none' : edge} strokeWidth={2} />
        {done
          ? <Path d={`M${x - 11} ${y}l8 8 16-18`} fill="none" stroke="#06322d" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          : <SvgText x={x} y={y + (current ? 16 : 10)} textAnchor="middle" fontSize={current ? 46 : 28} fontWeight="800" fill={current ? '#2a1b00' : ink} fontFamily="IBMPlexSansArabic_700Bold">{node.letter.glyph}</SvgText>}
      </G>;
    })}
    <G>
      <Ellipse cx={262} cy={200} rx={14} ry={17} fill={wing1} transform="rotate(-20 262 200)" />
      <Ellipse cx={286} cy={200} rx={14} ry={17} fill={wing2} transform="rotate(20 286 200)" />
      <Rect x={268} y={186} width={12} height={32} rx={6} fill={mint} />
    </G>
  </Svg>;
};
