import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TactileButton } from '../../components/TactileButton';
import { Text } from '../../components/RTLText';
import { PetArt } from '../../components/PetArt';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance } from '../../theme/useAppearance';
import { tileSet } from '../../theme/candy';
import { GARDEN_BUTTERFLIES, earnedButterflies, nectarOf, petFed, petMood, petStage, unseenButterflies } from '../../data/garden';
import { GARDEN_TEXT } from '../garden/gardenText';

/** The home screen's one reminder of the friend: how it is doing, how many butterflies, and new ones waiting. */
export function PetHomeCard() {
  const { currentProfile, setRoute } = useAppStore();
  const { isNight } = useAppearance();
  const tile = tileSet(isNight)[1];
  const stage = petStage(petFed(currentProfile));
  const fresh = unseenButterflies(currentProfile).length;
  return <TactileButton accessibilityRole="button" accessibilityLabel={GARDEN_TEXT.homeCard} onPress={() => setRoute('garden')}
    style={[s.card, { backgroundColor: tile.face, borderBottomColor: tile.lip }]}>
    <PetArt stage={stage} mood={petMood(currentProfile)} size={84} />
    <View style={s.body}>
      <Text style={[s.title, { color: tile.ink }]}>{GARDEN_TEXT.homeCard}</Text>
      <Text style={[s.line, { color: tile.ink }]}>{stage.name} · {GARDEN_TEXT.count(earnedButterflies(currentProfile).length, GARDEN_BUTTERFLIES.length)} 🦋 · 🍯 {nectarOf(currentProfile)}</Text>
    </View>
    {fresh > 0 && <View style={s.badge}><Text style={s.badgeText}>{GARDEN_TEXT.homeNew(fresh)}</Text></View>}
  </TactileButton>;
}
const s = StyleSheet.create({
  card: { borderRadius: 24, borderBottomWidth: 5, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 100 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 17, fontFamily: 'IBMPlexSansArabic_700Bold' },
  line: { fontSize: 13, fontFamily: 'IBMPlexSansArabic_400Regular' },
  badge: { backgroundColor: '#ff4d6d', borderRadius: 14, paddingHorizontal: 10, minHeight: 28, justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 13, fontFamily: 'IBMPlexSansArabic_700Bold' },
});
