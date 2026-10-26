import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { ArrowLeft, BookOpen, Flower2, PencilLine, RotateCcw, Volume2 } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { CharacterPicture } from '../../components/CharacterPicture';
import { TactileButton } from '../../components/TactileButton';
import { HelpHint } from '../../components/HelpButton';
import { useReducedMotion } from '../../components/Motion';
import { useAppearance } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { useAppStore } from '../../store/useAppStore';
import { soundService } from '../../services/soundService';
import { isLessonComplete } from '../../services/lessonPath';
import { gardenProgress } from '../../services/gardenQuest';
import { playPilotProgress, PLAY_PILOT_LETTER, PLAY_PILOT_STEPS } from '../../services/playPilot';
import { getLetterStory } from '../../data/letterStories';
import { PLAY_PILOT_TEXT as T } from './playPilotText';
import { playJourneyContent } from './playJourneyContent';

/** Narration that neither finishes nor fails (a call, a lost audio session) must not leave the child unable to answer. */
const WATCH_LIMIT_MS=12000;

function DemoPointer() {
  const reduced=useReducedMotion();
  const [tap]=useState(()=>new Animated.Value(0));
  useFocusEffect(useCallback(()=>{
    tap.setValue(0);if(reduced)return;
    const config={duration:500,useNativeDriver:Platform.OS!=='web',isInteraction:false};
    const animation=Animated.loop(Animated.sequence([Animated.timing(tap,{...config,toValue:1}),Animated.timing(tap,{...config,toValue:0})]));animation.start();
    return()=>animation.stop();
  },[reduced,tap]));
  return <Animated.View pointerEvents="none" style={[s.hand,{transform:[{translateY:tap.interpolate({inputRange:[0,1],outputRange:[0,5]})}]}]}><Svg width="34" height="40" viewBox="0 0 34 40"><Path d="M13 22 V6 Q13 1 18 3 V17 Q22 12 25 18 Q31 16 31 23 V29 Q30 38 23 38 H16 Q12 37 9 33 L3 25 Q1 20 6 20Z" fill="#ffd8b0" stroke="#6d5372" strokeWidth="2"/></Svg></Animated.View>;
}

/** The flower that grows with each win (the same drawing is reused for the finale). */
function FlowerSvg({steps,size}:{steps:number;size:number}) {
  return <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M18 91 Q50 76 82 91" stroke="#aa754a" strokeWidth="10" strokeLinecap="round" fill="none"/>
        {steps===0?<Path d="M43 80 Q39 66 53 67 Q64 76 51 82Z" fill="#bb793e" stroke="#89552e" strokeWidth="2"/>:<>
          <Path d={steps===1?'M50 84 Q47 70 50 56':'M50 84 Q48 62 50 38'} stroke="#389351" strokeWidth="6" strokeLinecap="round" fill="none"/>
          <Path d="M49 73 Q27 75 27 57 Q44 55 49 73 M51 65 Q69 65 73 48 Q55 47 51 65" fill="#58b863"/>
          {steps===1?<Path d="M50 58 Q38 54 39 44 Q52 43 50 58" fill="#72c96d"/>:steps===2?<Path d="M50 45 Q27 26 43 16 Q50 9 57 16 Q73 26 50 45Z" fill="#ed7ba8"/>:<>
            {[0,60,120,180,240,300].map(angle=><Circle key={angle} cx="50" cy="17" r="13" fill="#f47eac" transform={`rotate(${angle} 50 33)`}/>)}
            <Circle cx="50" cy="33" r="13" fill="#ffda58"/>
            <Circle cx="46" cy="31" r="1.5" fill="#684a39"/><Circle cx="54" cy="31" r="1.5" fill="#684a39"/>
            <Path d="M46 37 Q50 41 54 37" stroke="#684a39" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </>}
        </>}
  </Svg>;
}

