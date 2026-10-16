import React, { forwardRef } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet, TextProps, TextInputProps } from 'react-native';

const styles = StyleSheet.create({
  alignment: { textAlign: 'right' },
  direction: { writingDirection: 'rtl', direction: 'rtl' },
});

// Keep intentional centering while enforcing RTL for mixed Kurdish text,
// numbers and punctuation, independently of the device's language.
export const Text = forwardRef<NativeText, TextProps>(function RTLText({ style, ...props }, ref) {
  return <NativeText {...props} ref={ref} style={[styles.alignment, style, styles.direction]} />;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function RTLTextInput({ style, ...props }, ref) {
  return <NativeTextInput {...props} ref={ref} style={[styles.alignment, style, styles.direction]} />;
});
