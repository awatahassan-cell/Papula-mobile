import React from 'react';
import Svg, { Circle } from 'react-native-svg';

/** A circular progress mark; `value` runs from 0 to 1. */
export const ProgressRing: React.FC<{ value: number; size?: number; track: string; color: string; label: string }> = ({ value, size = 46, track, color, label }) => {
  const radius = 18, circumference = 2 * Math.PI * radius;
  return <Svg width={size} height={size} viewBox="0 0 44 44" accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
    <Circle cx={22} cy={22} r={radius} fill="none" stroke={track} strokeWidth={5} />
    <Circle cx={22} cy={22} r={radius} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
      strokeDasharray={`${Math.max(0, Math.min(1, value)) * circumference} ${circumference}`} transform="rotate(-90 22 22)" />
  </Svg>;
};
