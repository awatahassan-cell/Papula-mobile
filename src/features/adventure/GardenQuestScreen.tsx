import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ArrowLeft, Check, BookOpen, Flower2, Lock, Grid2X2, Headphones, Leaf, PencilLine, Puzzle, Search, Volume2 } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { HelpHint } from '../../components/HelpButton';
import { BackButton } from '../../components/BackButton';
import { useAppearance } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { useResponsive } from '../../theme/responsive';
import { useAppStore } from '../../store/useAppStore';
import { gardenProgress, gardenChallenge, GARDEN_STEPS } from '../../services/gardenQuest';
import { isLessonUnlocked, nextLessonLetter } from '../../services/lessonPath';
import { getLetterStory } from '../../data/letterStories';
import { mockLetters } from '../../data/mockLetters';
import { soundService } from '../../services/soundService';
import { StrokePoint } from '../../services/types';
import { assessWriting } from '../../services/foundationalLearning';
import { getKurdishStrokeGuide } from '../../data/kurdishLetterGuides';
import { WritingBoard } from '../writing/WritingBoard';
import { GardenScene } from './GardenScene';
import { SharedGarden } from './SharedGarden';
import { JourneyPractice } from './JourneyPractice';
import { QUEST_TEXT } from './questText';
import { PlayPilotJourney } from './PlayPilotJourney';

