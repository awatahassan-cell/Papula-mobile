import React, { useState } from 'react';
import { View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { Text } from './RTLText';
import { TactileButton } from './TactileButton';
import { soundService } from '../services/soundService';
import { useAppearance } from '../theme/useAppearance';

export function HelpButton({ text, disabled = false }: { text: string; disabled?: boolean }) {
  const { colors } = useAppearance();
  const [visible, setVisible] = useState(false);
  return <View style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 3 }}>
    <TactileButton accessibilityRole="button" accessibilityLabel="چی بکەم؟ ڕێنماییەکە دووبارە ببیستە" disabled={disabled} onPress={() => { setVisible(true); void soundService.speakWord(text); }} style={{ minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }}>
      <Volume2 size={18} color={colors.mint} /><Text style={{ color: colors.mint }}>چی بکەم؟</Text>
    </TactileButton>
    {visible && <TactileButton accessibilityRole="button" accessibilityLabel="داخستنی ڕێنمایی" onPress={() => setVisible(false)} style={{ padding: 10, backgroundColor: colors.lavender, borderRadius: 14 }}><Text style={{ color: colors.ink }}>{text}</Text><Text style={{ color: colors.muted, textAlign: 'center' }}>باشە، تێگەیشتم</Text></TactileButton>}
  </View>;
}
