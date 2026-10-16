import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import React, { useRef, useState } from 'react';
import { View} from 'react-native';
import { Text } from '../../components/RTLText';
import { LetterItem } from '../../services/types';
import { mockLetters } from '../../data/mockLetters';
import { shuffled } from '../../services/learningEngine';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

export const LetterFormsLesson: React.FC<{letter:LetterItem;onPass:()=>void}> = ({letter,onPass}) => {
  const s = useThemeStyles(baseLearningStyles);
  const {recordPracticeResult}=useAppStore();
  const [selected,setSelected]=useState<string|null>(null);
  const [choices]=useState(()=>shuffled([letter,...mockLetters.filter(item=>item.id!==letter.id).slice(0,2)]));
  const locked=useRef(false);
  return <View style={{gap:10,width:'100%'}}>
    <View style={[s.row,{gap:6}]}>{(['initial','medial','final'] as const).map((form,index)=><View key={form} style={[s.tile,{width:'31%',minWidth:0,padding:6}]}><Text style={s.glyph}>{letter.forms[form]}</Text><Text style={[s.text,{fontSize:12}]}>{['سەرەتا','ناوەڕاست','کۆتایی'][index]}</Text></View>)}</View>
    <Text style={[s.glyph,{writingDirection:'rtl'}]}>{letter.exampleWords[0].word}</Text>
    <Text style={s.text}>شێوەی پیتی «{letter.glyph}» بدۆزەوە</Text>
    <View style={s.row}>{choices.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`شێوەی ${item.forms.medial}`} disabled={selected!==null} style={[s.tile,selected===item.id&&(item.id===letter.id?s.correct:s.retry)]} onPress={()=>{
      if(locked.current)return;locked.current=true;setSelected(item.id);recordPracticeResult([letter.id],item.id===letter.id,undefined,'forms',true);if(item.id===letter.id)onPass();
    }}><Text style={s.glyph}>{item.forms.medial}</Text></TouchableOpacity>)}</View>
    {selected && <Text accessibilityLiveRegion="polite" style={s.text}>{selected===letter.id?'ئافەرم! هەمان پیتە 🌟':'سەیری شێوە و خاڵەکان بکە؛ جارێکی تر هەوڵ بدە.'}</Text>}
    {selected && selected!==letter.id && <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{locked.current=false;setSelected(null);}}><Text style={s.text}>دووبارە تاقی بکەمەوە</Text></TouchableOpacity>}
  </View>;
};
