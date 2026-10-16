import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { ArrowLeft, BookOpen, Puzzle, Sprout, Check, Star, Sparkles, Shapes } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { LearningPath } from '../../components/LearningPath';
import { FloatingMascot } from '../../components/FloatingMascot';
import { useAppStore, AppRoute } from '../../store/useAppStore';
import { dueReviewLetters } from '../../services/learningEngine';
import { lessonChecklist, lessonPath, nextLessonLetter } from '../../services/lessonPath';
import { learningLayout } from '../../theme/layout';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { gardenColors as c } from '../../theme/appearance';
import { soundService } from '../../services/soundService';

export const HomeScreen: React.FC = () => {
  const s=useThemeStyles(baseStyles);
  const {colors:c}=useAppearance();
  const { currentProfile, setRoute, setSelectedLetter } = useAppStore();
  const { width } = useWindowDimensions();
  const layout = learningLayout(width), next = nextLessonLetter(currentProfile);
  const completed = lessonPath(currentProfile).filter(node => node.status === 'completed').length;
  const checklist = next ? lessonChecklist(currentProfile, next.id) : [];
  const stepsDone=checklist.filter(item=>item.done).length;
  const unit=Math.floor(completed/6);
  const lessonColor=[c.peach,c.sky,c.lavender][unit%3];
  const greeting=next ? stepsDone>0 ? `وانەی پیتی «${next.glyph}» چاوەڕێتە؛ با بەردەوام بین!` : completed>0 ? `${completed} وانەت تەواو کردووە؛ با هەنگاوێکی تر بنێین.` : 'ئامادەیت یەکەم پیتت فێر بیت؟' : 'گەشتەکەت تەواو کرد! با یاری و دووبارەکردنەوە بکەین.';
  const dueCount = dueReviewLetters(currentProfile).length;
  const open = (route: AppRoute) => { void soundService.stopSpeaking(); setRoute(route); };
  return <ScrollView contentContainerStyle={[s.container, { padding: layout.padding }]}>
    <View testID="home-greeting" style={s.greetingRow}><View style={s.greetingCopy}><View style={s.heroEyebrow}><Sparkles size={15} color={c.coralDark}/><Text style={s.eyebrow}>دنیای فێربوونی تۆ</Text></View><Text style={[s.greeting, layout.compact && { fontSize: 24 }]}>سڵاو، {currentProfile.name}!</Text><Text style={s.subtitle}>{greeting}</Text></View><FloatingMascot size={layout.mascotSize}/></View>
    <View style={s.progressCard}><View style={s.progressLabels}><View style={s.progressHeading}><View style={[s.progressIcon,{backgroundColor:c.lavender}]}><Star size={17} color={c.mint}/></View><Text style={s.progressTitle}>گەشتەکەی تۆ</Text></View><Text style={s.progressCount}>{completed} وانە لە ٣٤</Text></View><View accessibilityRole="progressbar" accessibilityLabel="وانە تەواوکراوەکان" accessibilityValue={{min:0,max:34,now:completed}} style={s.track}><View testID="home-progress-fill" style={[s.fill,{width:`${completed/34*100}%`,backgroundColor:c.mint}]}/></View><Text style={s.small}>{completed?'هەر وانەیەک، هەنگاوێکی نوێیە.':'با یەکەم هەنگاو پێکەوە بنێین.'}</Text></View>
    <View testID="home-lesson-card" style={[s.lessonCard,{backgroundColor:lessonColor,borderColor:c.edge}]}>
      <View style={s.lessonHeading}><View style={s.todayBadge}><Shapes size={17} color={c.coralDark} /><Text style={s.badgeText}>{next ? 'هەنگاوی داهاتووت' : 'ئافەرم، ڕێڕەوەکەت تەواو کرد!'}</Text></View><Star size={21} color="#d19a2c" /></View>
      <View style={s.lessonBody}><View style={[s.letterTile,{backgroundColor:c.paper}]}><Text style={s.largeGlyph}>{next?.glyph || '✓'}</Text></View><View style={s.lessonCopy}><Text style={s.lessonTitle}>{next ? `با پیتی «${next.glyph}» فێر بین` : 'کاتی دووبارەکردنەوەیە'}</Text><Text style={s.subtitle}>گوێ بگرە · بناسە · یاری بکە · بنووسە</Text></View></View>
      {next&&<View style={s.stepTrack}>{checklist.map((item,index)=><View key={item.label} style={[s.stepTrackPart,{backgroundColor:item.done?c.mint:c.paper,opacity:item.done?1:.75}]}/>)}</View>}
      {next && <View style={s.checklist}>{checklist.map((item, index) => <View key={item.label} style={[s.checkItem,{backgroundColor:c.paper}]}><View style={[s.checkDot, item.done && { backgroundColor: c.mint }]}>{item.done ? <Check color="#fff" size={12} /> : <Text style={s.checkIndex}>{index + 1}</Text>}</View><Text style={s.checkLabel}>{item.label}</Text></View>)}</View>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={next ? `دەستپێکردنی وانەی پیتی ${next.glyph}` : 'دووبارەکردنەوە'} style={s.startButton} onPress={()=>{if(next){setSelectedLetter(next);open('letter-detail');}else open('daily-practice');}}><Text style={s.startText}>{next ? (currentProfile.lessonProgress?.[next.id] ? 'بەردەوام بم' : 'با دەست پێ بکەین') : 'مەشق بکەم'}</Text><ArrowLeft size={22} color="#fff" /></TouchableOpacity>
    </View>
    <View style={s.sectionHeading}><Text style={s.sectionTitle}>ڕێڕەوی فێربوون</Text><TouchableOpacity accessibilityRole="button" onPress={()=>open('alphabet')} style={s.allButton}><Text style={s.allLabel}>هەموو وانەکان ←</Text></TouchableOpacity></View>
    <LearningPath preview />
    {dueCount > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${dueCount} پیت ئامادەیە بۆ دووبارەکردنەوە`} style={[s.activity, { backgroundColor: c.peach, minHeight: 0, flexDirection: 'row', alignItems: 'center' }]} onPress={() => open('daily-practice')}>
      <Sprout size={29} color={c.ink} /><View style={{ flex: 1 }}><Text style={s.activityTitle}>کاتی دووبارەکردنەوەیە 🌱</Text><Text style={s.small}>{dueCount} پیت چاوەڕێی مەشقن تا لە بیرت نەچن</Text></View>
    </TouchableOpacity>}
    <Text style={s.sectionTitle}>با زیاتر فێر بین</Text>
    <View style={s.activities}>{[
      { route: 'daily-practice' as const, title: 'مەشقی من', subtitle: 'پیتەکانت بیر بکەرەوە', Icon: Sprout, color: c.peach },
      { route: 'stories' as const, title: 'کاتی چیرۆک', subtitle: 'ببینە، ببیستە و بخوێنەوە', Icon: BookOpen, color: c.sky },
      { route: 'match-game' as const, title: 'فێربوون بە یاری', subtitle: 'وشە و دەنگ پێکەوە ببەستە', Icon: Puzzle, color: c.lavender },
    ].map(({route,title,subtitle,Icon,color})=><TouchableOpacity key={route} accessibilityRole="button" style={[s.activity, { width: layout.columns === 3 ? '31%' : '48%', backgroundColor: color }]} onPress={()=>open(route)}><Icon size={29} color={c.ink} /><Text style={s.activityTitle}>{title}</Text><Text style={s.small}>{subtitle}</Text></TouchableOpacity>)}</View>
  </ScrollView>;
};
const baseStyles = StyleSheet.create({
  container: { width: '100%', maxWidth: 840, alignSelf: 'center', gap: 18, paddingBottom: 28 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor:c.paper,padding:16,borderRadius:28,borderWidth:1,borderColor:c.edge }, greetingCopy: { flex: 1, minWidth: 0 },
  heroEyebrow:{flexDirection:'row',alignItems:'center',gap:5,marginBottom:5},
  eyebrow: { fontFamily: 'IBMPlexSansArabic_500Medium', fontSize: 13, color: c.mint }, greeting: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 29, color: c.ink },
  subtitle: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 14, lineHeight: 25, color: c.muted },
  progressCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 9, borderWidth: 1, borderColor: c.edge },
  progressHeading:{flexDirection:'row',alignItems:'center',gap:7},progressIcon:{width:32,height:32,borderRadius:11,alignItems:'center',justifyContent:'center'},
  progressLabels: { flexDirection: 'row',flexWrap:'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, progressTitle: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 15, color: c.ink }, progressCount: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 13, color: c.mint },
  track: { height: 10, backgroundColor: c.edge, borderRadius: 8, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: c.mint, borderRadius: 8 },
  small: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, lineHeight: 22, color: c.muted },
  lessonCard: { backgroundColor: '#fff', borderRadius: 28, borderWidth: 2, borderColor: '#d7e9dc', borderBottomWidth: 5, padding: 18, gap: 16 },
  lessonHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, todayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, badgeText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: c.mint },
  lessonBody: { flexDirection: 'row', alignItems: 'center', gap: 14 }, lessonCopy: { flex: 1, minWidth: 0 }, letterTile: { width: 72, aspectRatio: 1, borderRadius: 23, backgroundColor: '#fff0d2', alignItems: 'center', justifyContent: 'center' },
  largeGlyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 43, color: c.ink, textAlign: 'center' }, lessonTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, color: c.ink },
  stepTrack:{flexDirection:'row',gap:5},stepTrackPart:{flex:1,height:5,borderRadius:3},
  checklist: { gap: 8, flexDirection: 'row', flexWrap: 'wrap' }, checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%', flexGrow: 1, padding:8,borderRadius:12 }, checkDot: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: c.lavender }, checkIndex: { fontSize: 11, color: c.muted }, checkLabel: { flex: 1, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, color: c.muted },
  startButton: { minHeight: 58, borderRadius: 19, backgroundColor: c.mint, borderBottomWidth: 4, borderColor: c.mintDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 14 }, startText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19, color: '#fff' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }, sectionTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, color: c.ink }, allButton: { minHeight: 44, justifyContent: 'center' }, allLabel: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: c.mint },
  activities: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, activity: { borderRadius: 22, padding: 16, gap: 8, minHeight: 150, flexGrow: 1 }, activityTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, color: c.ink },
});
