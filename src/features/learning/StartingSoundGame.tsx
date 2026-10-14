import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { mockLetters } from '../../data/mockLetters';
import { soundService } from '../../services/soundService';
import { shuffled, normalizedWord } from '../../services/learningEngine';
import { startingSoundWords } from '../../services/foundationalLearning';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as s } from './learningStyles';

export const StartingSoundGame:React.FC<{onExit:()=>void}>=({onExit})=>{
  const {currentProfile,recordPracticeResult,finishLearningGame}=useAppStore();
  const [rounds]=useState(()=>startingSoundWords(currentProfile).map(word=>{
    const target=mockLetters.find(letter=>normalizedWord(letter.glyph)===normalizedWord(word.units[0]))!;
    return {word,target,options:shuffled([target,...shuffled(mockLetters.filter(letter=>letter.id!==target.id)).slice(0,2)])};
  }));
  const [index,setIndex]=useState(0),[answer,setAnswer]=useState<string|null>(null),[heard,setHeard]=useState(false),[help,setHelp]=useState(false),[finished,setFinished]=useState(false);
  const locked=useRef(false),advanced=useRef(-1),token=useRef(0);
  const round=rounds[index];const correct=answer===round?.target.id;
  useEffect(()=>()=>{token.current++;void soundService.stopSpeaking();},[]);
  if(finished)return <View style={s.container}><Text style={s.emoji}>👂 🌟</Text><Text style={s.title}>دەنگی سەرەتای وشەکانت دۆزییەوە</Text><TouchableOpacity accessibilityRole="button" style={s.button} onPress={onExit}><Text style={s.buttonText}>گەڕانەوە</Text></TouchableOpacity></View>;
  if(!round)return null;
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>وشەکە بە چ دەنگێک دەست پێ دەکات؟ 👂</Text><Text style={s.text}>{index+1} / {rounds.length}</Text>
    <View style={s.card}><Text style={s.emoji}>{round.word.imageEmoji}</Text>
      <TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>{const active=++token.current;void soundService.speakWord(round.word.word,{onEnd:()=>{if(active===token.current)setHeard(true);}});}}><Text style={s.buttonText}>وشەکە ببیستە 🔊</Text></TouchableOpacity>
      {help && <Text style={s.glyph}>{round.word.word}</Text>}
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setHelp(true);setHeard(true);}}><Text style={s.text}>وشەکە ببینم؛ یارمەتی دەوێت</Text></TouchableOpacity>
      <View style={s.row}>{round.options.map(letter=><TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`دەنگی سەرەتای پیتی ${letter.glyph}`} disabled={!heard||answer!==null} style={[s.tile,!heard&&s.disabled,answer===letter.id&&(correct?s.correct:s.retry)]} onPress={()=>{if(locked.current)return;locked.current=true;setAnswer(letter.id);recordPracticeResult([round.target.id],letter.id===round.target.id,undefined,'phonics',help);}}><Text style={s.glyph}>{letter.glyph}</Text></TouchableOpacity>)}</View>
      {answer && <Text style={s.text}>{correct?'ئافەرم! دەنگی سەرەتاکەت دۆزییەوە':'وشەکە جارێکی تر ببیستە؛ تەنها سەرەتاکەی گوێ بگرە.'}</Text>}
    </View>
    {correct?<TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>{if(advanced.current===index)return;advanced.current=index;token.current++;void soundService.stopSpeaking();if(index+1===rounds.length){finishLearningGame('sound');setFinished(true);}else{setIndex(index+1);setAnswer(null);setHeard(false);setHelp(false);locked.current=false;}}}><Text style={s.buttonText}>دواتر ←</Text></TouchableOpacity>:answer?<TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setAnswer(null);setHelp(true);locked.current=false;}}><Text style={s.text}>دووبارە هەوڵ بدەم</Text></TouchableOpacity>:null}
    <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={onExit}><Text style={s.text}>گەڕانەوە</Text></TouchableOpacity>
  </ScrollView>;
};
