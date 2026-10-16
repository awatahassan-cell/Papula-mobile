import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../components/RTLText';
import { LearningPath } from '../../components/LearningPath';
import { useAppStore } from '../../store/useAppStore';
import { lessonPath } from '../../services/lessonPath';
import { useThemeStyles } from '../../theme/useAppearance';
import { gardenColors as c } from '../../theme/appearance';
import { useResponsive } from '../../theme/responsive';
import { learningLayout } from '../../theme/layout';
export const AlphabetGridScreen: React.FC = () => {
  const s=useThemeStyles(baseStyles);
  const { currentProfile } = useAppStore();
  const { width } = useWindowDimensions();
  const { pageMax } = useResponsive();
  const completed = lessonPath(currentProfile).filter(node => node.status === 'completed').length;
  return <ScrollView contentContainerStyle={[s.container, { paddingHorizontal: learningLayout(width).padding, maxWidth: pageMax }]}><View style={s.progress}><Text style={s.title}>{completed} لە ٣٤ وانە تەواو کراوە</Text><Text style={s.hint}>یەک پیت، چەند هەنگاوێکی خۆش 🌱</Text></View><LearningPath /></ScrollView>;
};
const baseStyles = StyleSheet.create({container:{width:'100%',maxWidth:840,alignSelf:'center',paddingBottom:24},progress:{padding:16,borderRadius:22,backgroundColor:'#fff',gap:4},title:{fontFamily:'IBMPlexSansArabic_700Bold',color:c.mint,fontSize:17},hint:{fontFamily:'IBMPlexSansArabic_400Regular',color:c.muted,fontSize:13}});
