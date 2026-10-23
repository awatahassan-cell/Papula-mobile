import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { PapulaMascot } from '../../components/PapulaMascot';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { useAppearance } from '../../theme/useAppearance';

export function GardenScene({ progress = 0, flowerSpot, onPlant }: { progress?: number; flowerSpot?: number; onPlant?: (spot: number) => void }) {
  const {isNight, colors} = useAppearance();
  return <View style={[s.scene, {backgroundColor: isNight ? '#153d59' : '#c9efff', borderColor: colors.edge, direction: 'ltr'}]}>
    <Svg accessible accessibilityRole="image" accessibilityLabel="باغی پەپوولە، پرد و سێ شوێنی گوڵ" width="100%" height="100%" viewBox="0 0 340 240" preserveAspectRatio="none">
      <Circle cx="49" cy="40" r="22" fill={isNight ? '#fff2bd' : '#ffda58'} />
      <Path d="M204 48 C204 33 221 29 231 38 C245 22 265 32 263 45 C286 44 286 61 273 62 H207 C194 62 193 51 204 48" fill={isNight ? '#b9dce5' : '#fff'} opacity=".86" />
      <Path d="M0 132 Q80 88 172 135 Q262 95 340 135 V240 H0Z" fill={isNight ? '#286854' : '#8cdb8e'} />
      <Path d="M0 182 Q100 142 199 174 Q285 144 340 173 V240 H0Z" fill={isNight ? '#1e5148' : '#57ba80'} />
      <Path d="M180 132 Q123 155 185 183 Q225 210 175 240 H231 Q274 202 224 174 Q180 151 219 132Z" fill={isNight ? '#458ca9' : '#77d6f1'} />
      <Path d="M142 172 L239 172" stroke="#8b6440" strokeWidth="7" strokeLinecap="round" />
      {Array.from({length: 4}, (_, i) => <Rect key={i} x={147 + i * 23} y="166" width="20" height="19" rx="4" fill={i < progress ? '#ffda78' : '#b6a47c'} />)}
      <Path d="M66 152 V100" stroke="#795b40" strokeWidth="12" strokeLinecap="round" />
      <Circle cx="49" cy="94" r="23" fill="#379d78" /><Circle cx="78" cy="91" r="28" fill="#47ba83" /><Circle cx="65" cy="68" r="24" fill="#75cf85" />
      <Circle cx="77" cy="78" r="5" fill="#ffda78" /><Circle cx="49" cy="95" r="4" fill="#ff98bc" />
      {[62,170,278].map((x,i) => <React.Fragment key={x}>
        <Ellipse cx={x} cy="220" rx="30" ry="9" fill="#40784b" />
        {flowerSpot === i && <>
          <Path d={`M${x} 218 V190`} stroke="#d4f48b" strokeWidth="5" strokeLinecap="round" />
          <Ellipse cx={x + 8} cy="207" rx="11" ry="5" fill="#d4f48b" transform={`rotate(-25 ${x+8} 207)`} />
          {Array.from({length:5},(_,j)=><Circle key={j} cx={x+12*Math.cos(j*Math.PI*2/5)} cy={186+12*Math.sin(j*Math.PI*2/5)} r="9" fill="#ff92bb" />)}
          <Circle cx={x} cy="186" r="8" fill="#ffdf64" />
        </>}
      </React.Fragment>)}
    </Svg>
    <View pointerEvents="none" style={s.mascot}><PapulaMascot size={100} mood="happy" /></View>
    {onPlant && flowerSpot === undefined && <View style={[s.spots,{direction:'ltr'}]}>{[0,1,2].map(spot => <TactileButton key={spot} accessibilityRole="button" accessibilityLabel={`گوڵەکەم لە شوێنی ${spot+1} بڕوێنە`} onPress={() => onPlant(spot)} style={s.spot}><Text style={s.plus}>+</Text></TactileButton>)}</View>}
  </View>;
}
const s=StyleSheet.create({
  scene:{width:'100%',aspectRatio:340/240,borderRadius:30,borderWidth:2,overflow:'hidden'},
  mascot:{position:'absolute',right:'8%',top:'22%'},
  spots:{position:'absolute',left:0,right:0,bottom:4,flexDirection:'row',justifyContent:'space-around'},
  spot:{width:48,height:48,borderRadius:24,backgroundColor:'#fff8db',borderBottomWidth:4,borderBottomColor:'#c5a968',alignItems:'center',justifyContent:'center'},
  plus:{fontSize:29,lineHeight:35,color:'#365940'},
});
