import { BackButton } from '../../components/BackButton';
import { HelpHint } from '../../components/HelpButton';
import { exerciseHelp } from '../../services/exerciseHelp';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import { useGameScroll } from './useGameScroll';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView} from 'react-native';
import { Text } from '../../components/RTLText';
import { mockLetters } from '../../data/mockLetters';
import { soundService } from '../../services/soundService';
import { LEARNING_WORDS, LearningWord, shuffled, wordPlan, normalizedWord } from '../../services/learningEngine';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

const KURDISH_VOWELS = ['ا', 'ە', 'و', 'وو', 'ۆ', 'ی', 'ێ'];

export const WordBuilder: React.FC<{ onExit:()=>void; initialWords?:LearningWord[]; onComplete?:()=>void }> = ({onExit,initialWords,onComplete}) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile,recordPracticeResult,finishLearningGame }=useAppStore();
  const [queue,setQueue]=useState(()=>initialWords?.length?initialWords:wordPlan(currentProfile));
  const [round,setRound]=useState(0);
  const [selected,setSelected]=useState<number[]>([]);
  const [feedback,setFeedback]=useState('');
  const [correct,setCorrect]=useState(false);
  const scroll=useGameScroll(round,correct||feedback!=='');
  const [finished,setFinished]=useState(false);
  const [showWords,setShowWords]=useState(false);
  const locked=useRef(false);
  const helped=useRef(false);
  const word=queue[round] || queue[0];
  const bank=useMemo(()=>word?shuffled(word.units.map((glyph,id)=>({glyph,id}))):[],[word]);
  useEffect(()=>{
    if(!word||finished)return;
    void soundService.speakWord(word.word);
  },[round,word,finished]);
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
    recordPracticeResult(ids,passed,word.id,'word',helped.current);
    const mismatches=word.units.map((unit,index)=>unit!==selected.map(id=>bank.find(tile=>tile.id===id)!.glyph)[index]?index+1:0).filter(Boolean);
    setFeedback(passed?`ئافەرم! وشەی «${word.word}»ت دروست کرد`:`نزیک بوویت! شوێنی ${mismatches.join('، ')} بپشکنە؛ پیتەکانی بە ڕیزێکی تر دابنێ`);
    if(passed){soundService.playCorrect();void soundService.speakWord(word.word);}
    else {helped.current=true;soundService.playEncouragingTryAgain();}
  };
  useEffect(()=>{
    if(word && selected.length===word.units.length && !feedback && !correct && !locked.current){
      check();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selected.length,word,feedback,correct]);
  const advancedRound = useRef(-1);
  const advance=()=>{
    if (!correct || advancedRound.current === round) return;
    advancedRound.current = round;
    void soundService.stopSpeaking();
    if(round+1===queue.length){finishLearningGame('word');setFinished(true);}
    else {helped.current=false;setRound(round+1);reset();}
  };
  if(!word)return <View style={s.container}><Text style={s.text}>وشەکان ئامادە نین</Text><BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton></View>;
  if(finished)return <ScrollView contentContainerStyle={s.container}>
    <View style={[s.card,{backgroundColor:'#ecfdf5',borderColor:'#34d399',borderBottomColor:'#059669',paddingVertical:24}]}>
      <Text style={s.emoji}>🦋 🌟</Text><Text style={s.title}>ئافەرم! وشەکانت دروست کرد</Text>
      <Text style={[s.glyph,{fontSize:28}]}>{queue.map(item=>item.word).join(' ، ')}</Text>
    </View>
    {onComplete ? <TouchableOpacity accessibilityRole="button" style={s.button} onPress={onComplete}><Text style={s.buttonText}>چیرۆکەکەم ببینم</Text></TouchableOpacity> : <BackButton fullWidth onPress={onExit}>گەڕانەوە بۆ یارییەکان</BackButton>}
  </ScrollView>;
  return <ScrollView ref={scroll} contentContainerStyle={s.container}><HelpHint text={exerciseHelp.word} />
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#ffffff',borderRadius:24,borderWidth:3,borderBottomWidth:6,borderColor:'#fbbf24',borderBottomColor:'#d97706',paddingHorizontal:14,paddingVertical:10}}>
      <Text style={[s.title,{flex:1,textAlign:'right',fontSize:19}]}>وشە دروست بکەم</Text>
      <View style={{backgroundColor:'#fef3c7',borderRadius:16,borderWidth:2,borderColor:'#fbbf24',paddingHorizontal:10,paddingVertical:4}}><Text style={[s.text,{color:'#78350f',fontFamily:'IBMPlexSansArabic_700Bold'}]}>{round+1} / {queue.length}</Text></View>
    </View>
    <View style={s.card}>
      <View style={{backgroundColor:'#ffffff',borderRadius:28,borderWidth:4,borderColor:'#fcd34d',padding:14,minWidth:116,alignItems:'center'}}><Text style={[s.emoji,{fontSize:68}]}>{word.imageEmoji}</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="وشەکە ببیستە" style={s.secondary} onPress={()=>void soundService.speakWord(word.word)}><Text style={s.text}>🔊 وشەکە ببیستە</Text></TouchableOpacity>
      <View style={{backgroundColor:'#ffffff',borderRadius:22,borderWidth:3,borderBottomWidth:6,borderColor:correct?'#34d399':'#fcd34d',borderBottomColor:correct?'#059669':'#d97706',paddingHorizontal:22,paddingVertical:8,minWidth:180,alignItems:'center'}}>
        <Text accessibilityLiveRegion="polite" style={[s.glyph,{fontSize:Math.max(26,42-word.units.length*2),minHeight:48,writingDirection:'rtl',color:correct?'#065f46':'#1e1b4b'}]}>{assembled||'…'}</Text>
      </View>
      <Text style={s.text}>پیتەکان بە ڕیز هەڵبژێرە</Text>
      <View style={s.row}>{bank.map(tile=>{
        const isVowel=KURDISH_VOWELS.includes(tile.glyph);
        return <TouchableOpacity key={tile.id} accessibilityRole="button" accessibilityLabel={`پیتی ${tile.glyph}، دانەی ${tile.id+1}`}
          disabled={selected.includes(tile.id)||!!feedback} style={[s.tile,{minWidth:80,minHeight:80},isVowel&&{borderColor:'#f59e0b',borderBottomColor:'#b45309',backgroundColor:'#fffbeb'},(selected.includes(tile.id)||!!feedback)&&s.disabled]} onPress={()=>choose(tile.id)}><Text style={[s.glyph,{fontSize:38}]}>{tile.glyph}</Text></TouchableOpacity>;
      })}</View>
      {!!feedback && <Text accessibilityLiveRegion="polite" style={[s.text,{fontFamily:'IBMPlexSansArabic_700Bold',color:correct?'#047857':'#be123c'}]}>{feedback}</Text>}
    </View>
    {correct?<TouchableOpacity accessibilityRole="button" style={[s.button,{backgroundColor:'#34d399',borderColor:'#a7f3d0',borderBottomColor:'#047857'}]} onPress={advance}><Text style={[s.buttonText,{color:'#064e3b'}]}>{round+1===queue.length?'تەواو بکەم ✓':'وشەی دواتر ←'}</Text></TouchableOpacity>
      :<TouchableOpacity accessibilityRole="button" disabled={selected.length!==word.units.length||!!feedback} style={[s.button,(selected.length!==word.units.length||!!feedback)&&s.disabled]} onPress={check}><Text style={s.buttonText}>پشکنینی وشەکەم ✓</Text></TouchableOpacity>}
    {!correct && <View style={s.row}>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{locked.current=false;setFeedback('');setSelected(previous=>previous.slice(0,-1));}}><Text style={s.text}>پیتی پێشوو ↶</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={reset}><Text style={s.text}>دووبارە دایبنێم</Text></TouchableOpacity>
    </View>}
    {!initialWords && <>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:showWords}} style={s.secondary} onPress={()=>setShowWords(!showWords)}><Text style={s.text}>وشەیەک هەڵبژێرە {showWords?'⌃':'⌄'}</Text></TouchableOpacity>
      {showWords && <View style={s.row}>{LEARNING_WORDS.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`وشەی ${item.word}`} style={s.tile} onPress={()=>{helped.current=true;advancedRound.current=-1;setQueue([item]);setRound(0);setShowWords(false);reset();}}><Text style={{fontSize:28}}>{item.imageEmoji}</Text><Text style={s.text}>{item.word}</Text></TouchableOpacity>)}</View>}
    </>}
    <BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton>
  </ScrollView>;
};
