import { HelpHint } from '../../components/HelpButton';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { Ear, Eye, Layers, PencilLine, Shapes, Compass, Puzzle, Volume2 } from 'lucide-react-native';
import { WORD_WRITING_TILE } from '../writing/writingText';
import { QuestGame } from '../quests/QuestGame';
import { QUEST_TILE } from '../quests/questText';
import { VocabularyGame } from '../vocabulary/VocabularyGame';
import { VOCAB_TILE } from '../vocabulary/vocabText';
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
import { soundService } from '../../services/soundService';
import { learningStyles as baseLearningStyles } from '../learning/learningStyles';

type GameMode = 'word' | 'sound' | 'similar' | 'phonics' | 'syllables' | 'vocab' | 'quests';

const GAME_SECTIONS = [
  {
    level: '⭐ ئاستی ١ — گوێ بگرە و بناسەوە',
    items: [
      { id: 'sound' as const, title: 'یاریی دەنگ', hint: 'گوێ بگرە و پیتەکە بدۆزەوە', Icon: Volume2 },
      { id: 'phonics' as const, title: 'دەنگی سەرەتای وشە', hint: 'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە', Icon: Ear },
      { id: 'similar' as const, title: 'پیتە هاوشێوەکان', hint: 'شێوە و خاڵەکان جیا بکەرەوە', Icon: Eye },
    ],
  },
  {
    level: '⭐⭐ ئاستی ٢ — بڕگە و وشە دروست بکە',
    items: [
      { id: 'syllables' as const, title: 'بڕگەکان', hint: 'وشەکە بە بڕگە پێکەوە ببەستە', Icon: Layers },
      { id: 'word' as const, title: 'وشە دروست بکەم', hint: 'پیتەکان پێکەوە ببەستە', Icon: Puzzle },
      { id: 'vocab' as const, title: VOCAB_TILE.title, hint: VOCAB_TILE.hint, Icon: Shapes },
    ],
  },
  {
    level: '⭐⭐⭐ ئاستی ٣ — چیرۆک و نووسین',
    items: [
      { id: 'quests' as const, title: QUEST_TILE.title, hint: QUEST_TILE.hint, Icon: Compass },
      { id: 'word-writing' as const, title: WORD_WRITING_TILE.title, hint: WORD_WRITING_TILE.hint, Icon: PencilLine },
    ],
  },
];

export const MatchGameScreen: React.FC = () => {
  const s = useThemeStyles(baseLearningStyles);
  const { isNight } = useAppearance();
  const { registerBackHandler, setRoute } = useAppStore();
  const tiles = tileSet(isNight);
  const { tablet, pageMax } = useResponsive();
  const [mode, setMode] = useState<'menu' | GameMode>('menu');

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
  if (mode === 'quests') return <QuestGame onExit={() => setMode('menu')} />;
  if (mode === 'vocab') return <VocabularyGame onExit={() => setMode('menu')} />;
  if (mode === 'word') return <WordBuilder onExit={() => setMode('menu')} />;
  if (mode === 'sound' || mode === 'similar') return <LetterPractice mode={mode} onExit={() => setMode('menu')} />;

  let tileIndex = 0;

  return (
    <ScrollView contentContainerStyle={[s.container, { paddingTop: 8, paddingBottom: 14 }, tablet && { maxWidth: pageMax }]}><HelpHint text={sectionIntroductions['match-game']} />
      {GAME_SECTIONS.map((section) => (
        <View key={section.level} style={candyCard.section}>
          <Text style={candyCard.sectionHeader}>{section.level}</Text>
          <View style={tablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : { gap: 10 }}>
            {section.items.map((item) => {
              const candy = tiles[tileIndex++ % tiles.length];
              return (
                <View
                  key={item.id}
                  style={[
                    candyCard.tile,
                    tablet && { width: '48%' },
                    { backgroundColor: candy.face, borderBottomColor: candy.lip },
                  ]}
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    style={candyCard.mainAction}
                    onPress={() => {
                      void soundService.stopSpeaking();
                      if (item.id === 'word-writing') setRoute('word-writing');
                      else setMode(item.id);
                    }}
                  >
                    <View style={[candyCard.icon, { backgroundColor: candy.chip }]}>
                      <item.Icon size={25} color={candy.icon} strokeWidth={2.3} />
                    </View>
                    <View style={candyCard.body}>
                      <Text style={[candyCard.title, { color: candy.ink }]}>{item.title}</Text>
                      <Text style={[candyCard.hint, { color: candy.ink }]}>{item.hint}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`خوێندنەوەی ${item.title}`}
                    style={[candyCard.speakBtn, { backgroundColor: candy.chip }]}
                    onPress={() => void soundService.speakWord(`${item.title}. ${item.hint}`)}
                  >
                    <Volume2 size={18} color={candy.icon} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// Macaron tiles shared with the home screen: soft colour, dark ink, a darker lip that sinks when pressed.
const candyCard = StyleSheet.create({
  section: { width: '100%', gap: 8, marginTop: 2 },
  sectionHeader: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 15, color: '#334155', textAlign: 'right', paddingHorizontal: 4 },
  tile: { minHeight: 72, borderRadius: 24, borderBottomWidth: 4, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, color: '#ffffff', textAlign: 'right' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, color: '#ffffff', textAlign: 'right', marginTop: 1 },
  speakBtn: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
