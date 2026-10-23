import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { BRAND, GOLD } from '../../theme/tokens';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArrowLeft, BookOpen, Flame, PencilLine, Puzzle, Settings, Sprout, Star } from 'lucide-react-native';
import { tileSet } from '../../theme/candy';
import { HelpPill } from '../../components/HelpButton';
import { Text } from '../../components/RTLText';
import { RiseIn } from '../../components/Motion';
import { AdventureMap } from '../../components/AdventureMap';
import { useAppStore, AppRoute } from '../../store/useAppStore';
import { dueReviewLetters } from '../../services/learningEngine';
import { lessonChecklist, lessonPath, nextLessonLetter } from '../../services/lessonPath';
import { useResponsive } from '../../theme/responsive';
import { useAppearance } from '../../theme/useAppearance';
import { soundService } from '../../services/soundService';
import { PetArt } from '../../components/PetArt';
import { GARDEN_BUTTERFLIES, earnedButterflies, nectarOf, petFed, petMood, petStage, unseenButterflies } from '../../data/garden';
import { GARDEN_TEXT } from '../garden/gardenText';

const ACTIVITIES: { route: AppRoute; title: string; hint: string; Icon: typeof BookOpen; tile: number }[] = [
  { route: 'stories', title: 'کاتی چیرۆکە', hint: 'ببینە و ببیستە', Icon: BookOpen, tile: 0 },
  { route: 'match-game', title: 'با یاری بکەین', hint: 'پیت و وشە و بڕگە', Icon: Puzzle, tile: 1 },
  { route: 'writing', title: 'نووسین', hint: 'پیتەکان بنووسە', Icon: PencilLine, tile: 2 },
  { route: 'daily-practice', title: 'مەشق', hint: 'بیریان بکەرەوە', Icon: Sprout, tile: 3 },
];

