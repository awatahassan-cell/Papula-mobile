import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArrowLeft, Sprout } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { useAppStore } from '../../store/useAppStore';
import { gardenProgress } from '../../services/gardenQuest';
import { useAppearance } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { soundService } from '../../services/soundService';
import { SharedGarden } from './SharedGarden';
import { mockLetters } from '../../data/mockLetters';
import { nextLessonLetter } from '../../services/lessonPath';

export function GardenQuestCard() {
  const {currentProfile,setRoute,setSelectedLetter}=useAppStore();
  const {colors:c,isNight}=useAppearance();
  const flowers=mockLetters.filter(letter=>gardenProgress(currentProfile,letter.id).flowerSpot!==undefined);
  const current=nextLessonLetter(currentProfile);
  const next=current||mockLetters[mockLetters.length-1];

  return <View testID="garden-quest-card" style={[s.card,{backgroundColor:c.paper,borderColor:c.edge}]}>
    <View style={s.heading}><View style={s.flex}><Text style={[s.kicker,{color:c.mint}]}>٣٤ گەشت · ٣٤ گوڵ</Text><Text style={[s.title,{color:c.ink}]}>{current?`گەشتی پیتی «${next.glyph}»`:'هەموو گەشتەکانت تەواو کرد!'}</Text></View><Sprout size={28} color={c.mint}/></View>

    <Text style={{color:c.muted,textAlign:'center'}}>{flowers.length} لە ٣٤ گوڵ ڕواون</Text>
    <TactileButton accessibilityRole="button" accessibilityLabel={`بەردەوامبوون لە گەشتی پیتی ${next.name}`} onPress={()=>{void soundService.stopSpeaking();if(current){setSelectedLetter(next);setRoute('garden-quest');}else setRoute('garden');}} style={[s.cta,{backgroundColor:accentFill(c,isNight),borderBottomColor:c.mintDark}]}><Text style={s.label}>{current?'بەردەوام بین':'باغەکەم ببینم'}</Text><ArrowLeft size={24} color="#fff"/></TactileButton>
    <SharedGarden profile={currentProfile}/>
  </View>;
}
const s=StyleSheet.create({flowers:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center'},flower:{width:56,minHeight:64,borderRadius:18,alignItems:'center',justifyContent:'center'},card:{width:'100%',maxWidth:620,alignSelf:'center',padding:14,gap:14,borderRadius:30,borderWidth:1},heading:{flexDirection:'row',alignItems:'center',gap:10},flex:{flex:1,minWidth:0},kicker:{fontSize:12,fontWeight:'700'},title:{fontSize:21,lineHeight:36,fontWeight:'700'},cta:{minHeight:60,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,borderBottomWidth:5,borderRadius:22,padding:10},label:{fontSize:18,lineHeight:31,fontWeight:'700',color:'#fff',flexShrink:1,textAlign:'center'}});
