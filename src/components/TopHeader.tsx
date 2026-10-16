import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Settings, Volume2, VolumeX, Square, Star, Flame } from 'lucide-react-native';
import { Text } from './RTLText';
import { useAppStore } from '../store/useAppStore';
import { soundService } from '../services/soundService';
import { useAppearance } from '../theme/useAppearance';
import { useResponsive } from '../theme/responsive';

/** One compact row on every screen except Home: back, stars, streak, sound and parent settings. */
export const TopHeader: React.FC = () => {
  const { colors: c, isNight } = useAppearance();
  const { tablet, pageMax } = useResponsive();
  const { route, setRoute, currentProfile, parentSettings, updateParentSettings, openParentGateWithCallback } = useAppStore();
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => soundService.subscribe(value => setSpeaking(value)), []);
  if (route === 'home') return null; // the home screen has its own greeting row
  const toggleSound = () => { const enabled = !parentSettings.soundFxEnabled; updateParentSettings({ soundFxEnabled: enabled }); soundService.setSoundFxEnabled(enabled); };
  const button = { backgroundColor: isNight ? 'rgba(255,255,255,0.12)' : '#ffffff' };
  const pill = { backgroundColor: isNight ? 'rgba(255,255,255,0.12)' : '#ffffff' };
  const goHome = () => { void soundService.stopSpeaking(); setRoute('home'); };
  return <View style={[s.header, { maxWidth: pageMax }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="گەڕانەوە بۆ سەرەتا" style={[s.icon, button]} onPress={goHome}><ArrowRight color={c.ink} size={22} /></TouchableOpacity>
    {tablet && <TouchableOpacity accessibilityRole="button" accessibilityLabel="پەپوولە، سەرەتا" onPress={goHome}><Text style={[s.brand, { color: c.ink }]}>پەپوولە 🌿</Text></TouchableOpacity>}
    <View style={s.spacer} />
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`ستیکەرەکانم، ${currentProfile.stars} ئەستێرە`} style={[s.pill, pill]} onPress={() => setRoute('stickers')}>
      <Star size={17} color="#f2b94b" fill="#f2b94b" /><Text style={[s.pillText, { color: c.ink }]}>{currentProfile.stars}</Text>
    </TouchableOpacity>
    <View accessible accessibilityLabel={`${currentProfile.streakDays} ڕۆژ لە دوای یەک`} style={[s.pill, pill]}>
      <Flame size={17} color={c.coral} fill={c.coral} /><Text style={[s.pillText, { color: c.ink }]}>{currentProfile.streakDays}</Text>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={speaking ? 'وەستاندنی دەنگ' : 'دەنگی ئەپ'} style={[s.icon, button]} onPress={() => speaking ? void soundService.stopSpeaking() : toggleSound()}>
      {speaking ? <Square size={19} color={c.coral} /> : parentSettings.soundFxEnabled ? <Volume2 size={21} color={c.ink} /> : <VolumeX size={21} color={c.muted} />}
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="ڕێکخستنەکانی دایک و باوک" style={[s.icon, button]} onPress={() => openParentGateWithCallback(() => setRoute('parent-dashboard'))}><Settings size={21} color={c.muted} /></TouchableOpacity>
  </View>;
};

const s = StyleSheet.create({
  header: { width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, direction: 'rtl' },
  spacer: { flex: 1 },
  brand: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pill: { minHeight: 40, borderRadius: 20, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 15 },
});