export const HomeScreen: React.FC = () => {
  const { colors: c, isNight } = useAppearance();
  const { wide, pageMax, tablet } = useResponsive();
  const { currentProfile, setRoute, setSelectedLetter, openParentGateWithCallback } = useAppStore();
  const path = lessonPath(currentProfile), next = nextLessonLetter(currentProfile);
  const completed = path.filter(node => node.status === 'completed').length;
  const checklist = next ? lessonChecklist(currentProfile, next.id) : [];
  const stepsDone = checklist.filter(item => item.done).length;
  // A child who has been away for a few days is greeted by a sad butterfly that missed them.
  const [openedAt] = React.useState(() => Date.now());
  const daysAway = currentProfile.lastActiveDate ? Math.floor((openedAt - new Date(currentProfile.lastActiveDate).getTime()) / 86400000) : 0;
  const dueCount = dueReviewLetters(currentProfile).length;
  const missions = currentProfile.dailyMissions || [];
  const missionsDone = missions.filter(mission => mission.completed).length;
  const petNow = petStage(petFed(currentProfile)), newButterflies = unseenButterflies(currentProfile).length;
  const activeIndex = path.findIndex(node => node.status === 'current');
  const start = activeIndex < 0 ? Math.max(0, path.length - 3) : Math.max(0, Math.min(activeIndex - 1, path.length - 3));
  const open = (route: AppRoute) => { void soundService.stopSpeaking(); setRoute(route); };
  const openNode = (node: typeof path[number]) => { void soundService.stopSpeaking(); setSelectedLetter(node.letter); setRoute('letter-detail'); };
  const startLesson = () => { void soundService.stopSpeaking(); if (next) { setSelectedLetter(next); setRoute('letter-detail'); } else setRoute('alphabet'); };
  const tiles = tileSet(isNight);
  const ink = { color: c.ink }, muted = { color: c.muted };

  const lesson = <View testID="home-lesson-card" style={[s.lesson, { backgroundColor: c.paper, borderColor: c.edge }]}>
    <View style={s.lessonRow}>
      <View style={[s.letterTile, { backgroundColor: tiles[2].face, borderBottomColor: tiles[2].lip }]}><Text style={[s.letter, { color: tiles[2].ink }]}>{next?.glyph || '✓'}</Text></View>
      <View style={s.flex}><Text style={[s.caption, muted]}>{next ? `وانەی ${activeIndex + 1} · هەنگاوی داهاتوو` : 'گەشتێکی جوانت کرد!'}</Text>
        <Text style={[s.lessonTitle, ink]}>{next ? `با پیتی «${next.glyph}» فێر بین` : 'هەموو پیتەکانت فێر بوو!'}</Text>
      </View>
    </View>
    {next && <View style={s.progressRow}>
      <View accessibilityRole="progressbar" accessibilityLabel="پێشکەوتنی وانە" accessibilityValue={{ min: 0, max: checklist.length, now: stepsDone }} style={s.steps}>
        {checklist.map(item => <View key={item.label} style={[s.step, { backgroundColor: item.done ? '#21b977' : c.edge }]} />)}
      </View><Text style={[s.caption, muted]}>{stepsDone} لە {checklist.length}</Text>
    </View>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={next ? `دەستپێکردنی وانەی پیتی ${next.glyph}` : 'دووبارەکردنەوەی پیتەکان'} activeOpacity={0.85} onPress={startLesson} style={s.cta}>
      <Text style={s.ctaText}>{next ? (stepsDone > 0 ? 'بەردەوام بین!' : 'با دەست پێ بکەین!') : 'با دووبارە بکەینەوە'}</Text><ArrowLeft color={GOLD.ink} size={23} strokeWidth={3} />
    </TouchableOpacity>
  </View>;
  const activities = <View style={s.tiles}>{ACTIVITIES.slice(0, tablet ? 4 : 2).map(({ route, title, hint, Icon, tile }) => { const t = tiles[tile]; return (
    <TouchableOpacity key={route} accessibilityRole="button" accessibilityLabel={title} activeOpacity={0.85} onPress={() => open(route)} style={[s.tile, { backgroundColor: t.face, borderBottomColor: t.lip }]}>
      <View style={[s.tileIcon, { backgroundColor: t.chip }]}><Icon size={29} color={t.icon} strokeWidth={2.3} /></View><View style={s.flex}><Text style={[s.tileTitle, { color: t.ink }]}>{title}</Text><Text style={[s.tileHint, { color: t.ink }]}>{hint}</Text></View>
    </TouchableOpacity>); })}</View>;

  return <ScrollView contentContainerStyle={[s.page, { maxWidth: pageMax }]}>
    <View style={s.header}>
      <View style={s.brand}><Text style={[s.brandText, { color: isNight ? '#d3baff' : BRAND.main }]}>پەپوولە</Text></View>
      <HelpPill />
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${currentProfile.stars} ئەستێرە، ستیکەرەکانم`} onPress={() => open('stickers')} style={s.stars}><Star size={20} color={GOLD.starInk} fill={GOLD.star} /><Text style={s.starCount}>{currentProfile.stars}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="ڕێکخستنەکانی دایک و باوک" onPress={() => openParentGateWithCallback(() => setRoute('parent-dashboard'))} style={[s.settings, { backgroundColor: c.paper }]}><Settings size={21} color={c.muted} /></TouchableOpacity>
    </View>
    <View style={s.greetingRow}><View style={s.flex}><Text testID="home-greeting" style={[s.greeting, ink]}>سڵاو {currentProfile.name}!</Text><Text style={[s.subtitle, muted]}>ئامادەیت بۆ گەشتێکی نوێ؟</Text></View><View style={[s.unit, { backgroundColor: c.paper }]}><Sprout size={19} color={c.mint} /><Text style={[s.unitText, { color: c.mint }]}>بەشی {Math.min(6, Math.floor(completed / 6) + 1)}</Text></View></View>
    <View style={[s.content, wide && s.columns]}>
      <View style={[s.stack, s.flex]}><RiseIn delay={80}><AdventureMap nodes={path.slice(start, start + 3)} isNight={isNight} mood={daysAway >= 3 ? 'sad' : undefined} onOpen={openNode} onAll={() => open('alphabet')} /></RiseIn>
        <View style={s.summary}><View style={s.summaryItem}><Flame size={17} color={isNight ? '#ffb84d' : '#bd4919'} /><Text style={[s.caption, muted]}>{currentProfile.streakDays} ڕۆژ بەردەوام</Text></View><Text style={[s.caption, muted]}>{completed} لە {path.length} پیت</Text></View>
      </View>
      <View style={[s.stack, s.flex]}><RiseIn delay={220}>{lesson}</RiseIn><Text style={[s.sectionTitle, ink]}>با زیاتر فێر بین</Text><RiseIn delay={360}>{activities}</RiseIn></View>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={GARDEN_TEXT.homeCard} onPress={() => open('garden')} style={[s.garden, { backgroundColor: tiles[1].face, borderBottomColor: tiles[1].lip }]}>
      <PetArt stage={petNow} mood={petMood(currentProfile)} size={92} />
      <View style={s.flex}>
        <Text style={[s.goalTitle, { color: tiles[1].ink }]}>{GARDEN_TEXT.homeCard}</Text>
        <Text style={[s.caption, { color: tiles[1].ink }]}>{petNow.name} · {GARDEN_TEXT.count(earnedButterflies(currentProfile).length, GARDEN_BUTTERFLIES.length)} 🦋 · 🍯 {nectarOf(currentProfile)}</Text>
      </View>
      {newButterflies > 0 && <View style={s.gardenBadge}><Text style={s.gardenBadgeText}>{GARDEN_TEXT.homeNew(newButterflies)}</Text></View>}
    </TouchableOpacity>
    <View style={[s.goal, { backgroundColor: c.paper, borderColor: c.edge }]}>
      <View style={s.summary}><Text style={[s.goalTitle, ink]}>ئەرکەکانی ئەمڕۆ</Text><Text style={[s.caption, muted]}>{missionsDone} لە {missions.length}</Text></View>
      <View accessibilityRole="progressbar" accessibilityLabel="ئەرکەکانی ئەمڕۆ" accessibilityValue={{ min: 0, max: Math.max(1, missions.length), now: missionsDone }} style={[s.track, { backgroundColor: c.edge }]}><View style={[s.fill, { width: `${missions.length ? missionsDone / missions.length * 100 : 0}%` }]} /></View>
    </View>
    {dueCount > 0 && <TouchableOpacity accessibilityRole="button" onPress={() => open('daily-practice')} style={[s.review, { backgroundColor: c.leaf }]}><Sprout size={24} color={c.mint} /><View style={s.flex}><Text style={[s.goalTitle, ink]}>کاتی دووبارەکردنەوەیە</Text><Text style={[s.caption, muted]}>{dueCount} پیت چاوەڕێی مەشقن</Text></View><ArrowLeft size={20} color={c.mint} /></TouchableOpacity>}
  </ScrollView>;
};
const s = StyleSheet.create({
  page: { width: '100%', alignSelf: 'center', padding: 17, paddingTop: 20, paddingBottom: 28, gap: 14 },
  flex: { flex: 1, minWidth: 0 }, stack: { gap: 12 }, content: { gap: 16 }, columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 3 }, brandText: { fontSize: 25, fontFamily: 'IBMPlexSansArabic_700Bold' },
  stars: { minHeight: 44, paddingHorizontal: 12, backgroundColor: GOLD.soft, borderWidth: 2, borderColor: GOLD.border, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }, starCount: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#80500b' }, settings: { width: 44, height: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, greeting: { fontSize: 23, fontFamily: 'IBMPlexSansArabic_700Bold' }, subtitle: { fontSize: 13, fontFamily: 'IBMPlexSansArabic_400Regular' }, unit: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, gap: 5, borderRadius: 16 }, unitText: { fontSize: 12, fontFamily: 'IBMPlexSansArabic_700Bold' },
  lesson: { padding: 16, borderRadius: 28, borderWidth: 1, gap: 12 }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, letterTile: { width: 60, height: 64, borderRadius: 24, backgroundColor: '#ff795d', borderBottomWidth: 4, borderBottomColor: '#df503c', alignItems: 'center', justifyContent: 'center' }, letter: { color: '#57261c', fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 35, textAlign: 'center' }, caption: { fontSize: 12, fontFamily: 'IBMPlexSansArabic_500Medium' }, lessonTitle: { fontSize: 20, fontFamily: 'IBMPlexSansArabic_700Bold', lineHeight: 33 },
  cta: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: GOLD.face, borderBottomWidth: 5, borderBottomColor: GOLD.lip, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, ctaText: { color: GOLD.ink, fontSize: 18, fontFamily: 'IBMPlexSansArabic_700Bold', flexShrink: 1, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, steps: { flex: 1, flexDirection: 'row', gap: 5 }, step: { flex: 1, height: 7, borderRadius: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { flexGrow: 1, width: '46%', borderRadius: 24, padding: 14, minHeight: 88, borderBottomWidth: 5, gap: 10, flexDirection: 'row', alignItems: 'center' }, tileIcon: { backgroundColor: '#ffffff25', width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 3 }, tileTitle: { color: '#fff', fontSize: 16, fontFamily: 'IBMPlexSansArabic_700Bold' }, tileHint: { color: '#fff', fontSize: 11, fontFamily: 'IBMPlexSansArabic_400Regular' },
  garden: { borderRadius: 24, borderBottomWidth: 5, padding: 10, paddingEnd: 14, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 100 },
  gardenBadge: { backgroundColor: '#ff4d6d', borderRadius: 14, paddingHorizontal: 10, minHeight: 28, justifyContent: 'center' }, gardenBadgeText: { color: '#fff', fontSize: 13, fontFamily: 'IBMPlexSansArabic_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'IBMPlexSansArabic_600SemiBold', marginTop: 2 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, goal: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 10 }, goalTitle: { fontSize: 15, fontFamily: 'IBMPlexSansArabic_700Bold' }, track: { height: 10, borderRadius: 6, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: '#21b977', borderRadius: 6 }, review: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, borderRadius: 24 },
});
