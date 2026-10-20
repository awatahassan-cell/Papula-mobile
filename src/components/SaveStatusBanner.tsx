import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { persistentWrites } from '../services/repositories';
import { Text } from './RTLText';
import { TactileButton } from './TactileButton';
import { useAppearance } from '../theme/useAppearance';

export function SaveStatusBanner() {
  const [status, setStatus] = useState(persistentWrites.status());
  const { colors } = useAppearance();
  useEffect(() => persistentWrites.subscribe(setStatus), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void persistentWrites.retry(); });
    return () => sub.remove();
  }, []);
  if (!status.failed) return null;
  return <View accessibilityRole="alert" style={{ padding: 12, backgroundColor: colors.peach, gap: 8 }}>
    <Text style={{ color: colors.ink }}>پێشکەوتنەکەت هێشتا هەڵنەگیراوە. تکایە پێش داخستنی ئەپەکە دووبارە هەوڵ بدەوە.</Text>
    <TactileButton accessibilityRole="button" disabled={status.saving} onPress={() => void persistentWrites.retry()} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: colors.ink }}>{status.saving ? 'هەڵگرتن…' : 'دووبارە هەڵیبگرە'}</Text>
    </TactileButton>
  </View>;
}