function GrowingFlowerScene({steps,celebrate=false,compact=false}:{steps:number;celebrate?:boolean;compact?:boolean}) {
  const reduced=useReducedMotion();
  const [growth]=useState(()=>new Animated.Value(1));
  useEffect(()=>{
    if(reduced){growth.setValue(1);return;}
    growth.setValue(0.9);
    const animation=Animated.timing(growth,{toValue:1,duration:550,useNativeDriver:Platform.OS!=='web',isInteraction:false});
    animation.start();return()=>animation.stop();
  },[growth,reduced,steps]);
  const stages=['تۆوی گوڵ','ڕووەکی بچووک','گوڵی نەکراوە','گوڵی کراوە'];
  return <View testID="growing-flower" accessibilityLabel={stages[steps]} style={[s.trail,compact&&{height:64}]}>
    <Svg width="100%" height="100%" viewBox="0 0 360 100" preserveAspectRatio="none"><Path d="M0 80 Q90 59 180 78 Q270 59 360 80 V100 H0Z" fill="#bfe49a"/></Svg>
    <Animated.View style={{position:'absolute',bottom:0,alignSelf:'center',transform:[{scale:growth}]}}>
      <FlowerSvg steps={steps} size={compact?66:94}/>
    </Animated.View>
    <View style={{position:'absolute',left:24,bottom:12}}><CharacterPicture symbol="🦋" size={compact?44:62} animate={celebrate}/></View>
  </View>;
}
/** The finish: one big happy flower, Papula and sparkles, so the end of a journey feels like a party. */
function Finale({compact}:{compact:boolean}) {
  const reduced=useReducedMotion();
  const [pop]=useState(()=>new Animated.Value(reduced?1:0.3));
  useEffect(()=>{
    if(reduced)return;
    const animation=Animated.spring(pop,{toValue:1,friction:4.5,tension:70,useNativeDriver:Platform.OS!=='web'});
    animation.start();return()=>animation.stop();
  },[pop,reduced]);
  const size=compact?150:220;
  return <View testID="play-finale" style={s.finale}>
    <Animated.View style={{transform:[{scale:pop}]}}><FlowerSvg steps={3} size={size}/></Animated.View>
    <View style={[s.finaleBug,{left:8}]}><CharacterPicture symbol="🦋" size={compact?64:92} animate/></View>
    <View style={[s.finaleStar,{right:14,top:6}]}><CharacterPicture symbol="⭐" size={compact?34:46} animate={false}/></View>
    <View style={[s.finaleStar,{left:30,top:2}]}><CharacterPicture symbol="✨" size={compact?30:40} animate={false}/></View>
    <View style={[s.finaleStar,{right:34,bottom:10}]}><CharacterPicture symbol="✨" size={compact?26:34} animate={false}/></View>
  </View>;
}

