import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TactileButton } from '../../components/TactileButton';
import { Text } from '../../components/RTLText';
import { PetArt } from '../../components/PetArt';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance } from '../../theme/useAppearance';
import { tileSet } from '../../theme/candy';
import { petFed, petMood, petStage, unseenButterflies } from '../../data/garden';

/** One simple entry to the child's flowers and growing friend. */
export function PetHomeCard() {
  const { currentProfile, setRoute } = useAppStore();
  const { isNight } = useAppearance();
  const tile = tileSet(isNight)[1];
  const stage = petStage(petFed(currentProfile));
  const hasNew = unseenButterflies(currentProfile).length > 0;
  return <TactileButton accessibilityRole="button" accessibilityLabel="باخچەکەم" onPress={() => setRoute('garden')}
    style={[s.card, { backgroundColor: tile.face, borderBottomColor: tile.lip }]}>
    <PetArt stage={stage} mood={petMood(currentProfile)} size={84} />
    <View style={s.body}>
      <Text style={[s.title, { color: tile.ink }]}>باخچەکەم</Text>
    </View>
    {hasNew && <View accessibilityElementsHidden importantForAccessibility="no" style={s.dot} />}
  </TactileButton>;
}
const s = StyleSheet.create({
  dot: { position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderRadius: 7, backgroundColor: '#ff4d6d', borderWidth: 2, borderColor: '#ffffff' },
  card: { borderRadius: 24, borderBottomWidth: 5, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 100 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 17, fontFamily: 'IBMPlexSansArabic_700Bold' },
  line: { fontSize: 13, fontFamily: 'IBMPlexSansArabic_400Regular' },
  badge: { backgroundColor: '#ff4d6d', borderRadius: 14, paddingHorizontal: 10, minHeight: 28, justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 13, fontFamily: 'IBMPlexSansArabic_700Bold' },
});
