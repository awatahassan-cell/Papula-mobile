import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Volume2, Puzzle, Search, Eye } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { BackButton } from '../../components/BackButton';
import { HelpHint } from '../../components/HelpButton';
import { journeyPracticePlan } from '../../services/journeyPractice';
import { soundService } from '../../services/soundService';
import { QUEST_TEXT } from './questText';

export function JourneyPractice({letterId,free=false,onExit}:{letterId:string;free?:boolean;onExit:()=>void}) {
  const {currentProfile,recordPracticeResult}=useAppStore();
  const {colors:c,isNight}=useAppearance();
  // Keep the session fixed even when recording a response updates the profile.
  const [plan]=useState(()=>journeyPracticePlan(currentProfile,letterId,free));
  const [index,setIndex]=useState(0),[result,setResult]=useState<boolean|null>(null),[heard,setHeard]=useState(false),[audioError,setAudioError]=useState(false);
  const token=useRef(0),locked=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const round=plan[index];
  const instruction=!round?(plan.length?QUEST_TEXT.practiceDone:QUEST_TEXT.practiceEmpty):round.kind==='missing'?QUEST_TEXT.missing:round.kind==='similar'?QUEST_TEXT.similar:QUEST_TEXT.listen;
  const narrate=useCallback(()=>{
    const active=++token.current;clearTimeout(timer.current);setAudioError(false);
    const parts=round?[instruction,round.kind==='missing'?round.word:`پیتی ${round.letter.name}`]:[instruction];
    const play=(i:number)=>{if(active!==token.current)return;if(i===parts.length){setHeard(true);return;}void soundService.speakWord(parts[i],{onEnd:()=>{if(active===token.current)timer.current=setTimeout(()=>play(i+1),i===0?900:0);},onError:()=>{if(active===token.current)setAudioError(true);}});};
    play(0);
  },[instruction,round]);
  useFocusEffect(useCallback(()=>{setHeard(false);narrate();return()=>{token.current++;clearTimeout(timer.current);void soundService.stopSpeaking();};},[narrate]));
  const buttonStyle=[s.primary,{backgroundColor:accentFill(c,isNight),borderBottomColor:c.mintDark}];
  if(!round)return <ScrollView contentContainerStyle={s.page}><Text style={[s.title,{color:c.ink}]}>{plan.length?QUEST_TEXT.practiceDone:QUEST_TEXT.practiceEmpty}</Text><BackButton fullWidth onPress={onExit}>گەڕانەوە بۆ گەشتەکەم</BackButton></ScrollView>;
  const Icon=round.kind==='missing'?Puzzle:round.kind==='similar'?Eye:Search;
  return <ScrollView contentContainerStyle={s.page}>
    <HelpHint text={instruction}/>
    <View style={s.heading}><Icon size={32} color={c.mint}/><Text style={[s.title,{color:c.ink}]}>{round.kind==='missing'?'وشەکە تەواو بکە':round.kind==='similar'?'پیتە هاوشێوەکان':'پیت بدۆزەوە'}</Text></View>
    <Text style={[s.count,{color:c.muted}]}>{`\u2066${index+1} / ${plan.length}\u2069`}</Text>
    <View style={[s.card,{backgroundColor:c.paper,borderColor:c.edge}]}>
      <Text style={[s.prompt,{color:c.ink}]}>{instruction}</Text>
      <TactileButton accessibilityRole="button" accessibilityLabel="ڕێنمایی و دەنگەکە دووبارە ببیستە" onPress={narrate} style={buttonStyle}><Volume2 size={28} color="#fff"/><Text style={s.label}>گوێ بگرە</Text></TactileButton>
      {audioError&&<Text style={[s.prompt,{color:c.muted}]}>{QUEST_TEXT.practiceAudioRetry}</Text>}
      {round.kind==='missing'?<><Text style={s.emoji}>{round.emoji}</Text><Text accessibilityLabel={round.masked} style={[s.word,{color:c.ink}]}>{result===true?round.word:round.masked}</Text></>:round.kind==='similar'?<Text style={[s.word,{color:c.ink}]}>{round.letter.glyph}</Text>:null}
      <View style={s.options}>{round.options.map(glyph=><TactileButton key={glyph} accessibilityRole="button" accessibilityLabel={`پیتی ${glyph}`} disabled={!heard||result===true} onPress={()=>{if(locked.current||!heard)return;locked.current=true;const correct=glyph===round.answer;setResult(correct);recordPracticeResult([round.letter.id],correct,undefined,round.kind==='missing'?'word':'recognition',result===false);if(correct){soundService.playCorrect();void soundService.speakWord(QUEST_TEXT.practiceCorrect);}else{soundService.playEncouragingTryAgain();void soundService.speakWord(QUEST_TEXT.retry);locked.current=false;}}} style={[s.option,{backgroundColor:result===true&&glyph===round.answer?c.leaf:c.lavender},!heard&&{opacity:0.45}]}><Text style={[s.glyph,{color:c.ink}]}>{glyph}</Text></TactileButton>)}</View>
      {result!==null&&<Text accessibilityLiveRegion="polite" style={[s.prompt,{color:c.ink}]}>{result?QUEST_TEXT.practiceCorrect:QUEST_TEXT.retry}</Text>}
      {result===true&&<TactileButton accessibilityRole="button" accessibilityLabel="یاریی دواتر" onPress={()=>{if(!locked.current)return;locked.current=false;token.current++;clearTimeout(timer.current);void soundService.stopSpeaking();setHeard(false);setResult(null);setIndex(i=>i+1);}} style={buttonStyle}><Text style={s.label}>{index+1===plan.length?'مەشقەکەم تەواو بکەم':'یاریی دواتر'}</Text></TactileButton>}
    </View>
    <BackButton fullWidth onPress={onExit}>گەڕانەوە بۆ گەشتەکەم</BackButton>
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:18,gap:16,width:'100%',maxWidth:620,alignSelf:'center',paddingBottom:32},heading:{flexDirection:'row',gap:12,alignItems:'center',justifyContent:'center'},title:{fontSize:24,lineHeight:42,fontWeight:'700',textAlign:'center'},count:{textAlign:'center',fontSize:16},card:{borderWidth:2,borderRadius:28,padding:16,gap:18},prompt:{fontSize:18,lineHeight:32,textAlign:'center'},primary:{minHeight:60,borderRadius:22,borderBottomWidth:5,padding:12,flexDirection:'row',gap:12,alignItems:'center',justifyContent:'center'},label:{color:'#fff',fontSize:18,fontWeight:'700'},options:{flexDirection:'row',gap:10},option:{flex:1,minHeight:90,borderRadius:24,alignItems:'center',justifyContent:'center'},glyph:{fontSize:42,lineHeight:70,fontWeight:'700'},word:{fontSize:48,lineHeight:86,textAlign:'center',writingDirection:'rtl',fontWeight:'700'},emoji:{fontSize:56,textAlign:'center'}});
