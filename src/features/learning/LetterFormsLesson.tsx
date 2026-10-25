import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import React, { useRef, useState } from 'react';
import { View} from 'react-native';
import { Text } from '../../components/RTLText';
import { LetterItem } from '../../services/types';
import { mockLetters } from '../../data/mockLetters';
import { CONFUSABLE_GROUPS, normalizedWord, shuffled, wordUnits } from '../../services/learningEngine';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

const NO_INITIAL_IDS = ['ra', 'lla_heavy', 'wwaw', 'alif'];
const VOWEL_IDS = ['alif', 'e_kurt', 'waw_kurt', 'wwaw', 'o_drej', 'ya_kurt', 'e_drej'];

export const LetterFormsLesson: React.FC<{letter:LetterItem;onPass:()=>void}> = ({letter,onPass}) => {
  const s = useThemeStyles(baseLearningStyles);
  const {recordPracticeResult}=useAppStore();
  const [selected,setSelected]=useState<string|null>(null);
  const [choices]=useState(()=>{
    const group=CONFUSABLE_GROUPS.find(g=>g.includes(letter.id))||[];
    const confusable=mockLetters.filter(item=>item.id!==letter.id&&group.includes(item.id));
    const others=mockLetters.filter(item=>item.id!==letter.id&&!group.includes(item.id));
    return shuffled([letter,...[...confusable,...others].slice(0,2)]);
  });
  const locked=useRef(false);
  const exampleWord=letter.exampleWords[0].word;
  const units=wordUnits(exampleWord);
  const glyphNorm=normalizedWord(letter.glyph);
  const posIndex=units.findIndex(u=>normalizedWord(u)===glyphNorm);
  const targetForm:'initial'|'medial'|'final'=posIndex===0&&!NO_INITIAL_IDS.includes(letter.id)?'initial':posIndex===units.length-1?'final':'medial';
  const posLabel=targetForm==='initial'?'لە سەرەتای وشە':targetForm==='final'?'لە کۆتایی وشە':'لە ناوەڕاستی وشە';
  return <View style={{gap:10,width:'100%'}}>
    <View style={[s.row,{gap:6}]}>{(['initial','medial','final'] as const).map((form,index)=>{
      const noInitial=form==='initial'&&NO_INITIAL_IDS.includes(letter.id);
      const isTargetForm=form===targetForm&&!noInitial;
      return <View key={form} style={[s.tile,{width:'31%',minWidth:0,padding:6},isTargetForm&&{borderColor:'#047857',backgroundColor:'#ecfdf5'}]}>
        <Text style={s.glyph}>{noInitial?'—':letter.forms[form]}</Text>
        <Text style={[s.text,{fontSize:12}]}>{noInitial?'لە سەرەتا نایەت':['سەرەتا','ناوەڕاست','کۆتایی'][index]}</Text>
      </View>;
    })}</View>
    {!VOWEL_IDS.includes(letter.id) && <View style={[s.row,{gap:8}]}>
      <View style={[s.tile,{flex:1,minWidth:0,paddingVertical:6,paddingHorizontal:8}]}><Text style={[s.text,{fontSize:15,writingDirection:'rtl'}]}>{`${letter.glyph} + ا = ${letter.glyph}ا`}</Text></View>
      <View style={[s.tile,{flex:1,minWidth:0,paddingVertical:6,paddingHorizontal:8}]}><Text style={[s.text,{fontSize:15,writingDirection:'rtl'}]}>{`${letter.glyph} + ە = ${letter.glyph}ە`}</Text></View>
    </View>}
    <Text style={[s.glyph,{writingDirection:'rtl'}]}>{exampleWord}</Text>
    <Text style={s.text}>شێوەی پیتی «{letter.glyph}» ({posLabel}) بدۆزەوە</Text>
    <View style={s.row}>{choices.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`شێوەی ${item.forms.medial}`} disabled={selected!==null} style={[s.tile,selected===item.id&&(item.id===letter.id?s.correct:s.retry)]} onPress={()=>{
      if(locked.current)return;locked.current=true;setSelected(item.id);recordPracticeResult([letter.id],item.id===letter.id,undefined,'forms',true);if(item.id===letter.id)onPass();
    }}><Text style={s.glyph}>{item.forms[targetForm]}</Text></TouchableOpacity>)}</View>
    {selected && <Text accessibilityLiveRegion="polite" style={s.text}>{selected===letter.id?'ئافەرم! هەمان پیتە':'سەیری شێوە و خاڵەکان بکە؛ جارێکی تر هەوڵ بدە.'}</Text>}
    {selected && selected!==letter.id && <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{locked.current=false;setSelected(null);}}><Text style={s.text}>دووبارە تاقی بکەمەوە</Text></TouchableOpacity>}
  </View>;
};
