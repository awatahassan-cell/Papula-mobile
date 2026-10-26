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
    const active=++token.current;
    void soundService.speakWord(round.word.word,{onEnd:()=>{if(active===token.current)setHeard(true);}});
  },[index,round,finished]);
  useEffect(()=>()=>{token.current++;void soundService.stopSpeaking();},[]);
  if(finished)return <View style={s.container}><Text style={s.emoji}></Text><Text style={s.title}>دەنگی سەرەتای وشەکانت دۆزییەوە</Text><BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton></View>;
  if(!round)return null;
  return <ScrollView ref={scroll} contentContainerStyle={s.container}><HelpHint text={exerciseHelp.sound} />
    <Text style={s.title}>وشەکە بە چ دەنگێک دەست پێ دەکات؟</Text><Text style={s.text}>{index+1} / {rounds.length}</Text>
    <View style={s.card}><Text style={s.emoji}>{round.word.imageEmoji}</Text>
      <TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>{const active=++token.current;void soundService.speakWord(round.word.word,{onEnd:()=>{if(active===token.current)setHeard(true);}});}}><Text style={s.buttonText}>وشەکە ببیستە</Text></TouchableOpacity>
      {help && <Text style={s.glyph}>{round.word.word}</Text>}
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setHelp(true);setHeard(true);}}><Text style={s.text}>وشەکە ببینم؛ یارمەتی دەوێت</Text></TouchableOpacity>
      <View style={s.row}>{round.options.map(letter=><TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`دەنگی سەرەتای پیتی ${letter.glyph}`} disabled={!heard||answer!==null} style={[s.tile,!heard&&s.disabled,answer===letter.id&&(correct?s.correct:s.retry)]} onPress={()=>{if(locked.current)return;locked.current=true;setAnswer(letter.id);recordPracticeResult([round.target.id],letter.id===round.target.id,undefined,'phonics',help);if(letter.id===round.target.id)soundService.playCorrect();else soundService.playEncouragingTryAgain();}}><Text style={s.glyph}>{letter.glyph}</Text></TouchableOpacity>)}</View>
      {answer && <Text style={s.text}>{correct?'ئافەرم! دەنگی سەرەتاکەت دۆزییەوە':'وشەکە جارێکی تر ببیستە؛ تەنها سەرەتاکەی گوێ بگرە.'}</Text>}
    </View>
    {correct?<TouchableOpacity accessibilityRole="button" style={s.button} onPress={()=>{if(advanced.current===index)return;advanced.current=index;token.current++;void soundService.stopSpeaking();if(index+1===rounds.length){finishLearningGame('sound');setFinished(true);}else{setIndex(index+1);setAnswer(null);setHeard(false);setHelp(false);locked.current=false;}}}><Text style={s.buttonText}>دواتر ←</Text></TouchableOpacity>:answer?<TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={()=>{setAnswer(null);setHelp(true);locked.current=false;}}><Text style={s.text}>دووبارە هەوڵ بدەم</Text></TouchableOpacity>:null}
    <BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton>
  </ScrollView>;
};
