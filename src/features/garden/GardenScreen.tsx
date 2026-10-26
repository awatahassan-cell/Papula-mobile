import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BigButton } from '../../components/BigButton';
import { PapulaMascot } from '../../components/PapulaMascot';
import { HelpHint } from '../../components/HelpButton';
import { soundService } from '../../services/soundService';
import { SPOKEN_GUIDES } from '../../data/spokenGuides';
import { PetArt } from '../../components/PetArt';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { useReducedMotion } from '../../components/Motion';
import { tintedButterfly } from '../../components/tintedButterfly';
import { useAppearance } from '../../theme/useAppearance';
import { useResponsive } from '../../theme/responsive';
import { GOLD } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { haptics } from '../../services/haptics';
import {
  GARDEN_BUTTERFLIES, GOAL_TEXT, GardenButterfly, RARITY_TEXT, earnedButterflies, fedToday, gardenCounts, giftDaysOwed, giftReady, giftTotal,
  goalProgress, isEarned, nectarOf, nextStage, petFed, petMood, petStage, stageProgress, unseenButterflies,
} from '../../data/garden';
import { GARDEN_TEXT as T } from './gardenText';

const native = Platform.OS !== 'web';
const GoldButton: React.FC<{ label: string; onPress: () => void; disabled?: boolean }> = ({ label, onPress, disabled }) =>
  <TactileButton accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[s.feed, disabled && s.feedOff]}><Text style={s.feedText}>{label}</Text></TactileButton>;
const RARITY_COLOR = { common: '#8aa0c8', rare: '#e0a800', legendary: '#d6478f' } as const;

export const Butterfly: React.FC<{ item: GardenButterfly; size: number; locked?: boolean }> = ({ item, size, locked }) => {
  const art = useMemo(() => tintedButterfly(item.id, item.hue, 'happy', locked), [item.id, item.hue, locked]);
  return <PapulaMascot size={size} art={art} flap={!locked} />;
};

/** Shown when butterflies were earned since the garden was last opened; one at a time. */
const Reveal: React.FC<{ queue: GardenButterfly[]; onDone: () => void }> = ({ queue, onDone }) => {
  const { colors: c } = useAppearance();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [pop] = useState(() => new Animated.Value(0));
  const item = queue[index];
  useEffect(() => {
    pop.setValue(0);
    if (reduced) { pop.setValue(1); return; }
    Animated.spring(pop, { toValue: 1, friction: 4.5, tension: 90, useNativeDriver: native }).start();
    haptics.success();
  }, [index, reduced, pop]);
  if (!item) return null;
  const last = index + 1 >= queue.length;
  return <Modal transparent animationType="fade" onRequestClose={onDone}>
    <View style={s.scrim}>
      <View style={[s.revealCard, { backgroundColor: c.paper, borderColor: RARITY_COLOR[item.rarity] }]}>
        <Text style={[s.revealTitle, { color: c.ink }]}>{T.newOne}</Text>
        <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }, { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) }] }}>
          <Butterfly item={item} size={210} />
        </Animated.View>
        <Text style={[s.itemName, { color: c.ink }]}>{item.name}</Text>
        <View style={[s.chip, { backgroundColor: RARITY_COLOR[item.rarity] }]}><Text style={s.chipText}>{RARITY_TEXT[item.rarity]}</Text></View>
        <Text style={[s.small, { color: c.muted }]}>{GOAL_TEXT[item.kind](item.n)} ✓</Text>
        <GoldButton label={last ? T.great : T.next(queue.length - index - 1)} onPress={() => (last ? onDone() : setIndex(index + 1))} />
        {!last && <BigButton variant="secondary" size="sm" onPress={onDone}>{T.skip}</BigButton>}
      </View>
    </View>
  </Modal>;
};

