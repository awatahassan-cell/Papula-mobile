import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView} from 'react-native';
import { Text } from '../../components/RTLText';
import { mockLetters } from '../../data/mockLetters';
import { soundService } from '../../services/soundService';
import { LEARNING_WORDS, LearningWord, shuffled, wordPlan, normalizedWord } from '../../services/learningEngine';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

export const WordBuilder: React.FC<{ onExit:()=>void; initialWords?:LearningWord[]; onComplete?:()=>void }> = ({onExit,initialWords,onComplete}) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile,recordPracticeResult,finishLearningGame }=useAppStore();
  const [queue,setQueue]=useState(()=>initialWords?.length?initialWords:wordPlan(currentProfile));
  const [round,setRound]=useState(0);
  const [selected,setSelected]=useState<number[]>([]);
  const [feedback,setFeedback]=useState('');
  const [correct,setCorrect]=useState(false);
  const [finished,setFinished]=useState(false);
  const [showWords,setShowWords]=useState(false);
  const locked=useRef(false);
  const helped=useRef(false);
  const word=queue[round] || queue[0];
  const bank=useMemo(()=>word?shuffled(word.units.map((glyph,id)=>({glyph,id}))):[],[word]);
  useEffect(()=>()=>{void soundService.stopSpeaking();},[]);
  const reset=()=>{locked.current=false;setSelected([]);setFeedback('');setCorrect(false);};
  const assembled=selected.map(id=>bank.find(tile=>tile.id===id)!.glyph).join('');
  const choose=(id:number)=>{
    if(locked.current)return;
    setSelected(previous=>previous.includes(id)?previous:[...previous,id]);
    const tile=bank.find(item=>item.id===id)!;
    const letter=mockLetters.find(item=>item.glyph===tile.glyph || (tile.glyph==='ه' && item.glyph==='ھ'));
    void soundService.speakWord(tile.glyph,{letterName:letter?.name});
  };
  const check=()=>{
    if(!word || locked.current || selected.length!==word.units.length)return;
    locked.current=true;
    const passed=normalizedWord(assembled)===normalizedWord(word.word);
    setCorrect(passed);
    const ids=passed?word.letterIds:word.letterIds.filter((_,index)=>word.units[index]!==Array.from(selected.map(id=>bank.find(tile=>tile.id===id)!.glyph))[index]);
    recordPracticeResult(ids,passed,passed?word.id:undefined,'word',helped.current);
    const mismatches=word.units.map((unit,index)=>unit!==selected.map(id=>bank.find(tile=>tile.id===id)!.glyph)[index]?index+1:0).filter(Boolean);
    setFeedback(passed?`ئافەرم! وشەی «${word.word}»ت دروست کرد 🌟`:`نزیک بوویت! شوێنی ${mismatches.join('، ')} بپشکنە؛ پیتەکانی بە ڕیزێکی تر دابنێ 💛`);
    if(passed){soundService.playCorrect();void soundService.speakWord(word.word);}
    else {helped.current=true;soundService.playEncouragingTryAgain();}
  };
  const advancedRound = useRef(-1);
  const advance=()=>{
    if (!correct || advancedRound.current === round) return;
    advancedRound.current = round;
    void soundService.stopSpeaking();
    if(round+1===queue.length){finishLearningGame('word');setFinished(true);}
    else {helped.current=false;setRound(round+1);reset();}
  };
  if(!word)return <View style={s.container}><Text style={s.text}>وشەکان ئامادە نین</Text><TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={onExit}><Text style={s.text}>گەڕانەوە</Text></TouchableOpacity></View>;
  if(finished)return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.emoji}>🧩 🌟</Text><Text style={s.title}>ئافەرم! وشەکانت دروست کرد</Text>
    <Text style={s.text}>{queue.map(item=>item.word).join('، ')}</Text>
    <TouchableOpacity accessibilityRole="button" style={s.button} onPress={onComplete||onExit}><Text style={s.buttonText}>{onComplete?'چیرۆکەکەم ببینم 📖':'گەڕانەوە بۆ یارییەکان'}</Text></TouchableOpacity>
  </ScrollView>;
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>وشە دروست بکەم 🧩</Text><Text style={s.text}>{round+1} / {queue.length}</Text>
    <View style={s.card}>
      <Text style={s.emoji}>{word.imageEmoji}</Text>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>void soundService.speakWord(word.word)}><Text style={s.text}>وشەکە ببیستە 🔊</Text></TouchableOpacity>
      <Text accessibilityLiveRegion="polite" style={[s.glyph,{fontSize:Math.max(26,48-word.units.length*2),minHeight:68,writingDirection:'rtl'}]}>{assembled||'…'}</Text>
      <Text style={s.text}>پیتەکان بە ڕیز هەڵبژێرە</Text>
      <View style={s.row}>{bank.map(tile=><TouchableOpacity key={tile.id} accessibilityRole="button" accessibilityLabel={`پیتی ${tile.glyph}، دانەی ${tile.id+1}`}
        disabled={selected.includes(tile.id)||!!feedback} style={[s.tile,(selected.includes(tile.id)||!!feedback)&&s.disabled]} onPress={()=>choose(tile.id)}><Text style={s.glyph}>{tile.glyph}</Text></TouchableOpacity>)}</View>
      {!!feedback && <Text accessibilityLiveRegion="polite" style={s.text}>{feedback}</Text>}
    </View>
    {correct?<TouchableOpacity accessibilityRole="button" style={s.button} onPress={advance}><Text style={s.buttonText}>{round+1===queue.length?'تەواو بکەم ✓':'وشەی دواتر ←'}</Text></TouchableOpacity>
      :<TouchableOpacity accessibilityRole="button" disabled={selected.length!==word.units.length||!!feedback} style={[s.button,(selected.length!==word.units.length||!!feedback)&&s.disabled]} onPress={check}><Text style={s.buttonText}>پشکنینی وشەکەم ✓</Text></TouchableOpacity>}
    {!correct && <View style={s.row}>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{locked.current=false;setFeedback('');setSelected(previous=>previous.slice(0,-1));}}><Text style={s.text}>پیتی پێشوو ↶</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={reset}><Text style={s.text}>دووبارە دایبنێم</Text></TouchableOpacity>
    </View>}
    {!initialWords && <>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:showWords}} style={s.secondary} onPress={()=>setShowWords(!showWords)}><Text style={s.text}>وشەیەک هەڵبژێرە {showWords?'⌃':'⌄'}</Text></TouchableOpacity>
      {showWords && <View style={s.row}>{LEARNING_WORDS.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`وشەی ${item.word}`} style={s.tile} onPress={()=>{helped.current=true;advancedRound.current=-1;setQueue([item]);setRound(0);setShowWords(false);reset();}}><Text style={{fontSize:28}}>{item.imageEmoji}</Text><Text style={s.text}>{item.word}</Text></TouchableOpacity>)}</View>}
    </>}
    <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={onExit}><Text style={s.text}>گەڕانەوە</Text></TouchableOpacity>
  </ScrollView>;
};
