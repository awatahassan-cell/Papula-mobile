import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Flame, PencilLine, Puzzle, Settings, Sparkles, Sprout, Star } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { Glass } from '../../components/Glass';
import { gardenMascot } from '../../components/GardenArtwork';
import { ProgressRing } from '../../components/ProgressRing';
import { JourneyMap, MapNode } from '../../components/JourneyMap';
import { Breathe, RiseIn } from '../../components/Motion';
import { useAppStore, AppRoute } from '../../store/useAppStore';
import { dueReviewLetters } from '../../services/learningEngine';
import { lessonChecklist, lessonPath, nextLessonLetter } from '../../services/lessonPath';
import { useResponsive } from '../../theme/responsive';
import { useAppearance } from '../../theme/useAppearance';
import { soundService } from '../../services/soundService';

const ACTIVITIES: { route: AppRoute; title: string; hint: string; Icon: typeof BookOpen; tint: 'peach' | 'leaf' | 'lavender' | 'sky' }[] = [
  { route: 'stories', title: 'چیرۆک', hint: 'ببینە و ببیستە', Icon: BookOpen, tint: 'peach' },
  { route: 'match-game', title: 'یاری', hint: 'پیت و وشە و بڕگە', Icon: Puzzle, tint: 'leaf' },
  { route: 'writing', title: 'نووسین', hint: 'پیتەکان بنووسە', Icon: PencilLine, tint: 'lavender' },
  { route: 'daily-practice', title: 'مەشق', hint: 'بیریان بکەرەوە', Icon: Sprout, tint: 'sky' },
];

