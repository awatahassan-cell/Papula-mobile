import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { personalPractice } from '../../services/personalPractice';
import { useResponsive } from '../../theme/responsive';
import { useThemeStyles } from '../../theme/useAppearance';
import { StartingAssessment } from '../learning/StartingAssessment';
import React, { useEffect, useState } from 'react';
import { View, ScrollView} from 'react-native';
import { Text } from '../../components/RTLText';
import { DailyMissionsComponent } from '../../components/DailyMissionsComponent';
import { useAppStore } from '../../store/useAppStore';
import { LetterPractice } from '../learning/LetterPractice';
import { VocabularyGame } from '../vocabulary/VocabularyGame';
import { VOCAB_TEXT } from '../vocabulary/vocabText';
import { dueWordCount } from '../../data/vocabulary';
import { learningStyles as baseLearningStyles } from '../learning/learningStyles';

export const DailyPracticeScreen: React.FC = () => {
  const s = useThemeStyles(baseLearningStyles);
  const {currentProfile,setSelectedLetter,setRoute,completeDailyPractice,registerBackHandler,saveCheckpoint}=useAppStore();
  const {tablet}=useResponsive();
  const [tab,setTab]=useState<'personal'|'missions'>('personal');
  const [assessing,setAssessing]=useState(false);
  const [practicing,setPracticing]=useState(false);
  const [reviewingWords,setReviewingWords]=useState(false);

  useEffect(() => {
    if (!assessing && !practicing && !reviewingWords) return;
    return registerBackHandler(() => {
      if (assessing) setAssessing(false);
      else if (practicing) setPracticing(false);
      else setReviewingWords(false);
      return true;
    });
  }, [assessing, practicing, reviewingWords, registerBackHandler]);

  const plan=personalPractice(currentProfile);
  const openTask=(task:typeof plan[number])=>{
    setSelectedLetter(task.letter);
    saveCheckpoint({kind:task.kind,contentId:task.letter.id,step:task.step});
    setRoute(task.kind==='writing'?'writing':'letter-detail');
  };
  const dueWordsNow=dueWordCount(currentProfile);
  if(reviewingWords)return <VocabularyGame start="review" onExit={()=>setReviewingWords(false)} />;
  if(assessing)return <StartingAssessment onExit={()=>setAssessing(false)} />;
  if(practicing)return <LetterPractice mode="review" onComplete={()=>{completeDailyPractice();}} onExit={()=>setPracticing(false)} />;
  return <ScrollView contentContainerStyle={s.container}>
    <View style={s.row}>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:tab==='personal'}} style={[s.secondary,tab==='personal'&&s.correct]} onPress={()=>setTab('personal')}><Text style={s.text}>مەشقی من</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:tab==='missions'}} style={[s.secondary,tab==='missions'&&s.correct]} onPress={()=>setTab('missions')}><Text style={s.text}>ئەرکەکانی ئەمڕۆ</Text></TouchableOpacity>
    </View>
    {tab==='missions'?<DailyMissionsComponent />:<>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>setAssessing(true)}><Text style={s.text}>{currentProfile.placement?'دەستپێکەکەم دووبارە هەڵبسەنگێنمەوە':'با بزانین چی دەزانم'}</Text></TouchableOpacity>
      {currentProfile.placement && <Text style={s.text}>{currentProfile.placement.recommendedLevel===1?'دەستپێک: ناسینەوەی پیت و گوێگرتن':currentProfile.placement.recommendedLevel===2?'دەستپێک: شێوەی پیت و وشەسازی':'دەستپێک: خوێندنەوە و نووسینی سەربەخۆ'}</Text>}
      <Text style={s.title}>با ئەم پیتانە دووبارە بکەینەوە</Text>
      <Text style={s.text}>مەشقەکە بەپێی هەوڵ و پێشکەوتنی تۆیە</Text>
      {!plan.length&&<TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>setRoute('alphabet')}><Text style={s.buttonText}>سەرەتا پیتێک لە ڕێڕەوی فێربوون هەڵبژێرە</Text></TouchableOpacity>}
      <View style={tablet?{flexDirection:'row',gap:14,width:'100%'}:{gap:16,width:'100%'}}>{plan.map(task=>{
        const {letter,reason}=task;
        return <TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`وانەی پیتی ${letter.glyph}`} style={[s.card,tablet&&{flex:1}]} onPress={()=>openTask(task)}>
          <Text style={[s.glyph,{fontSize:54}]}>{letter.glyph}</Text><Text style={s.text}>{reason}</Text><Text style={s.text}>٢ خولەک</Text>
        </TouchableOpacity>;
      })}</View>
      {!!plan.length&&<><TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>openTask(plan[0])}><Text style={s.buttonText}>دەست بە مەشقی ئەمڕۆ بکەم</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>setPracticing(true)}><Text style={s.text}>یاریی پێداچوونەوە</Text></TouchableOpacity></>}
      {dueWordsNow>0&&<TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>setReviewingWords(true)}><Text style={s.text}>{VOCAB_TEXT.review} · {VOCAB_TEXT.reviewHint(dueWordsNow)}</Text></TouchableOpacity>}
    </>}
  </ScrollView>;
};
