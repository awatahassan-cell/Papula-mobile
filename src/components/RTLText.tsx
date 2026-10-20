import React, { createContext, forwardRef, useContext } from 'react';
import { Platform, Text as NativeText, TextInput as NativeTextInput, StyleSheet, TextProps, TextInputProps, TextStyle } from 'react-native';
import { ibmTextStyle } from '../theme/typography';
import { rtlProps } from '../theme/rtl';

const styles = StyleSheet.create({
  alignment: { textAlign: 'right' },
  direction: { writingDirection: 'rtl' },
});
// RN Web rejects direction inside StyleSheet.create; keep layout direction inline.
const layoutDirection = { direction: 'rtl' as const };
const FontContext = createContext<TextStyle>({});
// Inline color/press spans inherit their paragraph's font and bidi attributes.
// Do not create a new styled paragraph for every word or letter.
export const InlineText = NativeText;
/** Standard: body text is never smaller than 12 px. */
export const MIN_TEXT = 12;
/**
 * On Android/iOS an explicit 'right' is flipped by React Native's own RTL handling (and does nothing at all before the
 * layout direction is switched on), so Kurdish text ended up at the left. 'auto' follows the text's own direction instead.
 */
const nativeAlign = (flat: TextStyle | undefined): TextStyle | null => Platform.OS !== 'web' && (!flat?.textAlign || flat.textAlign === 'right' || flat.textAlign === 'left') ? { textAlign: 'auto' } : null;
const floorSize = (flat: TextStyle | undefined): TextStyle | null => typeof flat?.fontSize === 'number' && flat.fontSize < MIN_TEXT ? { fontSize: MIN_TEXT, ...(typeof flat.lineHeight === 'number' && flat.lineHeight < MIN_TEXT + 4 ? { lineHeight: MIN_TEXT + 4 } : null) } : null;

// Keep intentional centering while enforcing RTL for mixed Kurdish text,
// numbers and punctuation, independently of the device's language.
export const Text = forwardRef<NativeText, TextProps>(function RTLText({ style, ...props }, ref) {
  // Highlighted letters and karaoke words keep their paragraph's font weight.
  const flat = StyleSheet.flatten(style);
  const font = ibmTextStyle({ ...useContext(FontContext), ...flat });
  return <FontContext.Provider value={font}><NativeText {...props} {...rtlProps} ref={ref} style={[styles.alignment, style, font, floorSize(flat), nativeAlign(flat), styles.direction, layoutDirection]} /></FontContext.Provider>;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function RTLTextInput({ style, ...props }, ref) {
  return <NativeTextInput {...props} {...rtlProps} ref={ref} style={[styles.alignment, style, ibmTextStyle(StyleSheet.flatten(style)), floorSize(StyleSheet.flatten(style)), nativeAlign(StyleSheet.flatten(style)), styles.direction, layoutDirection]} />;
});
