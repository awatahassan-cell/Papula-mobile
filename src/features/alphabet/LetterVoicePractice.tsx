import React, {useEffect,useRef,useState} from 'react';
import {View,TouchableOpacity} from 'react-native';
import {Mic, Square, Play, ChevronDown, ChevronUp} from 'lucide-react-native';
import {Text} from '../../components/RTLText';
import {voiceRecorderService} from '../../services/voiceRecorderService';
import {soundService} from '../../services/soundService';
export const LetterVoicePractice=()=>{
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
  return <View style={{backgroundColor:'#fff',borderRadius:22,padding:16,gap:12}}>
    <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:open}} disabled={recording} onPress={()=>{setOpen(!open);if(!open)void soundService.speakWord('با دەنگی خۆت تۆمار بکەیت، پاشان گوێی لێ بگرە.');}} style={{minHeight:48,flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:40,height:40,borderRadius:14,backgroundColor:'#eeebff',alignItems:'center',justifyContent:'center'}}><Mic size={21} color='#7950a0' strokeWidth={1.8}/></View><Text style={{fontSize:17,flex:1}}>دەنگی خۆم تۆمار بکەم</Text>{open?<ChevronUp size={19} color='#657d79'/>:<ChevronDown size={19} color='#657d79'/>}</TouchableOpacity>
    {open&&<><TouchableOpacity accessibilityRole="button" onPress={()=>void toggle()} style={{minHeight:52,justifyContent:'center',backgroundColor:recording?'#fee2e2':'#e4f4ff',borderRadius:16,padding:12}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}>{recording?<Square size={18} color='#b91c1c'/>:<Mic size={18} color='#3289a5'/>}<Text>{recording?'وەستاندنی تۆمار':'تۆمارکردنی دەنگم'}</Text></View></TouchableOpacity>
    {ready&&!recording&&<TouchableOpacity accessibilityRole="button" onPress={()=>void voiceRecorderService.playLastRecording()} style={{minHeight:48,justifyContent:'center'}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Play size={18} color='#23875f'/><Text>گوێ لە دەنگی خۆم بگرم</Text></View></TouchableOpacity>}</>}
  </View>;
};
