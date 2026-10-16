import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { GardenActivityArt } from '../../components/GardenArtwork';
import { StartingSoundGame } from '../learning/StartingSoundGame';
import React, { useState } from 'react';
import { View, ScrollView} from 'react-native';
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
    <View style={tablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : { gap: 16 }}>{([{mode:'word',title:'وشە دروست بکەم 🧩',hint:'پیتەکان پێکەوە ببەستە'},
      {mode:'similar',title:'پیتە هاوشێوەکان 👀',hint:'شێوە و خاڵەکان جیا بکەرەوە'},
      {mode:'syllables',title:'بڕگەکان 🧱',hint:'وشەکە بە بڕگە پێکەوە ببەستە'},
      {mode:'phonics',title:'دەنگی سەرەتای وشە 👂',hint:'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە'},
      {mode:'sound',title:'یاریی دەنگ 🔊',hint:'گوێ بگرە و پیتەکە بدۆزەوە'}] as const).map(item=><TouchableOpacity key={item.mode} accessibilityRole="button" style={[s.card, tablet && { width: '48%' }, isGarden && { flexDirection: 'row', alignItems: 'center' }]} onPress={()=>setMode(item.mode)}>
      {isGarden && <GardenActivityArt activity={item.mode === 'word' || item.mode === 'syllables' || item.mode === 'similar' ? 'alphabet' : 'games'} size={86} />}
      <View style={isGarden && { flex: 1 }}><Text style={[s.title, isGarden && { fontSize: 20, textAlign: 'right' }]}>{item.title}</Text><Text style={[s.text, isGarden && { textAlign: 'right', fontSize: 14 }]}>{item.hint}</Text></View>
    </TouchableOpacity>)}</View>
  </ScrollView>;
};
