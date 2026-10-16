import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/RTLText';
import { BigButton } from '../../components/BigButton';
import { useAppStore } from '../../store/useAppStore';
import { GuidedLetterLesson } from './GuidedLetterLesson';
export const LetterDetailScreen: React.FC = () => {
  const {selectedLetter,setRoute}=useAppStore();
  if(selectedLetter)return <GuidedLetterLesson key={selectedLetter.id} letter={selectedLetter} />;
  return <View><Text>تکایە سەرەتا پیتێک هەڵبژێرە</Text><BigButton onPress={()=>setRoute('alphabet')}>گەڕانەوە بۆ ئەلفوبێ</BigButton></View>;
};
