import React from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Breathe } from './Motion';
import { Text } from './RTLText';
import { BigButton } from './BigButton';

/** One brand throughout startup, with no artificial loading delay. */
export function LaunchScreen({ fontsReady = true, error = false, onRetry, onLayout }: {
  fontsReady?: boolean; error?: boolean; onRetry?: () => void; onLayout?: () => void;
}) {
  return <View style={s.screen} onLayout={onLayout}>
    <StatusBar barStyle="dark-content" backgroundColor="#eaf8ff" />
    <LinearGradient colors={['#eaf8ff', '#f5efff', '#fff8dc']} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
      <View style={[s.cloud, { top: '12%', right: -65 }]} /><View style={[s.cloud, { bottom: '12%', left: -85 }]} />
      <View style={[s.spark, { top: '20%', left: '12%', backgroundColor: '#ffcf35' }]} />
      <View style={[s.spark, { top: '32%', right: '12%', backgroundColor: '#f35caa', width: 12, height: 12 }]} />
      <View style={[s.spark, { bottom: '24%', right: '18%', backgroundColor: '#7f48dc', width: 10, height: 10 }]} />
    </View>
    <ScrollView contentContainerStyle={s.content} bounces={false}>
      <View style={s.brand}>
        <Breathe scale={1.025}><View style={s.halo}>
          <Image accessibilityLabel="لۆگۆی پەپوولە" source={require('../../assets/splash-icon.png')} style={s.logo} resizeMode="contain" />
        </View></Breathe>
        {fontsReady && <>
          <Text accessibilityRole="header" style={s.title}>پەپوولە</Text>
          <Text style={s.tagline}>پێکەوە فێر بین، پێکەوە گەشە بکەین</Text>
          <View style={s.dots} accessible={false}>{['#7c3aed', '#f35caa', '#ffcf35', '#20b9d7'].map(color => <View key={color} style={[s.dot, { backgroundColor: color }]} />)}</View>
        </>}
      </View>
      <View style={s.status}>
        {error ? <>
          <Text accessibilityRole="alert" style={s.message}>زانیارییە هەڵگیراوەکان نەکرانەوە. پێشکەوتنەکەت ناسڕدرێتەوە؛ تکایە دووبارە هەوڵ بدەوە.</Text>
          <BigButton onPress={onRetry}>دووبارە هەوڵ بدەوە</BigButton>
        </> : <>
          <ActivityIndicator size="small" color="#7436d8" accessibilityLabel="ئامادەکردنی پەپوولە" />
          {fontsReady && <Text style={s.message}>دنیای فێربوون ئامادە دەکەین…</Text>}
        </>}
      </View>
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eaf8ff' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 56, gap: 36 },
  brand: { width: '100%', maxWidth: 430, alignItems: 'center' },
  halo: { width: 232, height: 232, borderRadius: 116, backgroundColor: '#ffffff99', borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 256, height: 256 },
  title: { color: '#6330bc', fontSize: 46, fontWeight: '700', textAlign: 'center', marginTop: 14 },
  tagline: { color: '#4b4263', fontSize: 17, lineHeight: 30, textAlign: 'center', marginTop: 4 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 22 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  status: { width: '100%', maxWidth: 360, alignItems: 'center', gap: 14 },
  message: { color: '#625675', fontSize: 14, lineHeight: 25, textAlign: 'center' },
  cloud: { position: 'absolute', width: 180, height: 65, borderRadius: 65, backgroundColor: '#ffffff88', transform: [{ rotate: '-12deg' }] },
  spark: { position: 'absolute', width: 17, height: 17, borderRadius: 5, transform: [{ rotate: '35deg' }] },
});