export const HomeScreen: React.FC = () => {
  const { colors: c, extras, isNight } = useAppearance();
  const { wide, pageMax, tablet } = useResponsive();
  const { currentProfile, setRoute, setSelectedLetter, openParentGateWithCallback } = useAppStore();
  const path = lessonPath(currentProfile);
  const next = nextLessonLetter(currentProfile);
  const completed = path.filter(node => node.status === 'completed').length;
  const checklist = next ? lessonChecklist(currentProfile, next.id) : [];
  const stepsDone = checklist.filter(item => item.done).length;
  const level = Math.floor(completed / 6) + 1, levelProgress = (completed % 6) / 6;
  const dueCount = dueReviewLetters(currentProfile).length;
  const missions = currentProfile.dailyMissions || [];
  const missionsDone = missions.filter(mission => mission.completed).length;
  const open = (route: AppRoute) => { void soundService.stopSpeaking(); setRoute(route); };
  const startLesson = () => { void soundService.stopSpeaking(); if (next) { setSelectedLetter(next); setRoute('letter-detail'); } else setRoute('alphabet'); };
  const openNode = (node: MapNode) => { void soundService.stopSpeaking(); setSelectedLetter(node.letter); setRoute('letter-detail'); };
  const activeIndex = Math.max(0, path.findIndex(node => node.status === 'current'));
  const mapNodes = path.slice(Math.max(0, activeIndex - 1), Math.max(0, activeIndex - 1) + 4);
  const text = { color: c.ink };
  const muted = { color: c.muted };

  const chips = <View style={s.chips}>
    <View accessible accessibilityLabel={`${currentProfile.streakDays} ڕۆژ لە دوای یەک`} style={[s.chip, { backgroundColor: isNight ? 'rgba(255,143,208,0.2)' : '#ffe3d6' }]}><Flame size={20} color={isNight ? '#ff8fd0' : '#f26a3d'} fill={isNight ? '#ff8fd0' : '#f26a3d'} /><Text style={[s.chipText, text]}>{currentProfile.streakDays} ڕۆژ</Text></View>
    <View accessible accessibilityLabel={`${currentProfile.stars} ئەستێرە`} style={[s.chip, { backgroundColor: isNight ? 'rgba(255,214,107,0.2)' : '#fff0bf' }]}><Star size={20} color="#f2b94b" fill="#f2b94b" /><Text style={[s.chipText, text]}>{currentProfile.stars}</Text></View>
    {isNight && <View accessible accessibilityLabel={`ئاستی ${level}`} style={[s.chip, { backgroundColor: 'rgba(94,234,212,0.18)' }]}><Text style={[s.chipText, { color: '#5eead4' }]}>ئاستی {level}</Text></View>}
  </View>;

  const profileRow = <View style={s.profileRow}>
    <LinearGradient colors={isNight ? ['#ff8fd0', '#a78bfa'] : ['#ffc9a8', '#ff9fb8']} style={s.avatar}><Text style={s.avatarText}>{currentProfile.avatar}</Text></LinearGradient>
    <View style={s.profileCopy}>
      <Text style={[s.hello, muted]}>{isNight ? 'ئێوارەبەخێر' : 'ڕۆژبەخێر'}</Text>
      <Text numberOfLines={1} style={[s.name, text]}>{currentProfile.name}</Text>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="ڕێکخستنەکانی دایک و باوک" onPress={() => openParentGateWithCallback(() => setRoute('parent-dashboard'))}>
      <Glass radius={999} style={s.gear}><Settings size={20} color={c.muted} /></Glass>
    </TouchableOpacity>
  </View>;

  // Day: a gradient lesson card with a watermark letter, a progress ring and a white call-to-action.
  const hero = <View testID="home-lesson-card" style={s.heroShadow}>
    <LinearGradient colors={extras.hero} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
      <Text accessible={false} style={s.watermark}>{next?.glyph || '✓'}</Text>
      <Sparkles accessible={false} size={22} color="rgba(255,255,255,0.7)" style={s.spark1} /><Star accessible={false} size={14} color="rgba(255,240,170,0.9)" fill="rgba(255,240,170,0.9)" style={s.spark2} />
      <View style={s.heroTop}>
        <View style={s.flex}>
          <View style={s.heroPill}><Text style={s.heroPillText}>{next ? `وانەی ${completed + 1} · هەنگاوی داهاتوو` : 'ڕێڕەوەکەت تەواو بوو'}</Text></View>
          <Text style={s.heroTitle}>{next ? `با پیتی «${next.glyph}» فێر بین` : 'ئافەرم! هەموو وانەکانت کرد'}</Text>
        </View>
        <Image accessible={false} source={gardenMascot} resizeMode="contain" style={s.heroMascot} />
      </View>
      {next && <View style={s.ringRow}>
        <ProgressRing value={stepsDone / 5} track="rgba(255,255,255,0.3)" color="#ffffff" label={`${stepsDone} هەنگاو لە ٥ تەواو بووە`} />
        <Text style={s.ringText}>{stepsDone} هەنگاو لە ٥ تەواو بووە</Text>
      </View>}
      <Breathe style={s.ctaWrap}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={next ? `دەستپێکردنی وانەی پیتی ${next.glyph}` : 'دووبارەکردنەوە'} activeOpacity={0.85} onPress={startLesson} style={[s.cta, { backgroundColor: extras.cta }]}>
          <Text style={[s.ctaText, { color: extras.ctaText }]}>{next ? (stepsDone > 0 ? 'بەردەوام بین' : 'دەست پێ بکەین') : 'دووبارە بکەوە'}</Text>
        </TouchableOpacity>
      </Breathe>
    </LinearGradient>
  </View>;

  const goal = <Glass style={s.goal}>
    <View style={s.goalTop}><Text style={[s.goalTitle, text]}>ئەرکەکانی ئەمڕۆ</Text><Text style={[s.goalCount, muted]}>{missionsDone} لە {missions.length || 3}</Text></View>
    <View style={[s.goalTrack, { backgroundColor: isNight ? 'rgba(255,255,255,0.16)' : c.lavender }]}>
      <LinearGradient colors={isNight ? ['#5eead4', '#7cc4ff'] : [c.leaf, c.mint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.goalFill, { width: `${Math.max(missions.length ? (missionsDone / missions.length) * 100 : 0, 6)}%` }]} />
    </View>
  </Glass>;

  const dueCard = dueCount > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${dueCount} پیت ئامادەیە بۆ دووبارەکردنەوە`} onPress={() => open('daily-practice')}>
    <Glass style={s.due}><Sprout size={26} color={c.mint} /><View style={s.flex}><Text style={[s.dueTitle, text]}>کاتی دووبارەکردنەوەیە</Text><Text style={[s.dueHint, muted]}>{dueCount} پیت چاوەڕێی مەشقن تا لە بیرت نەچن</Text></View></Glass>
  </TouchableOpacity>;

  // Each activity has its own colour so the home screen feels playful, not like a list of white boxes.
  const TILE_COLORS = {
    peach: { day: '#ffe0d2', night: '#4d2f73', icon: '#ff8a65' },
    leaf: { day: '#d3f5e6', night: '#1f4d63', icon: '#2fc08d' },
    lavender: { day: '#e5dcff', night: '#3a2f8a', icon: '#8b6cff' },
    sky: { day: '#d2ecff', night: '#1f3f7d', icon: '#38a5f0' },
  } as const;
  const tiles = (count: number, columns: number) => <View style={s.tiles}>{ACTIVITIES.slice(0, count).map(({ route, title, hint, Icon, tint }) => {
    const tone = TILE_COLORS[tint];
    return <TouchableOpacity key={route} accessibilityRole="button" accessibilityLabel={title} activeOpacity={0.85} onPress={() => open(route)} style={{ width: `${100 / columns - 2}%`, flexGrow: 1 }}>
      <View style={[s.tile, { backgroundColor: isNight ? tone.night : tone.day, borderColor: isNight ? 'rgba(255,255,255,0.16)' : '#ffffff' }]}>
        <View style={[s.tileIcon, { backgroundColor: tone.icon }]}><Icon size={26} color="#ffffff" /></View>
        <Text style={[s.tileTitle, text]}>{title}</Text><Text style={[s.tileHint, muted]}>{hint}</Text>
      </View>
    </TouchableOpacity>;
  })}</View>;

  // Night: the lessons as stars along a road, and a bar with the gold start button.
  const map = <Glass style={[s.mapCard, tablet && s.mapCardTablet]}>
    <Text style={[s.mapTitle, text]}>نەخشەی گەشت</Text>
    <JourneyMap nodes={mapNodes} onOpen={openNode} ink={c.ink} gold={extras.glow} mint="#5eead4" dim={c.paper} edge={c.edge} wing1="#ff8fd0" wing2="#a78bfa" />
  </Glass>;
  const lessonBar = <Glass testID="home-lesson-card" style={s.lessonBar}>
    <View style={[s.letterTile, { backgroundColor: extras.glow }]}><Text style={s.letterTileText}>{next?.glyph || '✓'}</Text></View>
    <View style={s.flex}>
      <Text style={[s.dueHint, muted]}>{next ? `وانەی ${completed + 1}` : 'تەواو بوو'}</Text>
      <Text style={[s.barTitle, text]}>{next ? `پیتی «${next.glyph}»` : 'ئافەرم!'}</Text>
      <View style={s.steps}>{[0, 1, 2, 3, 4].map(i => <View key={i} style={[s.step, { backgroundColor: i < stepsDone ? '#5eead4' : 'rgba(255,255,255,0.2)' }]} />)}</View>
    </View>
    <Breathe><TouchableOpacity accessibilityRole="button" accessibilityLabel={next ? `دەستپێکردنی وانەی پیتی ${next.glyph}` : 'دووبارەکردنەوە'} activeOpacity={0.85} onPress={startLesson} style={[s.goldButton, { backgroundColor: extras.cta }]}>
      <Text style={[s.ctaText, { color: extras.ctaText }]}>{next ? 'دەست پێ بکە' : 'دووبارە'}</Text>
    </TouchableOpacity></Breathe>
  </Glass>;

  const pathStrip = <Glass style={s.pathStrip}>
    <View style={s.goalTop}><Text style={[s.goalTitle, text]}>ڕێڕەوی فێربوون</Text><TouchableOpacity accessibilityRole="button" onPress={() => open('alphabet')}><Text style={[s.link, { color: c.mint }]}>هەموو ←</Text></TouchableOpacity></View>
    <View style={s.nodes}>{mapNodes.map(node => <TouchableOpacity key={node.letter.id} accessibilityRole="button" disabled={node.status === 'locked'} accessibilityLabel={`وانەی ${node.index + 1}، پیتی ${node.letter.glyph}`} onPress={() => openNode(node)}
      style={[s.node, node.status === 'current' && { backgroundColor: c.coral, width: 68, height: 68, borderRadius: 34 }, node.status === 'completed' && { backgroundColor: c.leaf }, node.status === 'locked' && { backgroundColor: c.lavender, opacity: 0.7 }]}>
      <Text style={[s.nodeText, { color: node.status === 'current' ? '#ffffff' : c.ink }]}>{node.status === 'completed' ? '✓' : node.letter.glyph}</Text></TouchableOpacity>)}</View>
  </Glass>;

  return <ScrollView contentContainerStyle={[s.page, { maxWidth: pageMax }]}>
    <RiseIn style={s.stack}>{profileRow}{chips}
      {isNight && <View accessibilityRole="progressbar" accessibilityLabel={`پێشکەوتنی ئاستی ${level}`} style={[s.xpTrack, { backgroundColor: 'rgba(255,255,255,0.18)' }]}><LinearGradient colors={['#5eead4', '#ffd66b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.xpFill, { width: `${Math.max(6, levelProgress * 100)}%` }]} /></View>}
    </RiseIn>
    {isNight
      ? (wide
        ? <View style={s.columns}><RiseIn delay={120} style={[s.stack, s.mapColumn]}>{map}</RiseIn><RiseIn delay={220} style={[s.stack, s.flex]}>{lessonBar}{dueCard}{tiles(3, 3)}</RiseIn></View>
        : <><RiseIn delay={120} style={s.stack}>{map}</RiseIn><RiseIn delay={220} style={s.stack}>{lessonBar}{dueCard}{tiles(tablet ? 4 : 2, tablet ? 4 : 2)}</RiseIn></>)
      : (wide
        ? <View style={s.columns}><RiseIn delay={120} style={[s.stack, s.flex]}>{hero}{goal}</RiseIn><RiseIn delay={220} style={[s.stack, s.flex]}>{pathStrip}{dueCard}{tiles(4, 2)}</RiseIn></View>
        : <><RiseIn delay={120} style={s.stack}>{hero}</RiseIn><RiseIn delay={200} style={s.stack}>{goal}{dueCard}{tiles(tablet ? 4 : 2, tablet ? 4 : 2)}</RiseIn></>)}
  </ScrollView>;
};

const s = StyleSheet.create({
  page: { width: '100%', alignSelf: 'center', padding: 18, paddingBottom: 32, gap: 16 },
  stack: { gap: 16 }, flex: { flex: 1, minWidth: 0 }, columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' }, mapColumn: { flex: 1.5, minWidth: 0 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 26 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, level: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 13 },
  profileCopy: { flex: 1, minWidth: 0, gap: 4 }, hello: { fontFamily: 'IBMPlexSansArabic_500Medium', fontSize: 14 }, name: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22 },
  xpTrack: { height: 8, borderRadius: 5, overflow: 'hidden' }, xpFill: { height: '100%', borderRadius: 5 },
  gear: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 }, chipText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 14 },
  heroShadow: { borderRadius: 32, shadowColor: '#5b3fe0', shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  hero: { borderRadius: 32, padding: 22, gap: 12, overflow: 'hidden' },
  watermark: { position: 'absolute', left: -10, top: -34, fontSize: 200, lineHeight: 230, color: 'rgba(255,255,255,0.14)', fontFamily: 'IBMPlexSansArabic_700Bold' },
  heroPill: { alignSelf: 'flex-start', marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 3 }, heroPillText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: '#ffffff' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, heroMascot: { width: 92, height: 92 },
  spark1: { position: 'absolute', right: 70, top: 12 }, spark2: { position: 'absolute', left: 120, top: 22 },
  heroTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 28, lineHeight: 42, color: '#ffffff' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, ringText: { fontFamily: 'IBMPlexSansArabic_500Medium', fontSize: 14, color: '#ffffff' },
  ctaWrap: { alignSelf: 'center', width: '100%', maxWidth: 300, marginTop: 4 },
  cta: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', shadowColor: '#1e1478', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  ctaText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18 },
  goal: { padding: 16, gap: 10 }, goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, goalTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16 }, goalCount: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 14 },
  goalTrack: { height: 12, borderRadius: 8, overflow: 'hidden' }, goalFill: { height: '100%', borderRadius: 8 },
  due: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }, dueTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16 }, dueHint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 13 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { padding: 14, gap: 6, alignItems: 'flex-start', minHeight: 124, borderRadius: 28, borderWidth: 2 },
  tileIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, tileTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17 }, tileHint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 13 },
  mapCard: { height: 376, padding: 6 }, mapCardTablet: { height: 520 }, mapTitle: { position: 'absolute', right: 18, top: 12, zIndex: 1, fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16 },
  lessonBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  letterTile: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#ffd66b', shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 }, letterTileText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 38, color: '#2a1b00' },
  barTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18 }, steps: { flexDirection: 'row', gap: 5, marginTop: 6 }, step: { flex: 1, height: 7, borderRadius: 4 },
  goldButton: { minHeight: 52, paddingHorizontal: 20, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#ffd66b', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  pathStrip: { padding: 18, gap: 14 }, link: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 14 },
  nodes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, node: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' }, nodeText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 26 },
});
