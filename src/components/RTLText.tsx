import React, { createContext, forwardRef, useContext } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet, TextProps, TextInputProps, TextStyle } from 'react-native';
import { ibmTextStyle } from '../theme/typography';
import { rtlProps } from '../theme/rtl';

const styles = StyleSheet.create({
  alignment: { textAlign: 'right' },
  direction: { writingDirection: 'rtl' },
});
// RN Web rejects direction inside StyleSheet.create; keep layout direction inline.
const layoutDirection = { direction: 'rtl' as const };
const FontContext = createContext<TextStyle>({});

// Keep intentional centering while enforcing RTL for mixed Kurdish text,
// numbers and punctuation, independently of the device's language.
export const Text = forwardRef<NativeText, TextProps>(function RTLText({ style, ...props }, ref) {
  // Highlighted letters and karaoke words keep their paragraph's font weight.
  const font = ibmTextStyle({ ...useContext(FontContext), ...StyleSheet.flatten(style) });
  return <FontContext.Provider value={font}><NativeText {...props} {...rtlProps} ref={ref} style={[styles.alignment, style, font, styles.direction, layoutDirection]} /></FontContext.Provider>;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function RTLTextInput({ style, ...props }, ref) {
  return <NativeTextInput {...props} {...rtlProps} ref={ref} style={[styles.alignment, style, ibmTextStyle(StyleSheet.flatten(style)), styles.direction, layoutDirection]} />;
});
