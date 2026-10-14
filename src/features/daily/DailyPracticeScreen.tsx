import { StartingAssessment } from '../learning/StartingAssessment';
import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { DailyMissionsComponent } from '../../components/DailyMissionsComponent';
import { reviewPlan } from '../../services/learningEngine';
import { useAppStore } from '../../store/useAppStore';
import { LetterPractice } from '../learning/LetterPractice';
import { learningStyles as s } from '../learning/learningStyles';

export const DailyPracticeScreen: React.FC = () => {
  const {currentProfile,setSelectedLetter,setRoute,completeDailyPractice}=useAppStore();
  const [tab,setTab]=useState<'personal'|'missions'>('personal');
  const [assessing,setAssessing]=useState(false);
  const [practicing,setPracticing]=useState(false);
  const plan=reviewPlan(currentProfile,3);
  if(assessing)return <StartingAssessment onExit={()=>setAssessing(false)} />;
  if(practicing)return <LetterPractice mode="review" onComplete={()=>{completeDailyPractice();}} onExit={()=>setPracticing(false)} />;
  return <ScrollView contentContainerStyle={s.container}>
    <View style={s.row}>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:tab==='personal'}} style={[s.secondary,tab==='personal'&&s.correct]} onPress={()=>setTab('personal')}><Text style={s.text}>مەشقی من 🌱</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:tab==='missions'}} style={[s.secondary,tab==='missions'&&s.correct]} onPress={()=>setTab('missions')}><Text style={s.text}>ئەرکەکانی ئەمڕۆ 🎯</Text></TouchableOpacity>
    </View>
    {tab==='missions'?<DailyMissionsComponent />:<>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>setAssessing(true)}><Text style={s.text}>{currentProfile.placement?'دەستپێکەکەم دووبارە هەڵبسەنگێنمەوە':'با بزانین چی دەزانم 🌱'}</Text></TouchableOpacity>
      {currentProfile.placement && <Text style={s.text}>{currentProfile.placement.recommendedLevel===1?'دەستپێک: ناسینەوەی پیت و گوێگرتن':currentProfile.placement.recommendedLevel===2?'دەستپێک: شێوەی پیت و وشەسازی':'دەستپێک: خوێندنەوە و نووسینی سەربەخۆ'}</Text>}
      <Text style={s.title}>با ئەم پیتانە دووبارە بکەینەوە</Text>
      <Text style={s.text}>مەشقەکە بەپێی هەوڵ و پێشکەوتنی تۆیە</Text>
      {plan.map(letter=>{
        const review=currentProfile.letterReviews?.[letter.id];
        const reason=review?.level===0?'با زیاتر مەشقی بکەین':review?'کاتی دووبارەکردنەوەیە':currentProfile.masteredLetterIds.includes(letter.id)?'پیتی فێربووت بیر بکەرەوە':'با ئەم پیتە فێر بین';
        return <TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`وانەی پیتی ${letter.glyph}`} style={s.card} onPress={()=>{setSelectedLetter(letter);setRoute('letter-detail');}}>
          <Text style={[s.glyph,{fontSize:54}]}>{letter.glyph}</Text><Text style={s.text}>{reason}</Text>
        </TouchableOpacity>;
      })}
      <TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>setPracticing(true)}><Text style={s.buttonText}>دەست بە مەشق بکەم 🔊</Text></TouchableOpacity>
    </>}
  </ScrollView>;
};