/** One short, voiced journey for each teaching entry. */
export function PlayPilotJourney({startAtBeginning=false,letterId=PLAY_PILOT_LETTER}:{startAtBeginning?:boolean;letterId?:string}={}) {
  const {letter,target,masked,rounds}=playJourneyContent(letterId);
  const {currentProfile,recordPracticeResult,completePlayPilotRound,plantQuestFlower,setRoute,setSelectedStory,setSelectedLetter}=useAppStore();
  const {colors:c,isNight}=useAppearance();
  const {height,width}=useWindowDimensions();
  const compact=height<760||width>height;
  const [index,setIndex]=useState(()=>startAtBeginning?0:isLessonComplete(currentProfile,letterId)?3:playPilotProgress(currentProfile,letterId).length);
  const [showIntro]=useState(()=>playPilotProgress(currentProfile,letterId).length===0&&!isLessonComplete(currentProfile,letterId));
  const [phase,setPhase]=useState<'watch'|'play'|'won'>('watch');
  const [mistakes,setMistakes]=useState(0),[demoVersion,setDemoVersion]=useState(0),[error,setError]=useState(false);
  const token=useRef(0),locked=useRef(false),nextLock=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),guard=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const done=index>=rounds.length,round=rounds[Math.min(index,2)];
  const planted=gardenProgress(currentProfile,letterId).flowerSpot!==undefined;
  const beginner=currentProfile.ageGroup!=='7-8'||currentProfile.placement?.recommendedLevel===1;
  const twoChoices=beginner||mistakes>=2;
  const options=twoChoices?round.options.filter(item=>item.id===round.answer||item.id===round.options.find(other=>other.id!==round.answer)!.id):round.options;
  const instruction=done?(planted?T.planted:T.done):round.instruction;
  const intro=index===0&&showIntro;
  const narrate=useCallback(()=>{
    // A changed demo request intentionally replays the sample; store ticks do not.
    void demoVersion;
    const active=++token.current;clearTimeout(timer.current);clearTimeout(guard.current);setError(false);
    if(!done){setPhase('watch');locked.current=false;guard.current=setTimeout(()=>{if(active===token.current)setPhase(current=>current==='watch'?'play':current);},WATCH_LIMIT_MS);}
    const parts=done?[instruction]:[...(intro?[T.intro]:[]),instruction];
    const run=(i:number)=>{if(active!==token.current)return;if(i===parts.length){if(!done)timer.current=setTimeout(()=>{if(active!==token.current)return;setPhase('play');void soundService.speakWord(T.turn);},850);return;}
      void soundService.speakWord(parts[i],{onEnd:()=>{if(active===token.current)timer.current=setTimeout(()=>run(i+1),i+1<parts.length?450:0);},onError:()=>{if(active!==token.current)return;setError(true);if(!done){locked.current=false;setPhase('play');}}});
    };run(0);
  },[done,instruction,intro,demoVersion]);
  useFocusEffect(useCallback(()=>{narrate();return()=>{token.current++;clearTimeout(timer.current);clearTimeout(guard.current);void soundService.stopSpeaking();};},[narrate]));
  const pick=(id:string)=>{
    if(phase!=='play'||locked.current)return;
    locked.current=true;
    recordPracticeResult([letterId],id===round.answer,undefined,index===2?'word':'recognition',true);
    if(id!==round.answer){Promise.resolve().then(()=>{locked.current=false;});setMistakes(n=>n+1);soundService.playEncouragingTryAgain();void soundService.speakWord(T.retry);if(mistakes+1>=2)setDemoVersion(n=>n+1);return;}
    locked.current=true;nextLock.current=false;token.current++;clearTimeout(timer.current);clearTimeout(guard.current);setPhase('won');completePlayPilotRound(PLAY_PILOT_STEPS[index],letterId);soundService.playCorrect();void soundService.speakWord(T.success);
  };
  const advance=()=>{if(phase!=='won'||nextLock.current)return;nextLock.current=true;token.current++;clearTimeout(timer.current);clearTimeout(guard.current);void soundService.stopSpeaking();locked.current=false;setPhase('watch');setMistakes(0);setIndex(n=>n+1);};
  const fill=accentFill(c,isNight);
  return <View testID="play-pilot-journey" style={[s.page,{backgroundColor:c.background},compact&&{padding:8,gap:6}]}>
    <HelpHint text={instruction}/>
    <View style={[s.header,compact&&{height:40}]}><View style={s.dots}>{PLAY_PILOT_STEPS.map((step,i)=><View key={step} style={[s.dot,{backgroundColor:i<index||(i===index&&phase==='won')?c.mint:c.edge}]}/>)}</View><TactileButton accessibilityRole="button" accessibilityLabel="ڕێنماییەکە دووبارە ببیستە" onPress={narrate} style={[s.audio,{backgroundColor:c.lavender}]}><Volume2 size={27} color={c.mint}/></TactileButton></View>
    <GrowingFlowerScene steps={Math.min(3,index+(phase==='won'?1:0))} celebrate={done||phase==='won'} compact={compact}/>
    {done?<View style={s.finish}>
      <Finale compact={compact}/>
      <Text style={[s.title,{color:c.ink}]}>{planted?'گوڵەکەت لە باغەکەتە!':'گوڵەکەت ئامادەیە!'}</Text>
      <TactileButton accessibilityRole="button" accessibilityLabel={planted?'باغەکەم ببینم':'گوڵەکەم بچێنم'} onPress={()=>{if(planted){setRoute('garden');return;}plantQuestFlower(0,letterId);soundService.playCorrect();}} style={[s.primary,{backgroundColor:fill},compact&&{minHeight:50,padding:6}]}><Flower2 size={28} color="#fff"/><Text style={s.primaryText}>{planted?'باغەکەم ببینم':'گوڵەکەم بچێنم'}</Text></TactileButton>
      <View style={s.extras}><TactileButton accessibilityRole="button" accessibilityLabel="چیرۆکی پیتەکە" onPress={()=>{const story=getLetterStory(letterId);if(story){setSelectedStory(story);setRoute('story-reader');}}} style={[s.extra,{backgroundColor:c.sky}]}><BookOpen size={27} color={c.mint}/><Text style={{color:c.ink}}>چیرۆک</Text></TactileButton><TactileButton accessibilityRole="button" accessibilityLabel="مەشقی نووسین" onPress={()=>{setSelectedLetter(letter);setRoute('writing');}} style={[s.extra,{backgroundColor:c.leaf}]}><PencilLine size={27} color={c.mint}/><Text style={{color:c.ink}}>نووسین</Text></TactileButton><TactileButton accessibilityRole="button" accessibilityLabel="دووبارە یاری بکەم" onPress={()=>{locked.current=false;nextLock.current=false;setMistakes(0);setPhase('watch');setIndex(0);}} style={[s.extra,{backgroundColor:c.lavender}]}><RotateCcw size={27} color={c.mint}/><Text style={{color:c.ink}}>یاری</Text></TactileButton></View>
    </View>:<>
      <Text style={[s.title,{color:c.ink}]}>{round.title}</Text>
      <View style={[s.task,compact&&{minHeight:64,flexDirection:index===2?'row':'column',gap:8},{backgroundColor:c.paper,borderColor:c.edge}]}>
        {index===0?<Text style={[s.target,{color:c.ink},compact&&{fontSize:62,lineHeight:76}]}>{letter.glyph}</Text>:index===1?<CharacterPicture symbol={target.imageEmoji} size={compact?68:92} animate={false}/>:<><CharacterPicture symbol={target.imageEmoji} size={compact?44:64} animate={false}/><Text style={[s.word,{color:c.ink}]}>{phase==='won'?target.word:masked}</Text></>}
      </View>
      <View style={s.options}>{options.map(item=><TactileButton key={item.id} testID={`pilot-option-${item.id}`} accessibilityRole="button" accessibilityLabel={item.label} disabled={phase!=='play'} onPress={()=>pick(item.id)} style={[s.option,compact&&{height:80},{backgroundColor:phase==='won'&&item.id===round.answer?c.leaf:c.paper,borderColor:phase==='watch'&&item.id===round.answer?c.mint:c.edge},phase==='watch'&&item.id===round.answer&&s.demonstrating]}>
        {index===1?<CharacterPicture symbol={item.glyph} size={compact?53:67} animate={false}/>:<Text style={[s.glyph,{color:c.ink}]}>{item.glyph}</Text>}
        {phase==='watch'&&item.id===round.answer&&<DemoPointer/>}
      </TactileButton>)}</View>
      <View style={[s.footer,compact&&{height:52}]}>{phase==='won'?<TactileButton accessibilityRole="button" accessibilityLabel="بڕۆین بۆ هەنگاوی دواتر" onPress={advance} style={[s.primary,{backgroundColor:fill}]}><Text style={s.primaryText}>ئافەرم!</Text><ArrowLeft size={32} color="#fff"/></TactileButton>:error?<Volume2 size={34} color={c.coralDark}/>:null}</View>
    </>}
  </View>;
}
const s=StyleSheet.create({finale:{width:'100%',flex:1,minHeight:150,alignItems:'center',justifyContent:'center'},finaleBug:{position:'absolute',bottom:8},finaleStar:{position:'absolute'},page:{flex:1,width:'100%',maxWidth:650,alignSelf:'center',padding:12,gap:8},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',height:48},dots:{flexDirection:'row',gap:9},dot:{width:27,height:11,borderRadius:6},audio:{width:48,height:46,borderRadius:17,alignItems:'center',justifyContent:'center'},trail:{height:94,borderRadius:24,overflow:'hidden',backgroundColor:'#ddf2ff'},rabbit:{position:'absolute',bottom:3},carrot:{position:'absolute',right:2,bottom:6},title:{fontSize:21,lineHeight:34,fontWeight:'700',textAlign:'center'},task:{flex:1,minHeight:80,maxHeight:190,borderRadius:27,borderWidth:1,alignItems:'center',justifyContent:'center'},target:{fontSize:78,lineHeight:100,fontWeight:'700'},word:{fontSize:45,lineHeight:68,fontWeight:'700',writingDirection:'rtl'},options:{flexDirection:'row',gap:12},option:{flex:1,height:102,borderRadius:25,borderWidth:3,alignItems:'center',justifyContent:'center'},demonstrating:{borderWidth:4},glyph:{fontSize:47,lineHeight:78,fontWeight:'700'},hand:{position:'absolute',bottom:-2,right:4},footer:{height:64,justifyContent:'center'},hint:{fontSize:17,lineHeight:30,textAlign:'center'},primary:{width:'100%',minHeight:60,borderRadius:23,padding:10,flexDirection:'row',gap:12,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:20,lineHeight:34,color:'#fff',fontWeight:'700'},finish:{flex:1,alignItems:'center',justifyContent:'center',gap:14},extras:{flexDirection:'row',gap:10,width:'100%'},extra:{flex:1,minHeight:64,borderRadius:19,padding:6,gap:4,alignItems:'center',justifyContent:'center'}});
