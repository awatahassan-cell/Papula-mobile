import React, { memo, useContext, useEffect, useState } from 'react';
import { Animated, AppState, Easing, Platform, StyleSheet, View } from 'react-native';
import { NavigationContext } from 'expo-router/react-navigation';
import { SvgXml } from 'react-native-svg';
import { pictureFor } from '../art/pictures';
import { CHARACTER_LAYERS } from '../art/characters';
import { useReducedMotion } from './Motion';

/** SVG art at every size; decorative motion uses the native driver and stops off-screen. */
export const CharacterPicture=memo(function CharacterPicture({symbol,size=64,animate=true}:{symbol:string;size?:number;animate?:boolean}) {
  const reduced=useReducedMotion();
  const navigation=useContext(NavigationContext);
  const [value]=useState(()=>new Animated.Value(0));
  const layer=CHARACTER_LAYERS[symbol.replace(/️/g,'').trim()];
  const xml=pictureFor(symbol);
  useEffect(()=>{
    let loop:Animated.CompositeAnimation|undefined;
    const stop=()=>{loop?.stop();value.setValue(0);};
    const start=()=>{stop();if(reduced||!animate||size<56)return;const config={duration:layer?.motion==='flap'?700:1500,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web',isInteraction:false};loop=Animated.loop(Animated.sequence([Animated.timing(value,{...config,toValue:1}),Animated.timing(value,{...config,toValue:0})]));loop.start();};
    const resume=()=>{if(AppState.currentState==='active'&&(!navigation||navigation.isFocused()))start();};
    resume();
    const focus=navigation?.addListener('focus',resume),blur=navigation?.addListener('blur',stop);
    const sub=AppState.addEventListener('change',state=>state==='active'?resume():stop());
    return()=>{sub.remove();focus?.();blur?.();stop();};
  },[animate,layer,navigation,reduced,size,value]);
  if(!xml)return null;
  const transform=layer?.motion==='flap'?[{scaleX:value.interpolate({inputRange:[0,1],outputRange:[1,.84]})}]:layer?.motion==='step'?[{translateY:value.interpolate({inputRange:[0,1],outputRange:[0,-size*.014]})}]:[{rotate:value.interpolate({inputRange:[0,1],outputRange:['0deg',layer?'3deg':'1.5deg']})}];
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no" style={{width:size,height:size}}>
    <Animated.View style={[StyleSheet.absoluteFill,{transform}]}><SvgXml xml={layer?.moving||xml} width={size} height={size}/></Animated.View>
    {layer&&<SvgXml xml={layer.front} width={size} height={size} style={StyleSheet.absoluteFill}/>}
  </View>;
});
