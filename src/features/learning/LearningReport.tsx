import React from 'react';
import { View, Text } from 'react-native';
import { ChildProfile } from '../../services/types';
import { reviewPlan } from '../../services/learningEngine';
import { skillSummary, writingMastered } from '../../services/foundationalLearning';
import { learningStyles as s } from './learningStyles';

export const LearningReport:React.FC<{profile:ChildProfile}>=({profile})=>{
  const next=reviewPlan(profile,3);
  const independent=Object.values(profile.writingProgress||{}).filter(writingMastered).length;
  return <View style={s.card}>
    <Text style={s.title}>پێشکەوتنی ڕاستەقینەی {profile.name} 🌱</Text>
    <Text style={s.text}>نووسینی سەربەخۆ لە دوو ڕۆژی جیاواز: {independent} پیت</Text>
    {skillSummary(profile).map(item=><View key={item.skill} style={{width:'100%',gap:4}}>
      <Text style={[s.text,{textAlign:'right'}]}>{item.label}: {item.record?`${item.record.correct} وەڵامی دروست لە ${item.record.attempts} هەوڵ`:'هێشتا مەشق تۆمار نەکراوە'}</Text>
      {item.record && <Text style={[s.text,{fontSize:14,textAlign:'right'}]}>بێ داواکردنی یارمەتی: {item.record.independentCorrect||0} سەرکەوتن؛ بە یارمەتی: {item.record.helped} هەوڵ</Text>}
    </View>)}
    <Text style={s.text}>کاتی مەشقی نووسینی تۆمارکراو: {Math.round((profile.practiceSeconds||0)/60)} خولەک</Text>
    <Text style={s.title}>ئەمڕۆ چی دووبارە بکەینەوە؟</Text><Text style={s.glyph}>{next.map(letter=>letter.glyph).join('، ')}</Text>
    <Text style={s.text}>لەگەڵ منداڵەکە وشەیەک بڵێن کە بە «{next[0]?.glyph}» دەست پێ دەکات. پیتەکە لەسەر کاغەز بنووسن؛ پاشان نموونەکە بشارنەوە و با خۆی هەوڵ بدات.</Text>
    <Text style={s.text}>هەوڵ و پێشکەوتنەکەی ستایش بکەن. ئەم ڕاپۆرتە تۆماری مەشقە، هەڵسەنگاندنی مامۆستا نییە.</Text>
  </View>;
};
