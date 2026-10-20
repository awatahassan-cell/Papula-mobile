import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput } from './RTLText';
import { BigButton } from './BigButton';
import { useAppStore } from '../store/useAppStore';
import { validClock } from '../services/sessionPolicy';
import { useAppearance } from '../theme/useAppearance';

export function BedtimeSettings() {
  const { parentSettings, updateParentSettings } = useAppStore();
  const { colors } = useAppearance();
  const [start, setStart] = useState(parentSettings.bedtimeStart || '20:00');
  const [end, setEnd] = useState(parentSettings.bedtimeEnd || '07:00');
  const [message, setMessage] = useState('');
  return <View style={{ gap: 8 }}>
    <Text style={{ color: colors.muted }}>کات بە شێوەی ٢٤ کاتژمێر بنووسن؛ بۆ نموونە 20:00 تا 07:00.</Text>
    {[{ label: 'دەستپێکی خەوتن', value: start, set: setStart }, { label: 'کۆتایی خەوتن', value: end, set: setEnd }].map(item => <View key={item.label} style={{ gap: 4 }}>
      <Text style={{ color: colors.ink }}>{item.label}</Text><TextInput accessibilityLabel={item.label} value={item.value} onChangeText={item.set} maxLength={5} placeholder="HH:mm" style={{ minHeight: 48, padding: 10, textAlign: 'center', color: colors.ink, backgroundColor: colors.lavender, borderRadius: 12 }} />
    </View>)}
    <BigButton size="sm" onPress={() => {
      if (!validClock(start) || !validClock(end) || start === end) { setMessage('دوو کاتی جیاواز و دروست بە شێوەی HH:mm بنووسن.'); return; }
      updateParentSettings({ bedtimeStart: start, bedtimeEnd: end }); setMessage('کاتبەندییەکە نوێ کرایەوە.');
    }}>هەڵگرتنی کاتبەندی</BigButton>
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: colors.ink }}>{message}</Text>}
  </View>;
}
