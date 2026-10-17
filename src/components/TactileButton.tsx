import React, { forwardRef, useState } from 'react';
import { haptics } from '../services/haptics';
import { StyleSheet, TouchableOpacity as NativeTouchableOpacity, TouchableOpacityProps } from 'react-native';

const MIN_TARGET = 44;
/**
 * A raised button with a darker bottom lip. While held, the face sinks into the lip:
 * the lip thins to a hairline, the top edge drops, and the bottom edge stays where it was,
 * so neighbours never move.
 */
export const TactileButton = forwardRef<React.ElementRef<typeof NativeTouchableOpacity>, TouchableOpacityProps>(function TactileButton(
  { style, disabled, onPressIn, onPressOut, activeOpacity = 1, ...props }, ref,
) {
  const [held, setHeld] = useState(false);
  // Standard: every control is at least 44 px to hit. Fixed-size ones (30 px dots, 36 px icons) get an invisible margin;
  // the others grow to 44 px tall.
  const given = StyleSheet.flatten(style) || {};
  const fixedH = typeof given.height === 'number' ? given.height : undefined, fixedW = typeof given.width === 'number' ? given.width : undefined;
  const grow = fixedH === undefined && !(typeof given.minHeight === 'number' && given.minHeight >= MIN_TARGET) ? { minHeight: MIN_TARGET } : null;
  const slack = (size: number | undefined) => size !== undefined && size < MIN_TARGET ? Math.ceil((MIN_TARGET - size) / 2) : 0;
  const hitSlop = props.hitSlop ?? (slack(fixedH) || slack(fixedW) ? { top: slack(fixedH), bottom: slack(fixedH), left: slack(fixedW), right: slack(fixedW) } : undefined);
  const face = grow ? { ...given, ...grow } : given;
  const pressed = held && !disabled;
  const lip = Number(face.borderBottomWidth || 0);
  const sink = lip > 1 ? Math.min(4, lip - 1) : 0;
  const shrink = (value: unknown) => typeof value === 'number' ? { value: value - sink } : null;
  const minHeight = shrink(face.minHeight), height = shrink(face.height);
  return <NativeTouchableOpacity {...props} hitSlop={hitSlop} ref={ref} disabled={disabled} activeOpacity={activeOpacity}
    onPressIn={event => { if (!disabled) { setHeld(true); haptics.tap(); onPressIn?.(event); } }}
    onPressOut={event => { setHeld(false); onPressOut?.(event); }}
    style={[style, grow, pressed && {
      transform: [...(Array.isArray(face.transform) ? face.transform : []), { translateY: sink }],
      shadowOpacity: 0, elevation: 0,
      ...(sink ? { borderBottomWidth: lip - sink, marginBottom: Number(face.marginBottom || 0) + sink } : {}),
      ...(minHeight ? { minHeight: minHeight.value } : {}),
      ...(height ? { height: height.value } : {}),
    }]} />;
});
