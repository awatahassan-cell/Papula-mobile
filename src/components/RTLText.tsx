import React, { forwardRef } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet, TextProps, TextInputProps } from 'react-native';

const styles = StyleSheet.create({
  alignment: { textAlign: 'right' },
  direction: { writingDirection: 'rtl' },
});
// RN Web rejects direction inside StyleSheet.create; keep layout direction inline.
const layoutDirection = { direction: 'rtl' as const };

// Keep intentional centering while enforcing RTL for mixed Kurdish text,
// numbers and punctuation, independently of the device's language.
export const Text = forwardRef<NativeText, TextProps>(function RTLText({ style, ...props }, ref) {
  return <NativeText {...props} ref={ref} style={[styles.alignment, style, styles.direction, layoutDirection]} />;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function RTLTextInput({ style, ...props }, ref) {
  return <NativeTextInput {...props} ref={ref} style={[styles.alignment, style, styles.direction, layoutDirection]} />;
});
