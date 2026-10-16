import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

/** Local vector artwork: crisp at every screen size and available offline. */
export function PapulaMascot({ size = 120 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 160 160">
    <Ellipse cx="80" cy="145" rx="42" ry="7" fill="#24304a" opacity={0.12} />
    <Ellipse cx="43" cy="64" rx="33" ry="43" transform="rotate(-30 43 64)" fill="#8b42ec" />
    <Ellipse cx="117" cy="64" rx="33" ry="43" transform="rotate(30 117 64)" fill="#8b42ec" />
    <Ellipse cx="45" cy="108" rx="27" ry="29" fill="#ff69a8" />
    <Ellipse cx="115" cy="108" rx="27" ry="29" fill="#ff69a8" />
    <Ellipse cx="37" cy="55" rx="12" ry="16" transform="rotate(-30 37 55)" fill="#ffd43b" />
    <Ellipse cx="123" cy="55" rx="12" ry="16" transform="rotate(30 123 55)" fill="#ffd43b" />
    <Circle cx="43" cy="110" r="9" fill="#ffc1db" /><Circle cx="117" cy="110" r="9" fill="#ffc1db" />
    <Path d="M73 42 Q61 15 55 23 M87 42 Q99 15 105 23" fill="none" stroke="#562797" strokeWidth="5" strokeLinecap="round" />
    <Ellipse cx="80" cy="103" rx="13" ry="33" fill="#6331b4" />
    <Circle cx="80" cy="62" r="27" fill="#ffdb55" />
    <Ellipse cx="62" cy="68" rx="6" ry="4" fill="#ff9c87" /><Ellipse cx="98" cy="68" rx="6" ry="4" fill="#ff9c87" />
    <Circle cx="70" cy="59" r="3" fill="#24304a" /><Circle cx="90" cy="59" r="3" fill="#24304a" />
    <Path d="M72 72 Q80 81 88 72" fill="none" stroke="#743440" strokeWidth="3" strokeLinecap="round" />
  </Svg>;
}
