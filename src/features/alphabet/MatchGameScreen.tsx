import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { Ear, Eye, Layers, Puzzle, Volume2 } from 'lucide-react-native';
import { CANDY } from '../../theme/candy';
import { StartingSoundGame } from '../learning/StartingSoundGame';
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/RTLText';
import { SyllableBuilder } from '../learning/SyllableBuilder';
import { WordBuilder } from '../learning/WordBuilder';
import { LetterPractice } from '../learning/LetterPractice';
import { useResponsive } from '../../theme/responsive';
import { learningStyles as baseLearningStyles } from '../learning/learningStyles';
export const MatchGameScreen: React.FC = () => {
  const s = useThemeStyles(baseLearningStyles);
  const { isGarden } = useAppearance();
  const { tablet, pageMax } = useResponsive();
  const [mode,setMode]=useState<'menu'|'word'|'sound'|'similar'|'phonics'|'syllables'>('menu');
  if(mode==='phonics')return <StartingSoundGame onExit={()=>setMode('menu')} />;
  if(mode==='syllables')return <SyllableBuilder onExit={()=>setMode('menu')} />;
  if(mode==='word')return <WordBuilder onExit={()=>setMode('menu')} />;
  if(mode==='sound'||mode==='similar')return <LetterPractice mode={mode} onExit={()=>setMode('menu')} />;
  return <ScrollView contentContainerStyle={[s.container, tablet && { maxWidth: pageMax }]}>
    {!isGarden && <Text style={s.title}>با یاری بکەین! 🎮</Text>}
    <View style={tablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : { gap: 14 }}>{([{mode:'word',title:'وشە دروست بکەم 🧩',hint:'پیتەکان پێکەوە ببەستە',Icon:Puzzle},
      {mode:'similar',title:'پیتە هاوشێوەکان 👀',hint:'شێوە و خاڵەکان جیا بکەرەوە',Icon:Eye},
      {mode:'syllables',title:'بڕگەکان 🧱',hint:'وشەکە بە بڕگە پێکەوە ببەستە',Icon:Layers},
      {mode:'phonics',title:'دەنگی سەرەتای وشە 👂',hint:'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە',Icon:Ear},
      {mode:'sound',title:'یاریی دەنگ 🔊',hint:'گوێ بگرە و پیتەکە بدۆزەوە',Icon:Volume2}] as const).map((item,index)=>{const candy=CANDY[index%CANDY.length];return <TouchableOpacity key={item.mode} accessibilityRole="button" accessibilityLabel={item.title} style={[candyCard.tile, tablet && { width: '48%' }, { backgroundColor: candy.color, borderBottomColor: candy.lip }]} onPress={()=>setMode(item.mode)}>
      <View style={candyCard.icon}><item.Icon size={30} color="#ffffff" strokeWidth={2.3} /></View>
      <View style={candyCard.body}><Text style={candyCard.title}>{item.title}</Text><Text style={candyCard.hint}>{item.hint}</Text></View>
    </TouchableOpacity>;})}</View>
  </ScrollView>;
};

// Candy tiles shared with the home screen: saturated colour, white text, a darker lip that sinks when pressed.
const candyCard = StyleSheet.create({
  tile: { minHeight: 92, borderRadius: 23, borderBottomWidth: 5, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18, color: '#ffffff', textAlign: 'right' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 13, color: '#ffffff', textAlign: 'right', marginTop: 2 },
});
