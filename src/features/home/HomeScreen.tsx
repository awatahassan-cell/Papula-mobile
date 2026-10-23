import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Settings, Star } from 'lucide-react-native';
import { HelpPill } from '../../components/HelpButton';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { GardenQuestCard } from '../adventure/GardenQuestCard';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance } from '../../theme/useAppearance';
import { GOLD } from '../../theme/tokens';

export const HomeScreen: React.FC = () => {
  const {colors:c}=useAppearance();
  const {currentProfile,setRoute,openParentGateWithCallback}=useAppStore();
  return <ScrollView contentContainerStyle={s.page}>
    <View style={s.header}>
      <View style={s.flex}><Text style={[s.brand,{color:c.mint}]}>پەپوولە</Text></View>
      <HelpPill/>
      <View accessible accessibilityLabel={`${currentProfile.stars} ئەستێرە`} style={s.stars}><Star size={19} color={GOLD.ink}/><Text style={s.starCount}>{currentProfile.stars}</Text></View>
      <TactileButton accessibilityRole="button" accessibilityLabel="ڕێکخستنەکانی دایک و باوک" onPress={()=>openParentGateWithCallback(()=>setRoute('parent-dashboard'))} style={[s.settings,{backgroundColor:c.paper}]}><Settings size={23} color={c.muted}/></TactileButton>
    </View>
    <Text testID="home-greeting" style={[s.greeting,{color:c.ink}]}>سڵاو {currentProfile.name}!</Text>
    <GardenQuestCard/>
  </ScrollView>;
};
const s=StyleSheet.create({page:{width:'100%',maxWidth:660,alignSelf:'center',padding:17,paddingBottom:28,gap:16},header:{flexDirection:'row',alignItems:'center',gap:8},flex:{flex:1,minWidth:0},brand:{fontSize:25,fontWeight:'700'},greeting:{fontSize:23,lineHeight:38,fontWeight:'700'},settings:{width:44,height:44,borderRadius:17,alignItems:'center',justifyContent:'center'},stars:{minHeight:44,flexDirection:'row',gap:6,alignItems:'center',paddingHorizontal:9,backgroundColor:GOLD.soft,borderRadius:16},starCount:{fontSize:15,color:GOLD.ink,fontWeight:'700'}});
