import { BackButton } from '../../components/BackButton';
import { HelpHint } from '../../components/HelpButton';
import { exerciseHelp } from '../../services/exerciseHelp';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import { useGameScroll } from './useGameScroll';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View} from 'react-native';
import { Text } from '../../components/RTLText';
import { mockLetters } from '../../data/mockLetters';
import { soundService } from '../../services/soundService';
import { CONFUSABLE_GROUPS, shuffled, normalizedWord } from '../../services/learningEngine';
import { startingSoundWords } from '../../services/foundationalLearning';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from './learningStyles';

export const StartingSoundGame:React.FC<{onExit:()=>void}>=({onExit})=>{
  const s = useThemeStyles(baseLearningStyles);
  const {currentProfile,recordPracticeResult,finishLearningGame}=useAppStore();
  const [rounds]=useState(()=>startingSoundWords(currentProfile).map(word=>{
    const target=mockLetters.find(letter=>normalizedWord(letter.glyph)===normalizedWord(word.units[0]))!;
    const group=CONFUSABLE_GROUPS.find(g=>g.includes(target.id))||[];
    const confusable=shuffled(mockLetters.filter(letter=>letter.id!==target.id&&group.includes(letter.id)));
    const others=shuffled(mockLetters.filter(letter=>letter.id!==target.id&&!group.includes(letter.id)));
    return {word,target,options:shuffled([target,...[...confusable,...others].slice(0,2)])};
  }));
  const [index,setIndex]=useState(0),[answer,setAnswer]=useState<string|null>(null),[heard,setHeard]=useState(false),[help,setHelp]=useState(false),[finished,setFinished]=useState(false);
  const scroll=useGameScroll(index,answer!==null);
  const locked=useRef(false),advanced=useRef(-1),token=useRef(0);
  const round=rounds[index];const correct=answer===round?.target.id;
  useEffect(()=>{
    if(!round||finished)return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeard(true);
    const active=++token.current;
    void soundService.speakWord(round.word.word,{onEnd:()=>{if(active===token.current)setHeard(true);}});
  },[index,round,finished]);
  useEffect(()=>()=>{token.current++;void soundService.stopSpeaking();},[]);
  if(finished)return <View style={s.container}><View style={[s.card,{backgroundColor:'#ecfdf5',borderColor:'#34d399',borderBottomColor:'#059669',paddingVertical:24}]}><Text style={s.emoji}>🦋 🌟</Text><Text style={s.title}>دەنگی سەرەتای وشەکانت دۆزییەوە</Text></View><BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton></View>;
  if(!round)return null;
  return <ScrollView ref={scroll} contentContainerStyle={s.container}><HelpHint text={exerciseHelp.sound} />
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#ffffff',borderRadius:24,borderWidth:3,borderBottomWidth:6,borderColor:'#38bdf8',borderBottomColor:'#0284c7',paddingHorizontal:14,paddingVertical:10}}>
      <Text style={[s.title,{flex:1,textAlign:'right',fontSize:18}]}>وشەکە بە چ دەنگێک دەست پێ دەکات؟</Text>
      <View style={{backgroundColor:'#e0f2fe',borderRadius:16,borderWidth:2,borderColor:'#38bdf8',paddingHorizontal:10,paddingVertical:4}}><Text style={[s.text,{color:'#0369a1',fontFamily:'IBMPlexSansArabic_700Bold'}]}>{index+1} / {rounds.length}</Text></View>
    </View>
    <View style={[s.card,{backgroundColor:'#f0f9ff',borderColor:'#38bdf8',borderBottomColor:'#0284c7'}]}>
      <View style={{backgroundColor:'#ffffff',borderRadius:28,borderWidth:4,borderColor:'#7dd3fc',padding:14,minWidth:116,alignItems:'center'}}><Text style={[s.emoji,{fontSize:68}]}>{round.word.imageEmoji}</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="وشەکە ببیستە" style={s.button} onPress={()=>{const active=++token.current;void soundService.speakWord(round.word.word,{onEnd:()=>{if(active===token.current)setHeard(true);}});}}><Text style={s.buttonText}>🔊 وشەکە ببیستە</Text></TouchableOpacity>
      {help && <View style={{backgroundColor:'#ffffff',borderRadius:20,borderWidth:3,borderColor:'#fbbf24',paddingHorizontal:18,paddingVertical:6}}><Text style={s.glyph}>{round.word.word}</Text></View>}
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setHelp(true);setHeard(true);}}><Text style={s.text}>وشەکە ببینم؛ یارمەتی دەوێت</Text></TouchableOpacity>
      <View style={s.row}>{round.options.map(letter=><TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`دەنگی سەرەتای پیتی ${letter.glyph}`} disabled={!heard||answer!==null} style={[s.tile,{minWidth:88,minHeight:88},!heard&&s.disabled,answer===letter.id&&(correct?s.correct:s.retry)]} onPress={()=>{if(locked.current)return;locked.current=true;setAnswer(letter.id);recordPracticeResult([round.target.id],letter.id===round.target.id,undefined,'phonics',help);if(letter.id===round.target.id)soundService.playCorrect();else soundService.playEncouragingTryAgain();}}><Text style={[s.glyph,{fontSize:42,lineHeight:58}]}>{letter.glyph}</Text></TouchableOpacity>)}</View>
      {answer && <Text style={[s.text,{fontFamily:'IBMPlexSansArabic_700Bold',color:correct?'#047857':'#be123c'}]}>{correct?'ئافەرم! دەنگی سەرەتاکەت دۆزییەوە':'وشەکە جارێکی تر ببیستە؛ تەنها سەرەتاکەی گوێ بگرە.'}</Text>}
    </View>
    {correct?<TouchableOpacity accessibilityRole="button" style={[s.button,{backgroundColor:'#34d399',borderColor:'#a7f3d0',borderBottomColor:'#047857'}]} onPress={()=>{if(advanced.current===index)return;advanced.current=index;token.current++;void soundService.stopSpeaking();if(index+1===rounds.length){finishLearningGame('sound');setFinished(true);}else{setIndex(index+1);setAnswer(null);setHeard(false);setHelp(false);locked.current=false;}}}><Text style={[s.buttonText,{color:'#064e3b'}]}>دواتر ←</Text></TouchableOpacity>:answer?<TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setAnswer(null);setHelp(true);locked.current=false;}}><Text style={s.text}>دووبارە هەوڵ بدەم</Text></TouchableOpacity>:null}
    <BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton>
  </ScrollView>;
};
