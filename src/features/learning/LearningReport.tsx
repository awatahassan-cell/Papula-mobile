import React from 'react';
import {View,StyleSheet} from 'react-native';
import {Text} from '../../components/RTLText';
import {Layers,Shapes,Link2,AudioLines,WholeWord,PencilLine,BookOpen,TrendingUp,Clock,MessageCircle,EyeOff} from 'lucide-react-native';
import {useResponsive} from '../../theme/responsive';
import {useThemeStyles} from '../../theme/useAppearance';
import {ChildProfile,LearningSkill} from '../../services/types';
import {hardLetters,weeklySummary} from '../../services/learningEngine';
import {skillSummary,writingMastered} from '../../services/foundationalLearning';
import { personalPractice } from '../../services/personalPractice';
import { ParentLearningAdvice } from '../../components/ParentLearningAdvice';
import { mockLetters } from '../../data/mockLetters';
import { completedLetterIds } from '../../services/lessonPath';
import { letterRecognitionConfirmed } from '../../services/letterChecks';

const WEEKDAY_SHORT=['ی','د','س','چ','پ','ھ','ش'];// getDay(): Sunday first
const skillIcons={recognition:Shapes,forms:Link2,phonics:AudioLines,syllables:Layers,word:WholeWord,writing:PencilLine,reading:BookOpen};
const skillLabels:Record<LearningSkill,string>={recognition:'ناسینەوەی پیت',forms:'شێوەی پیت لە وشەدا',phonics:'دەنگی سەرەتای وشە',syllables:'بڕگەکانی وشە',word:'دروستکردنی وشە',writing:'نووسینی پیت',reading:'خوێندنەوە و تێگەیشتن'};
export const LearningReport:React.FC<{profile:ChildProfile}>=({profile})=>{
 const s=useThemeStyles(baseStyles);
 const {tablet}=useResponsive();
 const next=personalPractice(profile).map(task=>task.letter);
 const hard=hardLetters(profile);
 const independent=Object.values(profile.writingProgress||{}).filter(writingMastered).length;
 const confirmed=mockLetters.filter(letter=>letterRecognitionConfirmed(profile,letter.id));
 const minutes=Math.round((profile.practiceSeconds||0)/60);
 const week=weeklySummary(profile);
 const peak=Math.max(1,...week.days.map(day=>day.minutes));
 return <View testID="learning-report" style={s.report}>
  <ParentLearningAdvice profile={profile} />
  <View style={s.reportHeading}><View style={s.headingIcon}><TrendingUp size={22} color={s.accent.color}/></View><View style={s.copy}><Text style={s.title}>هەنگاوەکانی {profile.name}</Text><Text style={s.subtitle}>هەر هەوڵێک، هەنگاوێکە بەرەو فێربوون</Text></View></View>
  <View testID="weekly-report" style={s.weekCard}>
  <View style={s.weekHeading}><Text style={s.sectionTitle}>ئەم هەفتەیە</Text><Text style={s.subtitle}>{week.activeDays} لە ٧ ڕۆژ مەشقی کرد</Text></View>
  <View accessibilityRole="image" accessibilityLabel={`خولەکی مەشق لە حەوت ڕۆژی ڕابردوو: ${week.days.map(day=>day.minutes).join('، ')}`} style={s.weekBars}>
   {week.days.map((day,index)=><View key={day.key} style={s.weekColumn}>
    <View style={s.weekTrack}><View style={[s.weekFill,{height:`${Math.max(day.minutes?10:0,Math.round(day.minutes/peak*100))}%`},index===6&&s.weekToday]}/></View>
    <Text style={[s.weekDay,index===6&&s.weekDayToday]}>{WEEKDAY_SHORT[day.weekday]}</Text>
   </View>)}
  </View>
  <View style={s.weekTotals}>
   <View style={s.weekTotal}><Text style={s.weekNumber}>{week.minutes}</Text><Text style={s.weekLabel}>خولەک</Text></View>
   <View style={s.weekTotal}><Text style={s.weekNumber}>{week.lessons}</Text><Text style={s.weekLabel}>وانەی تەواوکراو</Text></View>
   <View style={s.weekTotal}><Text style={s.weekNumber}>{week.stars}</Text><Text style={s.weekLabel}>ئەستێرە</Text></View>
  </View>
 </View>
 <View style={s.reviewCard}>
  <Text style={s.sectionTitle}>وانە و ناسینەوەی سەربەخۆ</Text>
  <Text style={s.subtitle}>{`${completedLetterIds(profile).length} وانە تەواو کراوە؛ ${confirmed.length} پیت بە گوێگرتن لە دوو ڕۆژی جیاواز بێ نموونە ناسراوەتەوە.`}</Text>
  <Text style={s.subtitle}>تەواوکردنی گەشتی بە یارمەتی بە مانای فێربوونی سەربەخۆ نییە. ئەم پێوانەیە تەنها ناسینەوەی پیتە؛ نووسین و خوێندنەوە جیاوازن.</Text>
 </View>
 <View style={s.summaryRow}>
   <View style={s.summaryTile}><View style={s.summaryTop}><PencilLine size={20} color={s.accent.color}/><Text style={s.summaryNumber}>{independent}</Text></View><Text style={s.summaryLabel}>پیتی سەربەخۆ</Text><Text style={s.summaryHint}>نووسین بێ یارمەتی لە دوو ڕۆژی جیاواز</Text></View>
   <View style={[s.summaryTile,s.timeTile]}><View style={s.summaryTop}><Clock size={20} color={s.secondary.color}/><Text style={s.summaryNumber}>{minutes}</Text></View><Text style={s.summaryLabel}>خولەکی مەشقی نووسین</Text><Text style={s.summaryHint}>کۆی کاتە تۆمارکراوەکان</Text></View>
  </View>
  <View style={s.skillsHeading}><Text style={s.sectionTitle}>تواناکانی فێربوون</Text><Text style={s.subtitle}>تۆماری مەشقەکان</Text></View>
  <View style={[s.skills,tablet&&{flexDirection:'row',flexWrap:'wrap'}]}>
   {skillSummary(profile).map(item=>{
    const Icon=skillIcons[item.skill],record=item.record;
    const attempts=record?.attempts||0,correct=record?.correct||0;
    const accuracy=attempts?Math.max(0,Math.min(100,Math.round(correct/attempts*100))):0;
    return <View key={item.skill} style={[s.skillTile,tablet&&{width:'48.8%'}]}>
     <View style={s.skillHeader}><View style={s.skillIcon}><Icon size={21} color={s.accent.color} strokeWidth={1.8}/></View><View style={s.copy}><Text style={s.skillTitle}>{skillLabels[item.skill]}</Text><Text style={s.skillCaption}>{attempts?`${correct} وەڵامی دروست لە ${attempts} هەوڵ`:'هێشتا مەشق تۆمار نەکراوە'}</Text></View>{attempts>0&&<Text style={s.percent}>{accuracy}٪</Text>}</View>
     <View style={s.track} accessibilityRole="progressbar" accessibilityLabel={`ڕێژەی وەڵامی دروست بۆ ${skillLabels[item.skill]}`} accessibilityValue={{min:0,max:100,now:accuracy}}><View style={[s.fill,{width:`${accuracy}%`}]}/></View>
     {attempts>0&&<View style={s.detailRow}><View style={s.detailItem}><View style={s.independentDot}/><Text style={s.detailLabel}>سەرکەوتن بێ یارمەتی</Text><Text style={s.detailValue}>{record?.independentCorrect||0}</Text></View><View style={s.detailItem}><View style={s.helpedDot}/><Text style={s.detailLabel}>هەوڵ بە یارمەتی</Text><Text style={s.detailValue}>{record?.helped||0}</Text></View></View>}
    </View>;
   })}
  </View>
  {hard.length>0&&<View style={s.reviewCard}><Text style={s.sectionTitle}>پیتە قورسەکان</Text><Text style={s.subtitle}>ئەم پیتانە هەڵەی زۆرتریان تێدا کراوە؛ بە هێواشی و بە یاری دووبارەیان بکەنەوە</Text>
   {hard.map(item=><View key={item.letter.id} style={s.reviewLetters}><View style={s.reviewLetter}><Text style={s.reviewGlyph}>{item.letter.glyph}</Text></View><View style={s.copy}><Text style={s.skillTitle}>{item.accuracy}٪ دروست ({item.attempts} هەوڵ)</Text>{item.confusedWith.length>0&&<Text style={s.skillCaption}>لەگەڵ {item.confusedWith.map(letter=>letter.glyph).join('، ')} تێکەڵ دەبێت</Text>}</View></View>)}
  </View>}
  <View style={s.reviewCard}><Text style={s.sectionTitle}>ئەمڕۆ چی دووبارە بکەینەوە؟</Text><Text style={s.subtitle}>چەند خولەکێکی خۆش لەگەڵ منداڵەکەت</Text><View style={s.reviewLetters}>{next.map(letter=><View key={letter.id} style={s.reviewLetter}><Text style={s.reviewGlyph}>{letter.glyph}</Text></View>)}</View>
   {[{Icon:MessageCircle,text:`وشەیەک بڵێن کە بە «${next[0]?.glyph||''}» دەست پێ بکات.`},{Icon:PencilLine,text:'پیتەکە لەسەر کاغەز بنووسن.'},{Icon:EyeOff,text:'نموونەکە بشارنەوە و با خۆی هەوڵ بدات.'}].map(({Icon,text})=><View key={text} style={s.tipRow}><View style={s.tipIcon}><Icon size={17} color={s.accent.color}/></View><Text style={s.tipText}>{text}</Text></View>)}
  </View>
  <Text style={s.footerNote}>هەوڵ و پێشکەوتنەکەی ستایش بکەن. ئەم ڕاپۆرتە تۆماری مەشقە، هەڵسەنگاندنی مامۆستا نییە.</Text>
 </View>;
};
const baseStyles=StyleSheet.create({
 weekCard:{padding:16,borderRadius:24,backgroundColor:'#ffffff',gap:12,borderWidth:1.5,borderColor:'#dce9e1'},weekHeading:{gap:2},weekBars:{flexDirection:'row',gap:8,height:110,alignItems:'flex-end'},weekColumn:{flex:1,height:'100%',alignItems:'center',gap:6},weekTrack:{flex:1,width:'100%',maxWidth:34,borderRadius:12,backgroundColor:'#eaf0ed',justifyContent:'flex-end',overflow:'hidden'},weekFill:{width:'100%',borderRadius:12,backgroundColor:'#22845c'},weekToday:{backgroundColor:'#f18555'},weekDay:{fontFamily:'IBMPlexSansArabic_600SemiBold',fontSize:13,color:'#657d79'},weekDayToday:{color:'#243b3a',fontFamily:'IBMPlexSansArabic_700Bold'},weekTotals:{flexDirection:'row',gap:10},weekTotal:{flex:1,alignItems:'center',paddingVertical:8,borderRadius:16,backgroundColor:'#eeebff'},weekNumber:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:22,color:'#243b3a'},weekLabel:{fontFamily:'IBMPlexSansArabic_400Regular',fontSize:12,color:'#657d79'},
 report:{width:'100%',gap:16},accent:{color:'#176445'},secondary:{color:'#8d6636'},reportHeading:{flexDirection:'row',alignItems:'center',gap:10},headingIcon:{width:44,height:44,borderRadius:16,backgroundColor:'#e3f5ec',alignItems:'center',justifyContent:'center'},copy:{flex:1,minWidth:0,gap:4},title:{fontSize:21,lineHeight:32,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a'},subtitle:{fontSize:12,lineHeight:22,color:'#657d79'},summaryRow:{flexDirection:'row',gap:10},summaryTile:{flex:1,minWidth:0,backgroundColor:'#e3f5ec',borderRadius:20,padding:12,gap:6},timeTile:{backgroundColor:'#fff0df'},summaryTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6},summaryNumber:{fontSize:30,lineHeight:42,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a'},summaryLabel:{fontSize:13,lineHeight:23,fontFamily:'IBMPlexSansArabic_600SemiBold',color:'#243b3a'},summaryHint:{fontSize:10,lineHeight:19,color:'#657d79'},skillsHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},sectionTitle:{fontSize:17,lineHeight:28,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a',flexShrink:1},skills:{gap:10},skillTile:{borderWidth:1,borderColor:'#dce9e1',backgroundColor:'#ffffff',borderRadius:20,padding:12,gap:12},skillHeader:{flexDirection:'row',alignItems:'center',gap:9},skillIcon:{width:36,height:38,borderRadius:12,backgroundColor:'#f4f9f6',alignItems:'center',justifyContent:'center'},skillTitle:{fontSize:14,lineHeight:24,fontFamily:'IBMPlexSansArabic_600SemiBold',color:'#243b3a'},skillCaption:{fontSize:11,lineHeight:20,color:'#657d79'},percent:{fontSize:16,fontFamily:'IBMPlexSansArabic_700Bold',color:'#176445'},track:{height:6,borderRadius:3,backgroundColor:'#eaf0ed',overflow:'hidden',width:'100%'},fill:{height:'100%',borderRadius:3,backgroundColor:'#23875f'},detailRow:{flexDirection:'row',flexWrap:'wrap',gap:7},detailItem:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#f4f9f6',borderRadius:9,paddingHorizontal:7,paddingVertical:5},independentDot:{width:6,height:6,borderRadius:3,backgroundColor:'#23875f'},helpedDot:{width:6,height:6,borderRadius:3,backgroundColor:'#f18555'},detailLabel:{fontSize:10,lineHeight:18,color:'#657d79'},detailValue:{fontSize:12,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a'},reviewCard:{backgroundColor:'#e3f5ec',borderRadius:24,padding:14,gap:10},reviewLetters:{flexDirection:'row',gap:8,paddingVertical:3},reviewLetter:{width:48,height:52,backgroundColor:'#ffffff',borderRadius:16,alignItems:'center',justifyContent:'center'},reviewGlyph:{fontSize:30,lineHeight:44,fontFamily:'IBMPlexSansArabic_700Bold',color:'#176445'},tipRow:{flexDirection:'row',alignItems:'flex-start',gap:8},tipIcon:{width:26,height:26,borderRadius:9,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},tipText:{flex:1,fontSize:12,lineHeight:23,color:'#243b3a'},footerNote:{fontSize:11,lineHeight:22,color:'#657d79'},
});
