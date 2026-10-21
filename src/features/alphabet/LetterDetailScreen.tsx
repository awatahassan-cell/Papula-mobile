import { BackButton } from '../../components/BackButton';
import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/RTLText';
import { useAppStore } from '../../store/useAppStore';
import { GuidedLetterLesson } from './GuidedLetterLesson';
export const LetterDetailScreen: React.FC = () => {
  const {selectedLetter,setRoute}=useAppStore();
  if(selectedLetter)return <GuidedLetterLesson key={selectedLetter.id} letter={selectedLetter} />;
  return <View><Text>تکایە سەرەتا پیتێک هەڵبژێرە</Text><BackButton onPress={()=>setRoute('alphabet')} fullWidth>گەڕانەوە بۆ ئەلفوبێ</BackButton></View>;
};
