import { TactileButton as TouchableOpacity } from './TactileButton';
import { GOLD } from '../theme/tokens';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Settings, Square, Star } from 'lucide-react-native';
import { BackButton } from './BackButton';
import { Text } from './RTLText';
import { PapulaMascot } from './PapulaMascot';
import { HelpPill } from './HelpButton';
import { useAppStore, MAIN_TABS } from '../store/useAppStore';
import { kurdishDigits } from '../services/rewards';
import { soundService } from '../services/soundService';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
import { useResponsive } from '../theme/responsive';
export const TopHeader: React.FC = () => {
  const s=useThemeStyles(baseStyles);
  const {colors:c}=useAppearance();
  const {route,setRoute,goBack,currentProfile,openParentGateWithCallback}=useAppStore();
  const {tablet,pageMax,width}=useResponsive();
  const [speaking,setSpeaking]=useState(false);
  useEffect(()=>soundService.subscribe(value=>setSpeaking(value)),[]);
  if(route==='home')return null; // the home screen has its own greeting row
  return <View style={[s.frame,{backgroundColor:'transparent'}]}><View style={[s.header,{maxWidth:pageMax}]}>
    <View style={s.topRow}>
      {!MAIN_TABS.includes(route) && <BackButton onPress={goBack} />}
      <HelpPill />
      {tablet && <TouchableOpacity accessibilityRole="button" accessibilityLabel="پەپوولە، سەرەتا" style={[s.brand,{flex:0,minWidth:width<900?130:150}]} onPress={()=>{void soundService.stopSpeaking();setRoute('home');}}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><PapulaMascot size={30}/><Text numberOfLines={1} style={s.brandText}>پەپوولە</Text></View></TouchableOpacity>}
      {!tablet && <>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`ئەلبوومەکەم، ${currentProfile.stars} ئەستێرە`} style={[s.stat,{flex:0,minWidth:width<360?64:76,backgroundColor:GOLD.soft,borderWidth:2,borderColor:GOLD.border}]} onPress={()=>setRoute('stickers')}><Star size={17} color={GOLD.starInk} fill={GOLD.star}/><Text style={[s.statText,{color:GOLD.ink}]}>{kurdishDigits(currentProfile.stars)}</Text></TouchableOpacity>
        <View style={{flex:1}}/>
      </>}
      {tablet && <View style={[s.stats,s.statsInline,width<900&&{minWidth:280}]}><TouchableOpacity accessibilityRole="button" accessibilityLabel="ئەلبوومەکەم" style={s.profile} onPress={()=>setRoute('stickers')}><Text style={s.avatar}>{currentProfile.avatar}</Text><Text numberOfLines={1} style={s.name}>{currentProfile.name}</Text></TouchableOpacity><View style={[s.stat,{backgroundColor:GOLD.soft,borderWidth:2,borderColor:GOLD.border}]}><Star size={17} color={GOLD.starInk} fill={GOLD.star}/><Text style={[s.statText,{color:GOLD.ink}]}>{kurdishDigits(currentProfile.stars)}</Text></View></View>}
      {tablet && <View style={{flex:1}}/>}
      {speaking && <TouchableOpacity accessibilityRole="button" accessibilityLabel="وەستاندنی دەنگ" style={s.icon} onPress={()=>void soundService.stopSpeaking()}><Square size={19} color={c.coral}/></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="ڕێکخستنەکانی دایک و باوک" style={s.icon} onPress={()=>openParentGateWithCallback(()=>setRoute('parent-dashboard'))}><Settings size={21} color={c.muted}/></TouchableOpacity>
    </View>
  </View></View>;
};
const baseStyles=StyleSheet.create({frame:{backgroundColor:c.background,borderBottomWidth:1,borderColor:c.edge},header:{width:'100%',maxWidth:840,alignSelf:'center',paddingHorizontal:14,paddingVertical:8,gap:8},topRow:{flexDirection:'row',alignItems:'center',gap:6},brand:{flex:1,minWidth:0,minHeight:44,justifyContent:'center'},brandText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:24,color:c.ink},leaf:{fontSize:21},icon:{width:44,height:44,borderRadius:16,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},stats:{flexDirection:'row',gap:8},statsInline:{flex:0,minWidth:340,height:44,alignItems:'center'},profile:{flex:2,minWidth:0,minHeight:38,flexDirection:'row',alignItems:'center',gap:7},avatar:{fontSize:24},name:{flex:1,fontFamily:'IBMPlexSansArabic_600SemiBold',fontSize:13,color:c.muted},starStat:{backgroundColor:GOLD.soft,borderWidth:2,borderColor:GOLD.border},starText:{color:GOLD.ink},stat:{flex:1,minHeight:36,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',backgroundColor:'#fff',borderRadius:16,paddingHorizontal:8},statText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:13,color:c.ink}});
