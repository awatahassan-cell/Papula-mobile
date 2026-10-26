import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { personalPractice } from '../../services/personalPractice';
import { useThemeStyles } from '../../theme/useAppearance';
import { StartingAssessment } from '../learning/StartingAssessment';
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Compass, Gamepad2, ListChecks, Play, Shapes, Sprout } from 'lucide-react-native';
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
  return <ScrollView contentContainerStyle={[s.container,{alignItems:'center',gap:14}]}>
    <View style={s.row}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="مەشقی من" accessibilityState={{selected:tab==='personal'}} style={[local.tab,tab==='personal'&&s.correct]} onPress={()=>setTab('personal')}><Sprout size={30} color="#047857" strokeWidth={2.3}/></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="ئەرکەکانی ئەمڕۆ" accessibilityState={{selected:tab==='missions'}} style={[local.tab,tab==='missions'&&s.correct]} onPress={()=>setTab('missions')}><ListChecks size={30} color="#4338ca" strokeWidth={2.3}/></TouchableOpacity>
    </View>
    {tab==='missions'?<DailyMissionsComponent />:<>
      {plan.length>0?<TouchableOpacity accessibilityRole="button" accessibilityLabel="دەست بە مەشقی ئەمڕۆ بکەم" style={local.play} onPress={()=>openTask(plan[0])}>
        <View style={local.playIcon}><Play size={44} color="#ffffff" fill="#ffffff"/></View><Text style={local.playText}>{plan[0].letter.glyph}</Text>
      </TouchableOpacity>
      :<TouchableOpacity accessibilityRole="button" accessibilityLabel="سەرەتا پیتێک لە ڕێڕەوی فێربوون هەڵبژێرە" style={local.play} onPress={()=>setRoute('alphabet')}><View style={local.playIcon}><Play size={44} color="#ffffff" fill="#ffffff"/></View></TouchableOpacity>}
      {plan.length>1&&<View style={local.tiles}>{plan.slice(1).map(task=><TouchableOpacity key={task.letter.id} accessibilityRole="button" accessibilityLabel={`وانەی پیتی ${task.letter.glyph}`} style={local.tile} onPress={()=>openTask(task)}><Text style={[s.glyph,{fontSize:46}]}>{task.letter.glyph}</Text></TouchableOpacity>)}</View>}
      <View style={local.tiles}>
        {plan.length>0&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="یاریی پێداچوونەوە" style={[local.tile,local.game]} onPress={()=>setPracticing(true)}><Gamepad2 size={40} color="#4338ca" strokeWidth={2.2}/></TouchableOpacity>}
        {dueWordsNow>0&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={`${VOCAB_TEXT.review}. ${VOCAB_TEXT.reviewHint(dueWordsNow)}`} style={[local.tile,local.game]} onPress={()=>setReviewingWords(true)}><Shapes size={40} color="#4338ca" strokeWidth={2.2}/></TouchableOpacity>}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={currentProfile.placement?'دەستپێکەکەم دووبارە هەڵبسەنگێنمەوە':'با بزانین چی دەزانم'} style={local.small} onPress={()=>setAssessing(true)}><Compass size={22} color="#64748b"/></TouchableOpacity>
    </>}
  </ScrollView>;
};

const local=StyleSheet.create({
  tab:{width:84,height:60,borderRadius:20,borderWidth:2,borderColor:'#cbd5e1',backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},
  play:{width:'100%',maxWidth:420,minHeight:150,borderRadius:32,borderBottomWidth:7,backgroundColor:'#ffd24a',borderBottomColor:'#d9a400',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:20},
  playIcon:{width:84,height:84,borderRadius:42,backgroundColor:'#6d4ae0',alignItems:'center',justifyContent:'center'},
  playText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:72,lineHeight:96,color:'#1e293b'},
  tiles:{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'center',width:'100%'},
  tile:{width:96,height:96,borderRadius:26,borderWidth:2,borderBottomWidth:5,borderColor:'#d8ccff',backgroundColor:'#f1ebff',alignItems:'center',justifyContent:'center'},
  game:{backgroundColor:'#dbeafe',borderColor:'#93c5fd'},
  small:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',opacity:0.7},
});
