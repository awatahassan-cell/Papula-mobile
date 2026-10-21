import { HelpHint } from '../../components/HelpButton';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { Ear, Eye, Layers, PencilLine, Puzzle, Volume2 } from 'lucide-react-native';
import { WORD_WRITING_TILE } from '../writing/writingText';
import { tileSet } from '../../theme/candy';
import { StartingSoundGame } from '../learning/StartingSoundGame';
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/RTLText';
import { SyllableBuilder } from '../learning/SyllableBuilder';
import { WordBuilder } from '../learning/WordBuilder';
import { LetterPractice } from '../learning/LetterPractice';
import { useResponsive } from '../../theme/responsive';
import { useAppStore } from '../../store/useAppStore';
import { learningStyles as baseLearningStyles } from '../learning/learningStyles';

export const MatchGameScreen: React.FC = () => {
  const s = useThemeStyles(baseLearningStyles);
  const { isNight } = useAppearance();
  const { registerBackHandler, setRoute } = useAppStore();
  const tiles = tileSet(isNight);
  const { tablet, pageMax } = useResponsive();
  const [mode, setMode] = useState<'menu' | 'word' | 'sound' | 'similar' | 'phonics' | 'syllables'>('menu');

  useEffect(() => {
    if (!registerBackHandler) return;
    if (mode !== 'menu') {
      registerBackHandler(() => {
        setMode('menu');
        return true;
      });
    } else {
      registerBackHandler(null);
    }
    return () => registerBackHandler(null);
  }, [mode, registerBackHandler]);

  if (mode === 'phonics') return <StartingSoundGame onExit={() => setMode('menu')} />;
  if (mode === 'syllables') return <SyllableBuilder onExit={() => setMode('menu')} />;
  if (mode === 'word') return <WordBuilder onExit={() => setMode('menu')} />;
  if (mode === 'sound' || mode === 'similar') return <LetterPractice mode={mode} onExit={() => setMode('menu')} />;

  return (
    <ScrollView contentContainerStyle={[s.container, { paddingTop: 8, paddingBottom: 12 }, tablet && { maxWidth: pageMax }]}><HelpHint text={sectionIntroductions['match-game']} />
      <View style={tablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : { gap: 10 }}>
        {([
          { mode: 'word', title: 'وشە دروست بکەم', hint: 'پیتەکان پێکەوە ببەستە', Icon: Puzzle },
          { mode: 'similar', title: 'پیتە هاوشێوەکان', hint: 'شێوە و خاڵەکان جیا بکەرەوە', Icon: Eye },
          { mode: 'syllables', title: 'بڕگەکان', hint: 'وشەکە بە بڕگە پێکەوە ببەستە', Icon: Layers },
          { mode: 'phonics', title: 'دەنگی سەرەتای وشە', hint: 'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە', Icon: Ear },
          { mode: 'sound', title: 'یاریی دەنگ', hint: 'گوێ بگرە و پیتەکە بدۆزەوە', Icon: Volume2 },
        ] as const).map((item, index) => {
          const candy = tiles[index % tiles.length];
          return (
            <TouchableOpacity
              key={item.mode}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={[
                candyCard.tile,
                tablet && { width: '48%' },
                { backgroundColor: candy.face, borderBottomColor: candy.lip },
              ]}
              onPress={() => setMode(item.mode)}
            >
              <View style={[candyCard.icon, { backgroundColor: candy.chip }]}>
                <item.Icon size={25} color={candy.icon} strokeWidth={2.3} />
              </View>
              <View style={candyCard.body}>
                <Text style={[candyCard.title, { color: candy.ink }]}>{item.title}</Text>
                <Text style={[candyCard.hint, { color: candy.ink }]}>{item.hint}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {(() => {
          const candy = tiles[5 % tiles.length];
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={WORD_WRITING_TILE.title}
              style={[candyCard.tile, tablet && { width: '48%' }, { backgroundColor: candy.face, borderBottomColor: candy.lip }]}
              onPress={() => setRoute('word-writing')}
            >
              <View style={[candyCard.icon, { backgroundColor: candy.chip }]}>
                <PencilLine size={25} color={candy.icon} strokeWidth={2.3} />
              </View>
              <View style={candyCard.body}>
                <Text style={[candyCard.title, { color: candy.ink }]}>{WORD_WRITING_TILE.title}</Text>
                <Text style={[candyCard.hint, { color: candy.ink }]}>{WORD_WRITING_TILE.hint}</Text>
              </View>
            </TouchableOpacity>
          );
        })()}
      </View>
    </ScrollView>
  );
};

// Macaron tiles shared with the home screen: soft colour, dark ink, a darker lip that sinks when pressed.
const candyCard = StyleSheet.create({
  tile: { minHeight: 72, borderRadius: 24, borderBottomWidth: 4, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, color: '#ffffff', textAlign: 'right' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, color: '#ffffff', textAlign: 'right', marginTop: 1 },
});
