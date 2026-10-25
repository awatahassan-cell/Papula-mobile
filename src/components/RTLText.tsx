import React, { createContext, forwardRef, useContext } from 'react';
import { Platform, Text as NativeText, TextInput as NativeTextInput, StyleSheet, TextProps, TextInputProps, TextStyle, View } from 'react-native';
import { ibmTextStyle } from '../theme/typography';
import { rtlProps } from '../theme/rtl';
import { pictureFor } from '../art/pictures';
import { CharacterPicture } from './CharacterPicture';
import { pictureLabel } from '../art/pictureLabel';

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
function plainLabel(children:React.ReactNode):string|undefined {
  if(typeof children==='string'||typeof children==='number')return String(children);
  if(children==null||typeof children==='boolean')return '';
  if(Array.isArray(children)){const parts=children.map(plainLabel);return parts.some(part=>part===undefined)?undefined:parts.join('');}
  return undefined;
}
export const Text = forwardRef<NativeText, TextProps>(function RTLText({ style, ...props }, ref) {
  // Highlighted letters and karaoke words keep their paragraph's font weight.
  const flat = StyleSheet.flatten(style);
  const font = ibmTextStyle({ ...useContext(FontContext), ...flat });
  // A lone emoji is drawn with the app's own picture, sized from the text's font size (see src/art/pictures.ts).
  const picture = typeof props.children === 'string' ? pictureFor(props.children) : undefined;
  if (picture) {
    const size = Math.round((typeof flat?.fontSize === 'number' ? flat.fontSize : 24) * 1.15);
    return <View accessible={false} importantForAccessibility="no" style={[{ width: size, height: size, alignSelf: 'center' }, flat && { marginVertical: flat.marginVertical, margin: flat.margin }]}>
      <CharacterPicture symbol={String(props.children)} size={size} />
    </View>;
  }
  // Mixed button labels use a vector beside one intact text run, never SVG nested inside native Text.
  const raw=plainLabel(props.children);
  const label=raw===undefined?undefined:pictureLabel(raw);
  if(label?.symbols.length){
    const size=Math.round((typeof flat?.fontSize==='number'?flat.fontSize:16)*1.15);
    return <View style={{flexDirection:'row-reverse',flexWrap:'wrap',alignItems:'center',justifyContent:flat?.textAlign==='center'?'center':'flex-start',gap:6}}>
      {label.symbols.map((symbol,index)=><CharacterPicture key={index} symbol={symbol} size={size} animate={false}/>)}
      {!!label.text.trim()&&<FontContext.Provider value={font}><NativeText {...props} {...rtlProps} ref={ref} style={[styles.alignment,style,font,floorSize(flat),nativeAlign(flat),styles.direction,layoutDirection,{flexShrink:1}]}>{label.text}</NativeText></FontContext.Provider>}
    </View>;
  }
  return <FontContext.Provider value={font}><NativeText {...props} {...rtlProps} ref={ref} style={[styles.alignment, style, font, floorSize(flat), nativeAlign(flat), styles.direction, layoutDirection]} /></FontContext.Provider>;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function RTLTextInput({ style, ...props }, ref) {
  return <NativeTextInput {...props} {...rtlProps} ref={ref} style={[styles.alignment, style, ibmTextStyle(StyleSheet.flatten(style)), floorSize(StyleSheet.flatten(style)), nativeAlign(StyleSheet.flatten(style)), styles.direction, layoutDirection]} />;
});
