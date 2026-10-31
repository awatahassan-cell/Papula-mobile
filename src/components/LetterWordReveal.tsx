import { BRAND, GOLD } from '../theme/tokens';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { Text } from './RTLText';
import { useReducedMotion } from './Motion';
import { HighlightedWord } from './HighlightedWord';

const native = Platform.OS !== 'web';

/** After a letter is written well: the letter pops out as a tile, then the word it starts slides in beside it. */
export function LetterWordReveal({ glyph, word }: { glyph: string; word: string }) {
  const reduced = useReducedMotion();
  const [tile] = useState(() => new Animated.Value(reduced ? 1 : 0)), [text] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) return;
    Animated.sequence([
      Animated.spring(tile, { toValue: 1, friction: 4, tension: 140, useNativeDriver: native }),
      Animated.timing(text, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
    ]).start();
  }, [reduced, tile, text]);
  return <View accessible accessibilityLabel={`${glyph} ... ${word}`} style={s.row}>
    <Animated.View style={[s.tile, { transform: [{ scale: tile.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }, { rotate: tile.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] }) }] }]}><Text style={s.glyph}>{glyph}</Text></Animated.View>
    <Animated.View style={{ opacity: text, transform: [{ translateX: text.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}><HighlightedWord word={word} glyph={glyph} style={s.word}/></Animated.View>
  </View>;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 4 },
  tile: { width: 76, height: 84, borderRadius: 28, backgroundColor: GOLD.face, borderBottomWidth: 6, borderBottomColor: GOLD.lip, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 48, color: GOLD.ink, textAlign: 'center' },
  word: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 34, color: BRAND.main, textAlign: 'center' },
});
