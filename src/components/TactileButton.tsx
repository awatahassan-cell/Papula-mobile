import React, { forwardRef, useState } from 'react';
import { StyleSheet, TouchableOpacity as NativeTouchableOpacity, TouchableOpacityProps } from 'react-native';

/**
 * A raised button with a darker bottom lip. While held, the face sinks into the lip:
 * the lip thins to a hairline, the top edge drops, and the bottom edge stays where it was,
 * so neighbours never move.
 */
export const TactileButton = forwardRef<React.ElementRef<typeof NativeTouchableOpacity>, TouchableOpacityProps>(function TactileButton(
  { style, disabled, onPressIn, onPressOut, activeOpacity = 1, ...props }, ref,
) {
  const [held, setHeld] = useState(false);
  const face = StyleSheet.flatten(style) || {};
  const pressed = held && !disabled;
  const lip = Number(face.borderBottomWidth || 0);
  const sink = lip > 1 ? Math.min(4, lip - 1) : 0;
  const shrink = (value: unknown) => typeof value === 'number' ? { value: value - sink } : null;
  const minHeight = shrink(face.minHeight), height = shrink(face.height);
  return <NativeTouchableOpacity {...props} ref={ref} disabled={disabled} activeOpacity={activeOpacity}
    onPressIn={event => { if (!disabled) { setHeld(true); onPressIn?.(event); } }}
    onPressOut={event => { setHeld(false); onPressOut?.(event); }}
    style={[style, pressed && {
      transform: [...(Array.isArray(face.transform) ? face.transform : []), { translateY: sink }],
      shadowOpacity: 0, elevation: 0,
      ...(sink ? { borderBottomWidth: lip - sink, marginBottom: Number(face.marginBottom || 0) + sink } : {}),
      ...(minHeight ? { minHeight: minHeight.value } : {}),
      ...(height ? { height: height.value } : {}),
    }]} />;
});
