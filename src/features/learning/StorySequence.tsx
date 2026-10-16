import { useThemeStyles } from '../../theme/useAppearance';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, ScrollView, View } from 'react-native';
import { Text } from '../../components/RTLText';
import { StoryItem } from '../../services/types';
import { shuffled } from '../../services/learningEngine';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

export const StorySequence:React.FC<{story:StoryItem;onComplete:()=>void}>=({story,onComplete})=>{
  const s = useThemeStyles(baseLearningStyles);
  const {recordSkillResult}=useAppStore();
  const [cards]=useState(()=>shuffled(story.pages.slice(0,3).map((page,id)=>({page,id}))));
  const [selected,setSelected]=useState<number[]>([]),[feedback,setFeedback]=useState('');
  const helped=useRef(false),locked=useRef(false);
  useEffect(()=>()=>{void soundService.stopSpeaking();},[]);
  const scenes:Record<string,string>={morning_sun:'☀️ ⛰️',butterfly_waking:'🦋 🛏️',garden_flying:'🦋 🌳 🌷',forest_bear:'🌲 🐻',fox_pointing:'🦊 👉',honey_harvest:'🐻 🍯',starry_night:'🌌 ✨',deer_moon:'🦌 🌙',moon_speaking:'🌙 💬',rabbit_boasting:'🐇 💬',turtle_challenge:'🐢 🏁',rabbit_sleeping:'🐇 💤',cloud_sitting:'☁️',rain_falling:'🌧️',sun_shining:'☀️',ant_summer:'🐜 ☀️',grasshopper_play:'🦗 🎵',ant_working:'🐜 🌾',lion_sleeping:'🦁 💤',mouse_running:'🐭 🏃',mouse_spared:'🦁 🐭 💛'};
  return <ScrollView contentContainerStyle={s.container}><Text style={s.title}>سەرەتا چی ڕوویدا؟ 📖</Text><Text style={s.text}>بە ڕیزی ڕوودان کرتە لە بەشەکانی چیرۆک بکە.</Text>
    {cards.map(({page,id})=><View key={id} style={s.card}>
      <Text style={s.emoji}>{scenes[page.illustrationTheme]||(/[\u{1F300}-\u{1FAFF}]/u.test(page.illustrationTheme)?page.illustrationTheme:story.coverEmoji)}</Text>
      <TouchableOpacity accessibilityRole="button" disabled={selected.includes(id)||locked.current} style={[s.secondary,{width:'100%'},selected.includes(id)&&s.correct]} onPress={()=>setSelected(previous=>previous.includes(id)?previous:[...previous,id])}><Text style={[s.text,{writingDirection:'rtl',textAlign:'right'}]}>{selected.includes(id)?`${selected.indexOf(id)+1}. `:''}{page.textKu}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>{helped.current=true;void soundService.speakStory(story.id,page.pageNumber,page.textKu);}}><Text style={s.text}>ئەم بەشە ببیستە 🔊</Text></TouchableOpacity>
    </View>)}
    {!!feedback && <Text accessibilityLiveRegion="polite" style={s.text}>{feedback}</Text>}
    <TouchableOpacity accessibilityRole="button" disabled={selected.length!==cards.length||locked.current} style={[s.button,selected.length!==cards.length&&s.disabled]} onPress={()=>{if(locked.current)return;const correct=selected.every((id,index)=>id===index);recordSkillResult('reading',correct,helped.current);if(correct){locked.current=true;onComplete();}else{helped.current=true;setFeedback('با ڕیزەکە دووبارە بکەینەوە؛ سەرەتا چی ڕوویدا، پاشان چی؟');setSelected([]);}}}><Text style={s.buttonText}>پشکنینی ڕیزەکە ✓</Text></TouchableOpacity>
  </ScrollView>;
};
