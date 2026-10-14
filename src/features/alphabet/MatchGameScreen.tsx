import { StartingSoundGame } from '../learning/StartingSoundGame';
import React, { useState } from 'react';
import { Text, ScrollView, TouchableOpacity } from 'react-native';
import { WordBuilder } from '../learning/WordBuilder';
import { LetterPractice } from '../learning/LetterPractice';
import { learningStyles as s } from '../learning/learningStyles';
export const MatchGameScreen: React.FC = () => {
  const [mode,setMode]=useState<'menu'|'word'|'sound'|'similar'|'phonics'>('menu');
  if(mode==='phonics')return <StartingSoundGame onExit={()=>setMode('menu')} />;
  if(mode==='word')return <WordBuilder onExit={()=>setMode('menu')} />;
  if(mode==='sound'||mode==='similar')return <LetterPractice mode={mode} onExit={()=>setMode('menu')} />;
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>با یاری بکەین! 🎮</Text>
    {([{mode:'word',title:'وشە دروست بکەم 🧩',hint:'پیتەکان پێکەوە ببەستە'},
      {mode:'similar',title:'پیتە هاوشێوەکان 👀',hint:'شێوە و خاڵەکان جیا بکەرەوە'},
      {mode:'phonics',title:'دەنگی سەرەتای وشە 👂',hint:'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە'},
      {mode:'sound',title:'یاریی دەنگ 🔊',hint:'گوێ بگرە و پیتەکە بدۆزەوە'}] as const).map(item=><TouchableOpacity key={item.mode} accessibilityRole="button" style={s.card} onPress={()=>setMode(item.mode)}>
      <Text style={s.title}>{item.title}</Text><Text style={s.text}>{item.hint}</Text>
    </TouchableOpacity>)}
  </ScrollView>;
};
