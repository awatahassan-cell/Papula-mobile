import React, { forwardRef, useState } from 'react';
import { StyleSheet, TouchableOpacity as NativeTouchableOpacity, TouchableOpacityProps } from 'react-native';

/** Keep a stable hit area; lower the face and flatten its raised edge while held. */
export const TactileButton = forwardRef<React.ElementRef<typeof NativeTouchableOpacity>, TouchableOpacityProps>(function TactileButton(
  { style, disabled, onPressIn, onPressOut, activeOpacity = 1, ...props }, ref,
) {
  const [held, setHeld] = useState(false);
  const face = StyleSheet.flatten(style) || {};
  const pressed = held && !disabled;
  const depth = Math.min(4, Math.max(2, Number(face.borderBottomWidth || 0) - 1));
  return <NativeTouchableOpacity {...props} ref={ref} disabled={disabled} activeOpacity={activeOpacity}
    onPressIn={event => { if (!disabled) { setHeld(true); onPressIn?.(event); } }}
    onPressOut={event => { setHeld(false); onPressOut?.(event); }}
    style={[style, pressed && {
      transform: [...(Array.isArray(face.transform) ? face.transform : []), { translateY: depth }],
      shadowOpacity: 0, elevation: 0,
      ...(face.borderBottomWidth && face.backgroundColor ? { borderBottomColor: face.backgroundColor } : {}),
    }]} />;
});
