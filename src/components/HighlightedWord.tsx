import React from 'react';
import { Platform, TextProps } from 'react-native';
import { Text, InlineText } from './RTLText';
import { androidLetterHighlightRuns, LETTER_HIGHLIGHT_COLOR } from '../services/letterHighlight';

const targetStyle = { color: LETTER_HIGHLIGHT_COLOR };

/** Keep a word in one text layout; only the target's foreground color changes. */
export function HighlightedWord({ word, glyph, ...props }: Omit<TextProps, 'children'> & { word: string; glyph: string }) {
  return <Text {...props} accessibilityLabel={word}>
    {androidLetterHighlightRuns(word, glyph).map((run, index) => {
      const text = Platform.OS === 'android' ? run.displayText : run.text;
      return run.target ? <InlineText key={index} style={targetStyle}>{text}</InlineText> : text;
    })}
  </Text>;
}
