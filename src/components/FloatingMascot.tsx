import React,{useEffect,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Image,Platform,View} from 'react-native';
import {gardenMascot} from './GardenArtwork';
import {useAppearance} from '../theme/useAppearance';

export function FloatingMascot({size}:{size:number}){
 const {colors}=useAppearance();
 const [motion]=useState(()=>new Animated.Value(0));
 useEffect(()=>{
  let active=true,animation:Animated.CompositeAnimation|undefined;
  const sync=(reduced:boolean)=>{
   if(!active)return;
   animation?.stop();motion.setValue(0);
   if(reduced)return;
   const config={duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web',isInteraction:false};
   animation=Animated.loop(Animated.sequence([Animated.timing(motion,{...config,toValue:-7}),Animated.timing(motion,{...config,toValue:0})]));
   animation.start();
  };
  void AccessibilityInfo.isReduceMotionEnabled().then(sync).catch(()=>{});
  const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',sync);
  return()=>{active=false;animation?.stop();subscription.remove();};
 },[motion]);
 return <View accessible={false} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
  <View style={{position:'absolute',width:size*.86,height:size*.86,borderRadius:size/2,backgroundColor:colors.sky}}/>
  <View style={{position:'absolute',width:size*.35,height:size*.35,borderRadius:size*.2,backgroundColor:colors.peach,bottom:0,right:0}}/>
  <Animated.View testID="home-mascot" style={{width:size,height:size,zIndex:2,transform:[{translateY:motion},{rotate:motion.interpolate({inputRange:[-7,0],outputRange:['-2deg','2deg']})}]}}><Image source={gardenMascot} accessible={false} resizeMode="contain" style={{width:size,height:size,zIndex:1}}/></Animated.View>
 </View>;
}