export const GardenContents: React.FC<{ section?: 'all'|'companion'|'collection'; embedded?: boolean }> = ({section='all',embedded=false}) => {
  const { colors: c, isNight } = useAppearance();
  const { pageMax } = useResponsive();
  const { currentProfile, feedPet, claimPetGift, markButterfliesSeen, setRoute } = useAppStore();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<GardenButterfly | null>(null);
  const [bounce, setBounce] = useState(0);
  const [gotGift, setGotGift] = useState(0), [giftDays, setGiftDays] = useState(0);
  const [reveal, setReveal] = useState<GardenButterfly[]>(() => unseenButterflies(currentProfile)); // butterflies earned since the last visit, celebrated on arrival
  const [float] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const config = { duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: native, isInteraction: false };
    const loop = Animated.loop(Animated.sequence([Animated.timing(float, { ...config, toValue: 1 }), Animated.timing(float, { ...config, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [reduced, float]);

  const counts = gardenCounts(currentProfile), earned = earnedButterflies(currentProfile).length;
  const fed = petFed(currentProfile), stage = petStage(fed), next = nextStage(fed), nectar = nectarOf(currentProfile);
  const mood = petMood(currentProfile), fedNow = fedToday(currentProfile), gift = giftReady(currentProfile);
  const feedIt = () => { if (nectar < 1) return; feedPet(); setBounce(n => n + 1); haptics.success(); };
  const takeGift = () => { const total = giftTotal(currentProfile), days = giftDaysOwed(currentProfile); claimPetGift(); setGotGift(total); setGiftDays(days); };
  const sky: [string, string] = isNight ? ['#1d1a4f', '#2c2a72'] : ['#d9ecff', '#f3e8ff'];

  const Container=embedded?View:ScrollView;
  return <Container {...(embedded?{style:{gap:14}}:{contentContainerStyle:[s.page,{maxWidth:pageMax}]})}>
    {!embedded&&<HelpHint text={SPOKEN_GUIDES.garden} disabled={!soundService.canSpeak(SPOKEN_GUIDES.garden)} />}
    {section!=='collection'&&<LinearGradient colors={sky} style={s.pet}>
      <Text style={[s.heading, { color: isNight ? '#fff' : '#3b2f63' }]}>{T.friend}</Text>
      <PetArt stage={stage} mood={mood} size={section==='companion'?140:190} bounceKey={bounce} />
      <Text style={[s.stage, { color: isNight ? '#fff' : '#3b2f63' }]}>{T.stageLabel(stage.name)}</Text>
      <View accessibilityRole="progressbar" accessibilityLabel={T.friend} accessibilityValue={{ min: 0, max: 100, now: Math.round(stageProgress(fed) * 100) }} style={s.track}>
        <View style={[s.fill, { width: `${Math.round(stageProgress(fed) * 100)}%` }]} />
      </View>
      {section!=='companion'&&<Text style={[s.small, { color: isNight ? '#d7d3f5' : '#5b5380' }]}>{next ? T.toNext(next.name, next.from - fed) : T.maxStage}</Text>}
      <Text style={[s.small, { color: isNight ? '#d7d3f5' : '#5b5380' }]}>{fedNow ? T.fedToday : mood === 'sleepy' ? T.sleepy : ''}</Text>
      {section!=='companion'&&<View style={[s.nectar, { backgroundColor: GOLD.soft, borderColor: GOLD.border }]}><Text style={s.nectarText}>🍯 {T.nectar(nectar)}</Text></View>}
      <GoldButton label={T.feed} disabled={nectar < 1} onPress={feedIt} />
      {nectar < 1 && (section==='companion'?<BigButton variant="secondary" onPress={()=>setRoute('home')} style={s.wide}>با گەشتەکەم بەردەوام بکەم</BigButton>:<Text style={[s.small, { color: isNight ? '#d7d3f5' : '#5b5380' }]}>{T.noNectar}</Text>)}
      {gift ? <BigButton variant="outline" onPress={takeGift} style={s.wide}>{T.gift}</BigButton>
        : (section!=='companion'||gotGift>0)&&<Text style={[s.small, { color: isNight ? '#d7d3f5' : '#5b5380' }]}>{gotGift ? `${giftDays > 1 ? T.giftBack(giftDays) + ' ' : ''}${T.giftGot(gotGift)}` : T.giftWait}</Text>}
    </LinearGradient>}

    {section!=='companion'&&<>
    <View style={s.collectionHead}>
      <Text style={[s.heading, { color: c.ink }]}>{T.collection}</Text>
      <View style={[s.chip, { backgroundColor: c.paper, borderColor: c.edge, borderWidth: 1 }]}><Text style={[s.small, { color: c.ink }]}>{T.count(earned, GARDEN_BUTTERFLIES.length)}</Text></View>
    </View>
    <View style={s.grid}>{GARDEN_BUTTERFLIES.map((item, index) => {
      const open = isEarned(item, counts), isNew = open && !currentProfile.seenButterflyIds?.includes(item.id);
      return <TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={open ? item.name : `${T.locked}: ${GOAL_TEXT[item.kind](item.n)}`}
        onPress={() => setSelected(item)} style={[s.cell, { backgroundColor: c.paper, borderColor: open ? RARITY_COLOR[item.rarity] : c.edge }]}>
        <Animated.View style={{ transform: [{ translateY: open ? float.interpolate({ inputRange: [0, 1], outputRange: index % 2 ? [3, -3] : [-3, 3] }) : 0 }] }}>
          <Butterfly item={item} size={76} locked={!open} />
        </Animated.View>
        <Text numberOfLines={1} style={[s.cellName, { color: open ? c.ink : c.muted }]}>{open ? item.name : '؟'}</Text>
        {isNew && <View style={s.newDot} />}
      </TactileButton>;
    })}</View>

    {unseenButterflies(currentProfile).length>0&&<GoldButton label="پەپوولە نوێکانم ببینم" onPress={()=>setReveal(unseenButterflies(currentProfile))}/> }
    </>}
    <Modal transparent visible={!!selected} animationType="fade" onRequestClose={() => setSelected(null)}>
      {selected && <View style={s.scrim}>
        <View style={[s.revealCard, { backgroundColor: c.paper, borderColor: isEarned(selected, counts) ? RARITY_COLOR[selected.rarity] : c.edge }]}>
          <Butterfly item={selected} size={170} locked={!isEarned(selected, counts)} />
          <Text style={[s.itemName, { color: c.ink }]}>{isEarned(selected, counts) ? selected.name : T.locked}</Text>
          <View style={[s.chip, { backgroundColor: RARITY_COLOR[selected.rarity] }]}><Text style={s.chipText}>{RARITY_TEXT[selected.rarity]}</Text></View>
          <Text style={[s.small, { color: c.muted }]}>{T.earnedBy}: {GOAL_TEXT[selected.kind](selected.n)}</Text>
          {!isEarned(selected, counts) && <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: selected.n, now: Math.min(selected.n, counts[selected.kind]) }} style={s.track}><View style={[s.fill, { width: `${Math.round(goalProgress(selected, counts) * 100)}%` }]} /></View>}
          <BigButton variant="secondary" onPress={() => setSelected(null)}>{T.close}</BigButton>
        </View>
      </View>}
    </Modal>
    {reveal.length > 0 && <Reveal queue={reveal} onDone={() => { markButterfliesSeen(reveal.map(item => item.id)); setReveal([]); }} />}
  </Container>;
};

export const GardenScreen = () => <GardenContents/>;

const s = StyleSheet.create({
  page: { width: '100%', alignSelf: 'center', padding: 16, gap: 14, paddingBottom: 28 },
  pet: { borderRadius: 30, padding: 16, alignItems: 'center', gap: 8 },
  heading: { fontSize: 19, fontFamily: 'IBMPlexSansArabic_700Bold' },
  stage: { fontSize: 20, fontFamily: 'IBMPlexSansArabic_700Bold' },
  small: { fontSize: 13, fontFamily: 'IBMPlexSansArabic_400Regular', textAlign: 'center' },
  track: { width: '80%', height: 12, borderRadius: 6, backgroundColor: 'rgba(120,100,180,0.25)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: '#21b977' },
  nectar: { minHeight: 40, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, justifyContent: 'center' },
  nectarText: { fontSize: 15, fontFamily: 'IBMPlexSansArabic_700Bold', color: GOLD.starInk },
  wide: { alignSelf: 'stretch' },
  feed: { alignSelf: 'stretch', minHeight: 58, borderRadius: 20, backgroundColor: GOLD.face, borderBottomWidth: 5, borderBottomColor: GOLD.lip, alignItems: 'center', justifyContent: 'center' },
  feedOff: { opacity: 0.5 },
  feedText: { color: GOLD.ink, fontSize: 19, fontFamily: 'IBMPlexSansArabic_700Bold' },
  collectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  cell: { width: '30%', flexGrow: 1, maxWidth: 160, minHeight: 112, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 4 },
  cellName: { fontSize: 12, fontFamily: 'IBMPlexSansArabic_600SemiBold', textAlign: 'center' },
  newDot: { position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff4d6d' },
  scrim: { flex: 1, backgroundColor: 'rgba(20,16,50,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  revealCard: { width: '100%', maxWidth: 380, borderRadius: 30, borderWidth: 3, padding: 20, alignItems: 'center', gap: 10 },
  revealTitle: { fontSize: 24, fontFamily: 'IBMPlexSansArabic_700Bold' },
  itemName: { fontSize: 22, fontFamily: 'IBMPlexSansArabic_700Bold', textAlign: 'center' },
  chip: { paddingHorizontal: 12, minHeight: 28, borderRadius: 14, justifyContent: 'center' },
  chipText: { color: '#fff', fontSize: 13, fontFamily: 'IBMPlexSansArabic_700Bold' },
});
