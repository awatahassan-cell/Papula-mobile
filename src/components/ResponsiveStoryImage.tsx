import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useResponsive } from '../theme/responsive';

/** A square picture; on phones it stops at 330 so the story text stays visible below it. */
export function ResponsiveStoryImage({ source, label }: { source: number; label: string }) {
  const { tablet } = useResponsive();
  return <View style={[styles.frame, !tablet && styles.phone]}><Image source={source} accessibilityLabel={label} resizeMode="contain" style={styles.image} /></View>;
}
const styles = StyleSheet.create({
  frame: { width: '100%', maxWidth: 620, aspectRatio: 1, alignSelf: 'center', borderRadius: 32, overflow: 'hidden' },
  phone: { maxHeight: 330 },
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});
