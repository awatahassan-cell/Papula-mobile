import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/RTLText';
import { HelpHint } from '../../components/HelpButton';
import { useAppStore } from '../../store/useAppStore';
import { mockLetters } from '../../data/mockLetters';
import { useAppearance } from '../../theme/useAppearance';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { SharedGarden } from './SharedGarden';
export function GardenCollectionScreen() {
  const {currentProfile,setSelectedLetter,setRoute}=useAppStore();
  const {colors:c}=useAppearance();
  return <ScrollView contentContainerStyle={s.page}>
    <HelpHint text={sectionIntroductions.garden}/>
    <Text style={[s.title,{color:c.ink}]}>باغەکەم</Text>
    <Text style={[s.hint,{color:c.muted}]}>هەموو گوڵەکانت لێرە پێکەوەن. هەر گوڵێک یادگاریی گەشتێکە.</Text>
    <SharedGarden profile={currentProfile} onOpen={id=>{const letter=mockLetters.find(item=>item.id===id);if(letter){setSelectedLetter(letter);setRoute('garden-quest');}}}/>
  </ScrollView>;
}
const s=StyleSheet.create({page:{width:'100%',maxWidth:680,alignSelf:'center',padding:18,paddingBottom:30,gap:14},title:{fontSize:27,lineHeight:43,fontWeight:'700'},hint:{fontSize:15,lineHeight:27}});
