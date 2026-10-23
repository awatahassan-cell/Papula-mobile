import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Gift, Award, Flower2, Lock } from 'lucide-react-native';
import { BackButton } from '../../components/BackButton';
import { TactileButton } from '../../components/TactileButton';
import { Text } from '../../components/RTLText';
import { HelpHint } from '../../components/HelpButton';
import { BadgesComponent } from '../../components/BadgesComponent';
import { mockStickers } from '../../data/mockStickers';
import { soundService } from '../../services/soundService';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance } from '../../theme/useAppearance';
import { GardenContents } from '../garden/GardenScreen';
const tabs=[{id:'stickers',label:'ستیکەر',Icon:Gift},{id:'butterflies',label:'پەپوولە',Icon:Flower2},{id:'badges',label:'نیشانە',Icon:Award}] as const;
export function StickersAlbumScreen() {
  const {colors:c}=useAppearance();
  const {currentProfile,setRoute}=useAppStore();
  const [active,setActive]=useState<typeof tabs[number]['id']>('stickers');
  return <ScrollView contentContainerStyle={s.page}>
    <HelpHint text={sectionIntroductions.stickers}/>
    <Text style={[s.title,{color:c.ink}]}>ئەلبوومەکەم 📖</Text>
    <Text style={[s.hint,{color:c.muted}]}>یادگارییە جوانەکانی گەشتەکەت لێرەن.</Text>
    <View accessibilityRole="tablist" style={[s.tabs,{backgroundColor:c.lavender}]}>{tabs.map(({id,label,Icon})=><TactileButton key={id} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{selected:active===id}} onPress={()=>{void soundService.stopSpeaking();setActive(id);}} style={[s.tab,active===id&&{backgroundColor:c.paper}]}><Icon size={26} color={c.mint}/><Text style={[s.tabText,{color:c.ink}]}>{label}</Text></TactileButton>)}</View>
    {active==='butterflies'?<GardenContents key={currentProfile.id} section="collection" embedded/>:active==='badges'?<BadgesComponent/>:<View style={s.grid}>{mockStickers.map(sticker=>{
      const open=currentProfile.unlockedStickerIds.includes(sticker.id)||currentProfile.stars>=sticker.unlockedAtStars;
      return <TactileButton key={sticker.id} accessibilityRole="button" accessibilityLabel={open?sticker.nameKu:`${sticker.nameKu}، ${sticker.unlockedAtStars} ئەستێرە`} onPress={()=>{soundService.playPop();if(open)void soundService.speakWord(sticker.nameKu);}} style={[s.cell,{backgroundColor:c.paper,borderColor:open?c.mint:c.edge},!open&&{opacity:0.6}]}>
        {open?<Text style={s.emoji}>{sticker.emoji}</Text>:<Lock size={38} color={c.muted}/>}
        <Text style={[s.name,{color:c.ink}]}>{sticker.nameKu}</Text>
        {!open&&<Text style={[s.hint,{color:c.muted}]}>{sticker.unlockedAtStars} ⭐</Text>}
      </TactileButton>;
    })}</View>}
    <BackButton fullWidth onPress={()=>setRoute('garden')}>گەڕانەوە بۆ باغەکەم</BackButton>
  </ScrollView>;
}
const s=StyleSheet.create({page:{width:'100%',maxWidth:680,alignSelf:'center',padding:18,paddingBottom:32,gap:16},title:{fontSize:25,lineHeight:42,fontWeight:'700'},hint:{fontSize:14,lineHeight:26},tabs:{flexDirection:'row',gap:6,padding:6,borderRadius:24},tab:{flex:1,minHeight:74,borderRadius:20,gap:6,alignItems:'center',justifyContent:'center',padding:6},tabText:{fontSize:14,fontWeight:'700'},grid:{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'space-between'},cell:{width:'48%',minHeight:145,borderWidth:2,borderRadius:25,padding:14,gap:8,alignItems:'center',justifyContent:'center'},emoji:{fontSize:47},name:{fontSize:16,lineHeight:28,fontWeight:'700',textAlign:'center'}});
