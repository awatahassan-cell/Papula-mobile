import React, { useEffect, useRef, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { mockLetters } from '../../data/mockLetters';
import { CONFUSABLE_GROUPS, reviewPlan, shuffled } from '../../services/learningEngine';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as s } from './learningStyles';

export const LetterPractice: React.FC<{ mode:'sound'|'similar'|'review'; onExit:()=>void; onComplete?:()=>void }> = ({mode,onExit,onComplete}) => {
  const {currentProfile,recordPracticeResult,finishLearningGame}=useAppStore();
  const [rounds]=useState(()=>{
    const candidates=reviewPlan(currentProfile,mockLetters.length).filter(letter=>mode!=='similar'||CONFUSABLE_GROUPS.some(group=>group.includes(letter.id)));
    return candidates.slice(0,mode==='review'?3:5).map((target,index)=>{
      const family=CONFUSABLE_GROUPS.find(group=>group.includes(target.id));
      const alternatives=mode==='similar' && family?mockLetters.filter(letter=>family.includes(letter.id)&&letter.id!==target.id):mockLetters.filter(letter=>letter.id!==target.id);
      const optionCount=currentProfile.placement?.recommendedLevel===1||currentProfile.ageGroup==='3-4'?2:mode==='similar'?Math.min(3,alternatives.length+1):3;
      return {target,options:shuffled([target,...alternatives.slice(index%Math.max(1,alternatives.length-optionCount+2),index%Math.max(1,alternatives.length-optionCount+2)+optionCount-1)])};
    });
  });
  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const [finished,setFinished]=useState(false);
  const locked=useRef(false);
  const round=rounds[index];
  const correct=selected===round?.target.id;
  useEffect(()=>()=>{void soundService.stopSpeaking();},[]);
  const choose=(id:string)=>{
    if(!round||locked.current)return;
    locked.current=true;setSelected(id);
    recordPracticeResult([round.target.id],id===round.target.id,undefined,'recognition',mode==='similar');
    if(id===round.target.id)soundService.playCorrect();else soundService.playEncouragingTryAgain();
  };
  const advancedRound = useRef(-1);
  const next=()=>{
    if (!correct || advancedRound.current === index) return;
    advancedRound.current = index;
    void soundService.stopSpeaking();
    if(index+1===rounds.length){if(mode==='review')onComplete?.();else finishLearningGame(mode);setFinished(true);}
    else {setIndex(index+1);setSelected(null);locked.current=false;}
  };
  if(finished)return <View style={s.container}><Text style={s.emoji}>🌟</Text><Text style={s.title}>ئافەرم! مەشقەکەت تەواو کرد</Text><Text style={s.text}>پیتەکانت بە دروستی ناسینەوە</Text><TouchableOpacity accessibilityRole="button" style={s.button} onPress={onExit}><Text style={s.buttonText}>گەڕانەوە</Text></TouchableOpacity></View>;
  if(!round)return <View style={s.container}><Text style={s.text}>مەشقێک ئامادە نییە</Text></View>;
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>{mode==='similar'?'پیتە هاوشێوەکان 👀':mode==='review'?'مەشقی من 🌱':'یاریی دەنگ 🔊'}</Text>
    <Text style={s.text}>{index+1} / {rounds.length}</Text>
    <View style={s.card}>
      {mode==='similar' && <><Text style={[s.glyph,{fontSize:68}]}>{round.target.glyph}</Text><Text style={s.text}>شێوە و خاڵەکانی ئەم پیتە سەیر بکە</Text></>}
      <TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>void soundService.speakWord(`پیتی ${round.target.name}`)}><Text style={s.buttonText}>دەنگەکە ببیستە 🔊</Text></TouchableOpacity>
      <Text style={s.text}>{mode==='similar'?'کامەیان هەمان پیتە؟':'کام پیتت بیست؟'}</Text>
      <View style={s.row}>{round.options.map(letter=><TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`پیتی ${letter.glyph}`}
        disabled={selected!==null} style={[s.tile,selected===letter.id&&(correct?s.correct:s.retry)]} onPress={()=>choose(letter.id)}><Text style={s.glyph}>{letter.glyph}</Text></TouchableOpacity>)}</View>
      {selected && <Text accessibilityLiveRegion="polite" style={s.text}>{correct?'ئافەرم! پیتی دروستت دۆزییەوە 🌟':'باشە، جارێکی تر گوێ بگرە و هەوڵ بدە 💛'}</Text>}
    </View>
    {correct?<TouchableOpacity accessibilityRole="button" style={s.button} onPress={next}><Text style={s.buttonText}>{index+1===rounds.length?'تەواو بکەم ✓':'پیتی دواتر ←'}</Text></TouchableOpacity>
      :selected?<TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setSelected(null);locked.current=false;}}><Text style={s.text}>جارێکی تر هەوڵ بدەم</Text></TouchableOpacity>:null}
    <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={onExit}><Text style={s.text}>گەڕانەوە</Text></TouchableOpacity>
  </ScrollView>;
};
