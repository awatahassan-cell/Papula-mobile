import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Text as SvgText } from 'react-native-svg';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { PapulaMascot } from '../../components/PapulaMascot';
import { useAppearance } from '../../theme/useAppearance';
import { plantedGardenFlowers } from '../../services/gardenQuest';
import { ChildProfile } from '../../services/types';
import { accentFill } from '../../theme/appearance';

const petals=['#ff91b9','#ffe17b','#bf9af9','#ffab7c','#8cdcea','#f69fdc'];
/** One continuous meadow: every saved flower has a visible, labelled bloom. */
export function SharedGarden({profile,onOpen,onPlant}:{profile:ChildProfile;onOpen?:(letterId:string)=>void;onPlant?:()=>void}) {
  const {colors:c,isNight}=useAppearance();
  const flowers=plantedGardenFlowers(profile);
  return <View testID="shared-garden" style={[s.garden,{backgroundColor:isNight?'#183c35':'#def3b5',borderColor:c.edge}]}>
    <View style={[s.sky,{backgroundColor:isNight?'#193957':'#ccf0ff'}]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none" pointerEvents="none">
        <Circle cx="49" cy="34" r="20" fill="#ffe28a"/>
        <Path d="M230 37 Q226 18 243 21 Q254 5 268 23 Q291 17 291 38Z" fill="#ffffff" opacity=".8"/>
        <Path d="M0 94 Q110 48 220 88 Q318 54 400 85 V110 H0Z" fill={isNight?'#29634a':'#9fd57f'}/>
        <Path d="M0 107 Q94 77 190 103 Q288 73 400 99 V110 H0Z" fill={isNight?'#183c35':'#def3b5'}/>
      </Svg>
      <View pointerEvents="none" style={s.mascot}><PapulaMascot size={72} mood="happy"/></View>
      <View style={[s.count,{backgroundColor:c.paper}]}><Text style={[s.countText,{color:c.ink}]}>{flowers.length} گوڵ</Text></View>
    </View>
    <View style={s.field}>
      {flowers.map((letter,index)=>{
        const bloom=<Svg width="100%" height={96} viewBox="0 0 72 96" pointerEvents="none">
          <Ellipse cx="36" cy="87" rx="22" ry="5" fill={isNight?'#102e27':'#a9cb7e'}/>
          <Path d="M36 85 V40" stroke={isNight?'#99cf8b':'#3d864c'} strokeWidth="4" strokeLinecap="round"/>
          <Ellipse cx="26" cy="68" rx="12" ry="5" fill="#70b976" transform="rotate(25 26 68)"/>
          <Ellipse cx="46" cy="76" rx="12" ry="5" fill="#70b976" transform="rotate(-25 46 76)"/>
          {Array.from({length:6},(_,i)=><Circle key={i} cx={36+16*Math.cos(i*Math.PI/3)} cy={31+16*Math.sin(i*Math.PI/3)} r="11" fill={petals[index%petals.length]}/>)}
          <Circle cx="36" cy="31" r="15" fill="#fff4c1"/>
          <SvgText x="36" y="38" textAnchor="middle" fontFamily="IBMPlexSansArabic_700Bold" fontSize={letter.glyph.length>1?16:21} fill="#3e4324">{letter.glyph}</SvgText>
        </Svg>;
        return onOpen?<TactileButton key={letter.id} testID={`garden-flower-${letter.id}`} accessibilityRole="button" accessibilityLabel={`گوڵی پیتی ${letter.name}`} onPress={()=>onOpen(letter.id)} style={s.flower}>{bloom}</TactileButton>:<View key={letter.id} testID={`garden-flower-${letter.id}`} accessible accessibilityLabel={`گوڵی پیتی ${letter.name}`} style={s.flower}>{bloom}</View>;
      })}
      {!flowers.length&&<View style={s.empty}><Text style={[s.emptyText,{color:c.ink}]}>باغەکەت چاوەڕێی یەکەم گوڵەکەتە 🌱</Text></View>}
    </View>
    {onPlant&&<TactileButton accessibilityRole="button" accessibilityLabel="گوڵەکەم لە باغەکەم بچێنم" onPress={onPlant} style={[s.plant,{backgroundColor:accentFill(c,isNight),borderBottomColor:c.mintDark}]}><Text style={s.plantText}>گوڵەکەم لە باغەکەم بچێنم 🌸</Text></TactileButton>}
  </View>;
}
const s=StyleSheet.create({garden:{width:'100%',borderWidth:2,borderRadius:28,overflow:'hidden'},sky:{height:110},mascot:{position:'absolute',right:20,top:6},count:{position:'absolute',left:15,bottom:17,borderRadius:15,paddingHorizontal:12,paddingVertical:6},countText:{fontSize:16,fontWeight:'700'},field:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:8,paddingBottom:12,minHeight:112},flower:{width:'20%',height:100,alignItems:'center',justifyContent:'center'},empty:{minHeight:112,width:'100%',alignItems:'center',justifyContent:'center',padding:14},emptyText:{fontSize:17,lineHeight:29,textAlign:'center'},plant:{margin:12,minHeight:58,borderRadius:21,borderBottomWidth:5,padding:12,alignItems:'center',justifyContent:'center'},plantText:{fontSize:17,lineHeight:29,fontWeight:'700',color:'#fff',textAlign:'center'}});
