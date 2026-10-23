import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/RTLText';
import { HelpHint } from '../../components/HelpButton';
import { useAppStore } from '../../store/useAppStore';
import { mockLetters } from '../../data/mockLetters';
import { useAppearance } from '../../theme/useAppearance';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { SharedGarden } from './SharedGarden';
import { TactileButton } from '../../components/TactileButton';
import { GardenContents } from '../garden/GardenScreen';

export function GardenCollectionScreen() {
  const {currentProfile,setSelectedLetter,setRoute}=useAppStore();
  const {colors:c}=useAppearance();
  return <ScrollView contentContainerStyle={s.page}>
    <HelpHint text={sectionIntroductions.garden}/>
    <Text style={[s.title,{color:c.ink}]}>باغەکەم</Text>
    <Text style={[s.hint,{color:c.muted}]}>بە فێربوون، باغەکەت جوانتر دەبێت و هاوڕێکەت گەورە دەبێت.</Text>
    <SharedGarden profile={currentProfile} onOpen={id=>{const letter=mockLetters.find(item=>item.id===id);if(letter){setSelectedLetter(letter);setRoute('garden-quest');}}}/>
    <GardenContents key={currentProfile.id} section="companion" embedded/>
    <TactileButton accessibilityRole="button" accessibilityLabel="ئەلبوومەکەم" onPress={()=>setRoute('stickers')} style={{backgroundColor:c.paper,borderColor:c.edge,borderWidth:1,borderRadius:24,padding:16,alignItems:'center',gap:8}}>
      <Text style={{fontSize:30}}>📖 🦋</Text><Text style={[s.hint,{color:c.ink}]}>ئەلبوومەکەم</Text>
    </TactileButton>
  </ScrollView>;
}
const s=StyleSheet.create({page:{width:'100%',maxWidth:680,alignSelf:'center',padding:18,paddingBottom:30,gap:14},title:{fontSize:27,lineHeight:43,fontWeight:'700'},hint:{fontSize:15,lineHeight:27}});
