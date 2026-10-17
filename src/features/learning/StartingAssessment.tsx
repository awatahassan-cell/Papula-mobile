import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../components/RTLText';
import { mockLetters } from '../../data/mockLetters';
import { LEARNING_WORDS, shuffled } from '../../services/learningEngine';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

export const StartingAssessment:React.FC<{onExit:()=>void}>=({onExit})=>{
  const s = useThemeStyles(baseLearningStyles);
  const {savePlacement,recordPracticeResult,recordSkillResult}=useAppStore();
  const [questions]=useState(()=>[
    ...[0,7,10,17].map(index=>{const target=mockLetters[index];return {id:target.id,prompt:`پیتی ${target.name}`,glyph:target.glyph,letterId:target.id,emoji:'',options:shuffled([target,...shuffled(mockLetters.filter(l=>l.id!==target.id)).slice(0,2)]).map(l=>({id:l.id,text:l.glyph}))};}),
    ...['نان','دار'].map(text=>{const target=LEARNING_WORDS.find(w=>w.word===text)!;return {id:target.id,prompt:target.word,glyph:'',letterId:'',emoji:target.imageEmoji,options:shuffled([target,...shuffled(LEARNING_WORDS.filter(w=>w.id!==target.id&&w.units.length<=3)).slice(0,2)]).map(w=>({id:w.id,text:w.word}))};}),
  ]);
  const [index,setIndex]=useState(0),[answered,setAnswered]=useState(false),[heard,setHeard]=useState(false),[finished,setFinished]=useState(false);
  const answers=useRef<{correct:boolean;letterId:string}[]>([]),locked=useRef(false),advanced=useRef(-1),token=useRef(0);
  useEffect(()=>()=>{token.current++;void soundService.stopSpeaking();},[]);
  const question=questions[index];
  const choose=(id:string)=>{if(locked.current)return;locked.current=true;setAnswered(true);const correct=id===question.id;answers.current.push({correct,letterId:question.letterId});if(question.letterId)recordPracticeResult([question.letterId],correct);else recordSkillResult('word',correct);};
  if(finished)return <View style={s.container}><Text style={s.emoji}></Text><Text style={s.title}>دەستپێکی گونجاومان بۆت دۆزییەوە</Text><Text style={s.text}>ئەم یارییە بۆ هەڵبژاردنی مەشق بوو؛ هەموو پیتەکان هەر بەردەستن.</Text><TouchableOpacity accessibilityRole="button" style={s.button} onPress={onExit}><Text style={s.buttonText}>مەشقی من ببینم</Text></TouchableOpacity></View>;
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>با بزانین چی دەزانیت</Text><Text style={s.text}>ئەمە تاقیکردنەوەی نمرە نییە؛ «هێشتا نازانم»یش وەڵامێکی باشە.</Text><Text style={s.text}>{index+1} / {questions.length}</Text>
    <View style={s.card}><Text style={s.emoji}>{question.emoji}</Text><Text style={s.text}>گوێ بگرە و هەڵبژێرە</Text>
      <TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>{const active=++token.current;void soundService.speakWord(question.prompt,{onEnd:()=>{if(token.current===active)setHeard(true);}});}}><Text style={s.buttonText}>پرسیارەکە ببیستە</Text></TouchableOpacity>
      <View style={s.row}>{question.options.map(option=><TouchableOpacity key={option.id} accessibilityRole="button" disabled={answered||!heard} style={[s.tile,!heard&&s.disabled]} onPress={()=>choose(option.id)}><Text style={s.glyph}>{option.text}</Text></TouchableOpacity>)}</View>
      {!answered && <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>choose('skip')}><Text style={s.text}>هێشتا نازانم</Text></TouchableOpacity>}
      {answered && <Text style={s.text}>سوپاس! با یاریی دواتر ببینین</Text>}
    </View>
    {answered && <TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>{if(advanced.current===index)return;advanced.current=index;token.current++;void soundService.stopSpeaking();if(index+1===questions.length){savePlacement(answers.current.filter(a=>a.correct).length,questions.length,answers.current.filter(a=>!a.correct&&a.letterId).map(a=>a.letterId));setFinished(true);}else{setIndex(index+1);setAnswered(false);setHeard(false);locked.current=false;}}}><Text style={s.buttonText}>دواتر ←</Text></TouchableOpacity>}
    <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={onExit}><Text style={s.text}>جارێکی تر دەیکەم</Text></TouchableOpacity>
  </ScrollView>;
};
