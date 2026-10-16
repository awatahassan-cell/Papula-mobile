import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function ResponsiveStoryImage({ source, label }: { source: number; label: string }) {
  return <View style={styles.frame}><Image source={source} accessibilityLabel={label} resizeMode="contain" style={styles.image} /></View>;
}
const styles = StyleSheet.create({
  frame: { width: '100%', maxWidth: 620, maxHeight: 330, aspectRatio: 1, alignSelf: 'center', borderRadius: 32, overflow: 'hidden' },
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});