const tasks=[{title:'دەنگی پیت',Icon:Headphones},{title:'وێنەکە بدۆزەوە',Icon:Search},{title:'وشەکە پێک بهێنە',Icon:Puzzle},{title:'پردەکە تەواو بکە',Icon:PencilLine},{title:'چیرۆکی پیت',Icon:BookOpen}];
export function GardenQuestScreen() {
  const {currentProfile,selectedLetter,setSelectedLetter,setRoute}=useAppStore();
  const letterId=selectedLetter?.id || nextLessonLetter(currentProfile)?.id || mockLetters[0].id;
  if(!isLessonUnlocked(currentProfile,letterId)) return <View style={{padding:24,gap:20}}><HelpHint text={QUEST_TEXT.locked}/><Text>{QUEST_TEXT.locked}</Text><BackButton onPress={()=>{setSelectedLetter(nextLessonLetter(currentProfile)||mockLetters[0]);setRoute('garden-quest');}}>گەشتی ئێستام بکەمەوە</BackButton></View>;
  return <PlayPilotJourney key={`${currentProfile.id}:${letterId}`} letterId={letterId}/>;
}
export function LegacyGardenQuest({letterId}:{letterId:string}) {
  const {colors:c,isNight}=useAppearance();
  const {width}=useResponsive();
  const {currentProfile,completeGardenTask,plantQuestFlower,setRoute,setSelectedLetter,setSelectedStory,registerBackHandler}=useAppStore();
  const challenge=useMemo(()=>gardenChallenge(letterId),[letterId]);
  const {letter,target,letters,pictures,tiles:availableTiles,word}=challenge;
  const progress=gardenProgress(currentProfile,letter.id);
  const [savedStage,setStage]=useState(progress.steps.length), [intro,setIntro]=useState(progress.steps.length===0);
  const stage=savedStage===4&&progress.steps.length===GARDEN_STEPS.length?GARDEN_STEPS.length:savedStage;
  const [picker,setPicker]=useState(false), [heard,setHeard]=useState(false), [speaking,setSpeaking]=useState(false);
  const [won,setWon]=useState(false), [retry,setRetry]=useState(0), [audioError,setAudioError]=useState(false);
  const [tiles,setTiles]=useState<number[]>([]), [strokes,setStrokes]=useState<StrokePoint[][]>([]);
  const [drawing,setDrawing]=useState(false), [reset,setReset]=useState(0);
  const attempt=useRef(0), accepted=useRef(false), tileLock=useRef(false);
  const pauseTimer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [practice,setPractice]=useState<'letter'|'free'|null>(null);
  const guide=getKurdishStrokeGuide(letter.id);
  const task=tasks[Math.min(stage,4)];
  const text=picker?QUEST_TEXT.pick:intro?QUEST_TEXT.intro:won?QUEST_TEXT.success:stage===5?(progress.flowerSpot===undefined?QUEST_TEXT.garden:QUEST_TEXT.done):QUEST_TEXT[GARDEN_STEPS[stage]];
  const voiceKey=JSON.stringify({retry,parts:[
    ...(retry>0?[QUEST_TEXT.retry]:[]),text,
    ...(!intro&&!picker&&!won&&stage===0?[`پیتی ${letter.name}`]:[]),
    ...(!intro&&!picker&&!won&&(stage===1||stage===2)?[...(stage===2?[900]:[]),target.word]:[]),
    ...(!intro&&!picker&&!won&&stage===2?[900,QUEST_TEXT.wordParts,500,...availableTiles.slice().reverse().map(tile=>tile.glyph)]:[]),
    ...(!intro&&!picker&&!won&&stage===3&&guide?[guide.instructionKu]:[]),
  ]});
  const play=useCallback((parts:(string | number)[],onEnd?:()=>void)=>{
    clearTimeout(pauseTimer.current);
    const token=++attempt.current;
    setSpeaking(true);setAudioError(false);
    const run=(index:number)=>{
      if(attempt.current!==token)return;
      if(index===parts.length){setSpeaking(false);onEnd?.();return;}
      const part=parts[index];
      if(typeof part==='number'){
        pauseTimer.current=setTimeout(()=>run(index+1),part);
        return;
      }
      void soundService.speakWord(part,{
        onEnd:()=>run(index+1),
        onError:()=>{if(attempt.current===token){setSpeaking(false);setAudioError(true);setHeard(true);}},
      });
    };
    run(0);
  },[]);
  // Back-button registration must never restart narration when the store updates.
  useFocusEffect(useCallback(()=>{
    if(practice){
      registerBackHandler?.(()=>{setPractice(null);return true;});
      return ()=>registerBackHandler?.(null);
    }
  },[practice,registerBackHandler]));
  // Only a changed exercise or route focus starts automatic narration.
  useFocusEffect(useCallback(()=>{
    if(practice)return;
    play(JSON.parse(voiceKey).parts,()=>{if(!intro&&!picker&&stage===0)setHeard(true);});
    return ()=>{attempt.current++;clearTimeout(pauseTimer.current);void soundService.stopSpeaking();};
  },[voiceKey,play,intro,picker,stage,practice]));
  const narrate=()=>play(JSON.parse(voiceKey).parts,()=>{if(!intro&&!picker&&stage===0)setHeard(true);});
  const succeed=()=>{if(accepted.current)return;accepted.current=true;setWon(true);setRetry(0);completeGardenTask(GARDEN_STEPS[stage],letter.id);soundService.playCorrect();};
  const answer=(correct:boolean)=>{if(accepted.current)return;if(correct)succeed();else{setRetry(value=>value+1);soundService.playEncouragingTryAgain();}};
  const next=()=>{setStage(stage+1);setWon(false);setRetry(0);setHeard(false);setTiles([]);setStrokes([]);setReset(value=>value+1);accepted.current=false;tileLock.current=false;};
  const pickTile=(id:number)=>{
    if(tileLock.current||accepted.current||tiles.includes(id))return;
    tileLock.current=true;
    const picked=[...tiles,id];setTiles(picked);
    const spelled=picked.map(tileId=>availableTiles.find(tile=>tile.id===tileId)!.glyph).join('');
    if(!word.startsWith(spelled)){answer(false);setTiles([]);}
    else if(picked.length===availableTiles.length)answer(true);
    else play([availableTiles.find(tile=>tile.id===id)!.glyph]);
    // Synchronous guard covers a second press in the same event turn.
    Promise.resolve().then(()=>{tileLock.current=false;});
  };
  const fill=accentFill(c,isNight);
  if(practice)return <JourneyPractice letterId={letter.id} free={practice==='free'} onExit={()=>setPractice(null)}/>;
  return <ScrollView scrollEnabled={!drawing} contentContainerStyle={[s.page,{maxWidth:620}]}>
    <HelpHint text={text}/>
    <View style={s.heading}><View style={s.flex}><Text style={[s.eyebrow,{color:c.mint}]}>{`گەشتی پیتی «${letter.glyph}»`}</Text><Text style={[s.title,{color:c.ink}]}>{picker?'باغی پیتەکان':stage===5?'باغی من':intro?'با باغەکەت بڕوێنین!':task.title}</Text></View><TactileButton accessibilityRole="button" accessibilityLabel="ڕێنماییەکە دووبارە ببیستە" onPress={narrate} style={[s.voice,{backgroundColor:c.lavender}]}><Volume2 color={c.mint} size={26}/></TactileButton></View>
    <TactileButton accessibilityRole="button" accessibilityLabel="هەموو پیتەکان ببینە" accessibilityState={{expanded:picker}} onPress={()=>setPicker(value=>!value)} disabled={drawing} style={[s.secondary,{backgroundColor:c.lavender,flexDirection:'row',gap:10}]}><Grid2X2 size={22} color={c.mint}/><Text style={{color:c.ink}}>پیتێکی تر هەڵبژێرم</Text></TactileButton>
    {picker?<View style={s.letterGrid}>{mockLetters.map(item=>{
      const planted=gardenProgress(currentProfile,item.id).flowerSpot!==undefined;
      const locked=!isLessonUnlocked(currentProfile,item.id);
      return <TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={`گەشتی پیتی ${item.name}${planted?'، گوڵەکەی ڕواوە':''}`} disabled={locked} accessibilityState={{selected:item.id===letter.id,disabled:locked}} onPress={()=>{setSelectedLetter(item);setPicker(false);}} style={[s.letterCell,{backgroundColor:planted?c.leaf:c.paper,borderColor:item.id===letter.id?c.mint:c.edge},locked&&s.disabled]}><Text style={[s.glyph,{color:c.ink,fontSize:31}]}>{item.glyph}</Text>{locked?<Lock size={16} color={c.muted}/>:planted&&<Flower2 size={18} color={c.mint}/>}</TactileButton>;
    })}</View>:<>
      {stage===5?<SharedGarden profile={currentProfile} onPlant={progress.flowerSpot===undefined?()=>{plantQuestFlower(0,letter.id);soundService.playCorrect();}:undefined}/>:<GardenScene progress={Math.max(stage,progress.steps.length)}/>}
      <View accessibilityRole="progressbar" accessibilityLabel="پێشکەوتنی گەشتی باغ" accessibilityValue={{min:0,max:GARDEN_STEPS.length,now:progress.steps.length}} style={s.trail}>{tasks.map(({Icon,title},i)=><View key={title} style={[s.node,{backgroundColor:i<progress.steps.length?c.leaf:i===stage?fill:c.paper,borderColor:c.edge}]}>{i<progress.steps.length?<Check size={23} color={c.mint}/>:<Icon size={23} color={i===stage?'#fff':c.muted}/>}</View>)}</View>
      <View style={[s.card,{backgroundColor:c.paper,borderColor:c.edge}]}>
        <Text style={[s.prompt,{color:c.ink}]}>{text}</Text>
        {intro?<QuestAction label="با گەشتەکە دەست پێ بکەین" onPress={()=>setIntro(false)}/>:stage===5?<>
          {progress.flowerSpot===undefined?<Text style={[s.small,{color:c.muted}]}>دەست لە دوگمەی چاندنی گوڵەکەت بدە.</Text>:<View style={[s.keepsake,{backgroundColor:c.leaf}]}><Leaf color={c.mint} size={28}/><Text style={[s.prompt,{color:c.ink}]}>{`گوڵی «${letter.glyph}» لە باغەکەت ڕوا!`}</Text></View>}
          <BackButton fullWidth onPress={()=>setRoute('home')}>گەڕانەوە بۆ ماڵەوە</BackButton>
          <QuestAction label="با زیاتر یاری بکەین" onPress={()=>setPractice('free')}/>
        </>:won?<QuestAction label="بڕۆین بۆ ئەرکی دواتر" onPress={next}/>:<>
          {stage===0&&<>
            <QuestAction label={speaking?'گوێ بگرە…':'دەنگی پیتەکە ببیستە'} onPress={narrate}/>
            <View style={s.choices}>{letters.map(item=><TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={`پیتی ${item.name}`} disabled={!heard} onPress={()=>answer(item.id===letter.id)} style={[s.choice,{backgroundColor:c.lavender},!heard&&s.disabled]}><Text style={[s.glyph,{color:c.ink}]}>{item.glyph}</Text></TactileButton>)}</View>
          </>}
          {stage===1&&<View style={s.choices}>{pictures.map(item=><TactileButton key={item.word} accessibilityRole="button" accessibilityLabel={item.word} onPress={()=>answer(item.word===target.word)} style={[s.picture,{backgroundColor:c.sky}]}><Text style={s.emoji}>{item.imageEmoji}</Text><Text style={[s.word,{color:c.ink}]}>{item.word}</Text></TactileButton>)}</View>}
          {stage===2&&<>
            <TactileButton accessibilityRole="button" accessibilityLabel={`گوێ لە ${target.word} بگرە`} onPress={()=>play([target.word])} style={[s.secondary,{backgroundColor:c.sky}]}><Volume2 size={24} color={c.mint}/><Text style={[s.word,{color:c.ink}]}>{target.word}</Text></TactileButton>
            <View accessibilityLabel={`وشەکە پێک بهێنە: ${target.word}`} style={[s.slots,{borderColor:c.edge}]}><Text style={[s.assembled,{color:c.ink}]}>{tiles.map(id=>availableTiles.find(tile=>tile.id===id)!.glyph).join('')||'…'}</Text></View>
            <View style={s.tileTray}>{availableTiles.map(tile=><TactileButton key={tile.id} accessibilityRole="button" accessibilityLabel={`پیتی ${tile.glyph}`} accessibilityState={{disabled:tiles.includes(tile.id)}} disabled={tiles.includes(tile.id)} style={[s.tile,{backgroundColor:c.lavender},tiles.includes(tile.id)&&s.disabled]} onPress={()=>pickTile(tile.id)}><Text style={[s.glyph,{color:c.ink,fontSize:32}]}>{tile.glyph}</Text></TactileButton>)}</View>
            <TactileButton accessibilityRole="button" accessibilityLabel="پیتەکان دووبارە ڕیز بکە" onPress={()=>{setTiles([]);play([QUEST_TEXT.reset,QUEST_TEXT.build,target.word]);}} style={[s.secondary,{backgroundColor:c.lavender}]}><Text style={{color:c.ink}}>دووبارە ڕیز بکەم</Text></TactileButton>
          </>}
          {stage===4&&<QuestAction label="چیرۆکی پیتەکە ببیستین" onPress={()=>{const story=getLetterStory(letter.id);if(story){setSelectedStory({...story,journeyLetterId:letter.id});setSelectedLetter(letter);setRoute('story-reader');}}}/>}
          {stage===3&&guide&&<>
            <View style={s.board}><WritingBoard side={Math.max(160,Math.min(width-80,380))} guide={guide} showGuide color={c.mint} onStrokesChange={setStrokes} onDrawingChange={setDrawing} resetKey={reset}/></View>
            <QuestAction label="پردەکەم تەواو بوو؟" onPress={()=>answer(assessWriting(guide,strokes,'trace').mastered)} disabled={drawing||strokes.length===0}/>
            <TactileButton accessibilityRole="button" accessibilityLabel="بۆردەکە پاک بکەرەوە" onPress={()=>{setReset(value=>value+1);play([QUEST_TEXT.reset,QUEST_TEXT.write]);}} disabled={drawing} style={[s.secondary,{backgroundColor:c.lavender}]}><Text style={{color:c.ink}}>دووبارە بنووسم</Text></TactileButton>
          </>}
          {retry>0&&<Text accessibilityLiveRegion="polite" style={[s.small,{color:c.muted}]}>{QUEST_TEXT.retry}</Text>}
        </>}
      </View>
      {!intro&&stage<5&&<TactileButton accessibilityRole="button" accessibilityLabel="یاری و مەشقی ئەم پیتە" onPress={()=>setPractice('letter')} style={[s.secondary,{backgroundColor:c.sky,flexDirection:'row',gap:10}]}><Puzzle size={26} color={c.mint}/><Text style={[s.word,{color:c.ink}]}>یاری و مەشقی ئەم پیتە</Text></TactileButton>}
    </>}
    {audioError&&<TactileButton accessibilityRole="button" accessibilityLabel="دەنگەکە دووبارە بکەوە" onPress={narrate} style={[s.secondary,{backgroundColor:c.peach}]}><Volume2 size={26} color={c.ink}/><Text style={{color:c.ink}}>دەنگەکە دووبارە بکەوە</Text></TactileButton>}
  </ScrollView>;
}
function QuestAction({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}) {
  const {colors:c,isNight}=useAppearance();
  return <TactileButton accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[s.primary,{backgroundColor:accentFill(c,isNight),borderBottomColor:c.mintDark},disabled&&s.disabled]}><Text style={s.primaryText}>{label}</Text><ArrowLeft size={22} color="#fff"/></TactileButton>;
}
const s=StyleSheet.create({
  page:{width:'100%',alignSelf:'center',padding:18,gap:16,paddingBottom:32},flex:{flex:1,minWidth:0},heading:{flexDirection:'row',alignItems:'center',gap:12},eyebrow:{fontSize:13,fontWeight:'700'},title:{fontSize:26,lineHeight:42,fontWeight:'700'},voice:{width:52,height:52,borderRadius:20,alignItems:'center',justifyContent:'center'},
  trail:{flexDirection:'row',justifyContent:'space-around',gap:8},node:{flex:1,maxWidth:52,height:48,borderRadius:20,borderWidth:1,alignItems:'center',justifyContent:'center'},
  card:{padding:16,borderRadius:28,borderWidth:1,gap:18},prompt:{fontSize:19,lineHeight:33,fontWeight:'600',textAlign:'center'},small:{fontSize:15,lineHeight:27,textAlign:'center'},
  primary:{minHeight:60,borderRadius:21,borderBottomWidth:5,paddingHorizontal:14,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},primaryText:{color:'#fff',fontSize:17,lineHeight:29,fontWeight:'700',flexShrink:1,textAlign:'center'},disabled:{opacity:0.4},
  choices:{flexDirection:'row',gap:10,justifyContent:'center'},choice:{flex:1,minHeight:84,maxWidth:120,borderRadius:24,alignItems:'center',justifyContent:'center'},glyph:{fontSize:43,lineHeight:72,fontWeight:'700'},picture:{flex:1,minHeight:125,borderRadius:24,padding:8,alignItems:'center',justifyContent:'center',gap:6},emoji:{fontSize:38},word:{fontSize:21,fontWeight:'700',textAlign:'center'},
  slots:{minHeight:86,borderRadius:22,borderWidth:2,borderStyle:'dashed',alignItems:'center',justifyContent:'center'},assembled:{fontSize:40,lineHeight:72,fontWeight:'700',writingDirection:'rtl'},secondary:{minHeight:48,borderRadius:18,alignItems:'center',justifyContent:'center',padding:10},board:{alignItems:'center'},keepsake:{padding:18,borderRadius:22,alignItems:'center',gap:8},
  letterGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center'},letterCell:{width:72,minHeight:84,borderWidth:2,borderRadius:23,alignItems:'center',justifyContent:'center'},tileTray:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center'},tile:{width:56,minHeight:72,borderRadius:20,alignItems:'center',justifyContent:'center'},
});
