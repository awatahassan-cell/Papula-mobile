import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Shapes, BookOpen, Pencil, Puzzle, Sprout } from 'lucide-react-native';
import { Text } from './RTLText';
import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import { gardenColors as c } from '../theme/appearance';
export const gardenMascot = require('../../assets/themes/garden/mascot.png');
export type GardenActivity = 'alphabet' | 'stories' | 'writing' | 'games';
const icons={alphabet:Shapes,stories:BookOpen,writing:Pencil,games:Puzzle};

export function GardenActivityArt({activity,size=100}:{activity:GardenActivity;size?:number}){
 const {colors:c}=useAppearance();const colors={alphabet:c.peach,stories:c.lavender,writing:c.sky,games:c.leaf};
 const {width}=useWindowDimensions();const side=Math.min(size,width*0.23);const Icon=icons[activity];
 return <View accessible={false} style={{width:side,aspectRatio:1,borderRadius:side*0.3,backgroundColor:colors[activity],alignItems:'center',justifyContent:'center'}}><Icon size={side*0.55} color={c.mint} strokeWidth={1.7}/></View>;
}
export function GardenSection({title,subtitle}:{title:string;subtitle?:string}){
 const s=useThemeStyles(baseStyles);const {colors:c}=useAppearance();
 return <View style={s.section}><View style={s.icon}><Sprout size={23} color={c.mint}/></View><View style={s.copy}><Text style={s.title}>{title}</Text>{subtitle&&<Text style={s.subtitle}>{subtitle}</Text>}</View></View>;
}
const baseStyles=StyleSheet.create({section:{width:'100%',flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12},icon:{width:46,height:46,borderRadius:20,backgroundColor:'#e6f3ea',alignItems:'center',justifyContent:'center'},copy:{flex:1,minWidth:0},title:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:23,color:c.ink},subtitle:{fontFamily:'IBMPlexSansArabic_400Regular',fontSize:13,lineHeight:23,color:c.muted}});
