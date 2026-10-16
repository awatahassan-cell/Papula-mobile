import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import React, {useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {Mic, Square, Play, ChevronDown, ChevronUp} from 'lucide-react-native';
import {Text} from '../../components/RTLText';
import {voiceRecorderService} from '../../services/voiceRecorderService';
import {soundService} from '../../services/soundService';
import {useAppearance} from '../../theme/useAppearance';
export const LetterVoicePractice=()=>{
  const {colors:c}=useAppearance();
  const [open,setOpen]=useState(false);
  const [recording,setRecording]=useState(false);
  const [ready,setReady]=useState(false);
  const active=useRef(false);
  useEffect(()=>()=>{if(active.current)void voiceRecorderService.stopRecording();},[]);
  const toggle=async()=>{
    void soundService.stopSpeaking();
    if(recording){await voiceRecorderService.stopRecording();active.current=false;setRecording(false);setReady(voiceRecorderService.hasRecording());}
    else {const started=await voiceRecorderService.startRecording();active.current=started;setRecording(started);}
  };
  return <View style={{backgroundColor:c.paper,borderRadius:26,padding:16,gap:12,borderWidth:1.5,borderColor:c.edge}}>
    <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:open}} disabled={recording} onPress={()=>{setOpen(!open);if(!open)void soundService.speakWord('با دەنگی خۆت تۆمار بکەیت، پاشان گوێی لێ بگرە.');}} style={{minHeight:48,flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:40,height:40,borderRadius:14,backgroundColor:c.lavender,alignItems:'center',justifyContent:'center'}}><Mic size={21} color={c.mint} strokeWidth={1.8}/></View><Text style={{fontSize:17,flex:1,color:c.ink}}>دەنگی خۆم تۆمار بکەم</Text>{open?<ChevronUp size={19} color={c.muted}/>:<ChevronDown size={19} color={c.muted}/>}</TouchableOpacity>
    {open&&<><TouchableOpacity accessibilityRole="button" onPress={()=>void toggle()} style={{minHeight:52,justifyContent:'center',backgroundColor:recording?'#fee2e2':c.sky,borderRadius:16,padding:12}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}>{recording?<Square size={18} color='#b91c1c'/>:<Mic size={18} color='#3289a5'/>}<Text style={{color:recording?'#7f1d1d':c.ink}}>{recording?'وەستاندنی تۆمار':'تۆمارکردنی دەنگم'}</Text></View></TouchableOpacity>
    {ready&&!recording&&<TouchableOpacity accessibilityRole="button" onPress={()=>void voiceRecorderService.playLastRecording()} style={{minHeight:48,justifyContent:'center'}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Play size={18} color='#23875f'/><Text style={{color:c.ink}}>گوێ لە دەنگی خۆم بگرم</Text></View></TouchableOpacity>}</>}
  </View>;
};
