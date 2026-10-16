import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './RTLText';

/**
 * Shown by expo-router when a screen throws. It sits outside the app providers, so it uses fixed colours
 * and never depends on the store: a child sees a calm message and a way back instead of a blank screen.
 */
export const AppErrorScreen: React.FC<{ error: Error; retry: () => Promise<void> | void }> = ({ retry }) => (
  <View style={styles.page} accessibilityRole="alert">
    <Text style={styles.emoji}>🦋</Text>
    <Text style={styles.title}>ببوورە، شتێک هەڵەی کرد</Text>
    <Text style={styles.text}>پەپوولە کەمێک ون بوو. دووبارە هەوڵ بدە؛ پێشکەوتنی تۆ هەر پارێزراوە.</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="دووبارە هەوڵ بدە" onPress={() => void retry()} style={styles.button}>
      <Text style={styles.buttonText}>دووبارە هەوڵ بدە</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, backgroundColor: '#f4efff' },
  emoji: { fontSize: 64 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 24, color: '#3a3566', textAlign: 'center' },
  text: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 16, lineHeight: 28, color: '#6a649a', textAlign: 'center', maxWidth: 380 },
  button: { marginTop: 8, minHeight: 58, paddingHorizontal: 32, borderRadius: 28, backgroundColor: '#6b4ee0', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18, color: '#ffffff' },
});
