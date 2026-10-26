import { HelpHint } from '../../components/HelpButton';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { ChevronDown, ChevronUp, Compass, Lock, Flower2, Bug, TrainFront, Sprout, Ear, Eye, Layers, LucideIcon, PencilLine, Puzzle, Shapes, Volume2 } from 'lucide-react-native';
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
import { suggestedGames } from '../../services/gameSuggestions';
import { dueReviewLetters } from '../../services/learningEngine';
import { dueWordCount } from '../../data/vocabulary';
import { PairsGame, CatchGame, TrainGame } from '../freeplay/FreePlayGames';
import { FREE_PLAY_TEXT, FREE_PLAY_TILE } from '../freeplay/freePlayText';
import { FreePlayId, freePlayStates } from '../../services/freePlay';

type GameMode = 'word' | 'sound' | 'similar' | 'phonics' | 'syllables' | 'vocab' | 'quests' | FreePlayId;
const FREE_ICONS: Record<FreePlayId, LucideIcon> = { pairs: Flower2, catch: Bug, train: TrainFront };

const MENU_TEXT = { today: 'ئەمڕۆ ئەم یارییانە بکە', more: 'یارییەکانی تر', review: 'مەشقی دووبارەکردنەوە', reviewHint: (n: number) => `${n} شت کاتی بیرخستنەوەیانە` };

type GameItem = { id: GameMode | 'word-writing'; title: string; hint: string; Icon: LucideIcon };
const GAME_SECTIONS: { level: string; items: GameItem[] }[] = [
  {
    level: '⭐ ئاستی ١ — گوێ بگرە و بناسەوە',
    items: [
      { id: 'sound', title: 'یاریی دەنگ', hint: 'گوێ بگرە و پیتەکە بدۆزەوە', Icon: Volume2 },
      { id: 'phonics', title: 'دەنگی سەرەتای وشە', hint: 'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە', Icon: Ear },
      { id: 'similar', title: 'پیتە هاوشێوەکان', hint: 'شێوە و خاڵەکان جیا بکەرەوە', Icon: Eye },
    ],
  },
  {
    level: '⭐⭐ ئاستی ٢ — بڕگە و وشە دروست بکە',
    items: [
      { id: 'syllables', title: 'بڕگەکان', hint: 'وشەکە بە بڕگە پێکەوە ببەستە', Icon: Layers },
      { id: 'word', title: 'وشە دروست بکەم', hint: 'پیتەکان پێکەوە ببەستە', Icon: Puzzle },
      { id: 'vocab', title: VOCAB_TILE.title, hint: VOCAB_TILE.hint, Icon: Shapes },
    ],
  },
  {
    level: '⭐⭐⭐ ئاستی ٣ — چیرۆک و نووسین',
    items: [
      { id: 'quests', title: QUEST_TILE.title, hint: QUEST_TILE.hint, Icon: Compass },
      { id: 'word-writing', title: WORD_WRITING_TILE.title, hint: WORD_WRITING_TILE.hint, Icon: PencilLine },
    ],
  },
];

export const MatchGameScreen: React.FC = () => {
  const s = useThemeStyles(baseLearningStyles);
  const { isNight } = useAppearance();
  const { registerBackHandler, setRoute, currentProfile } = useAppStore();
  const tiles = tileSet(isNight);
  const { tablet, pageMax } = useResponsive();
  const [mode, setMode] = useState<'menu' | GameMode>('menu');
  const [showAll, setShowAll] = useState(false);
  const dueCount = dueReviewLetters(currentProfile).length + dueWordCount(currentProfile);

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
  if (mode === 'pairs') return <PairsGame onExit={() => setMode('menu')} />;
  if (mode === 'catch') return <CatchGame onExit={() => setMode('menu')} />;
  if (mode === 'train') return <TrainGame onExit={() => setMode('menu')} />;
  if (mode === 'word') return <WordBuilder onExit={() => setMode('menu')} />;
  if (mode === 'sound' || mode === 'similar') return <LetterPractice mode={mode} onExit={() => setMode('menu')} />;

  let tileIndex = 0;

  return (
    <ScrollView contentContainerStyle={[s.container, { paddingTop: 8, paddingBottom: 14 }, tablet && { maxWidth: pageMax }]}><HelpHint text={sectionIntroductions['match-game']} />
      <Text style={candyCard.sectionHeader}>{MENU_TEXT.today}</Text>
      {dueCount > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={MENU_TEXT.review} onPress={() => { void soundService.stopSpeaking(); setRoute('daily-practice'); }} style={[candyCard.big, candyCard.review, { backgroundColor: tiles[3 % tiles.length].face, borderBottomColor: tiles[3 % tiles.length].lip }]}>
        <View style={[candyCard.bigIcon, { backgroundColor: tiles[3 % tiles.length].chip }]}><Sprout size={38} color={tiles[3 % tiles.length].icon} strokeWidth={2.3} /></View>
        <View style={candyCard.body}><Text style={[candyCard.bigTitle, { color: tiles[3 % tiles.length].ink }]}>{MENU_TEXT.review}</Text><Text style={[candyCard.hint, { color: tiles[3 % tiles.length].ink }]}>{MENU_TEXT.reviewHint(dueCount)}</Text></View>
      </TouchableOpacity>}
      <View style={tablet ? { flexDirection: 'row', gap: 12 } : { gap: 12 }}>
        {suggestedGames(currentProfile).map((id, i) => {
          const item = GAME_SECTIONS.flatMap(section => section.items).find(game => game.id === id)!;
          const candy = tiles[(i + 1) % tiles.length];
          return <TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={item.title}
            onPress={() => { void soundService.stopSpeaking(); setMode(item.id as GameMode); }}
            style={[candyCard.big, tablet && { flex: 1 }, { backgroundColor: candy.face, borderBottomColor: candy.lip }]}>
            <View style={[candyCard.bigIcon, { backgroundColor: candy.chip }]}><item.Icon size={38} color={candy.icon} strokeWidth={2.3} /></View>
            <Text style={[candyCard.bigTitle, { color: candy.ink }]}>{item.title}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <Text style={candyCard.sectionHeader}>{FREE_PLAY_TILE.title} — {FREE_PLAY_TILE.hint}</Text>
      <View style={tablet ? { flexDirection: 'row', gap: 12 } : { gap: 10 }}>
        {freePlayStates(currentProfile, text => soundService.canSpeak(text)).map((game, i) => {
          const Icon = game.open ? FREE_ICONS[game.id] : Lock, candy = tiles[(i + 2) % tiles.length], text = FREE_PLAY_TEXT[game.id];
          return <TouchableOpacity key={game.id} accessibilityRole="button" accessibilityState={{ disabled: !game.open }} accessibilityLabel={game.open ? text.title : `${text.title}. ${game.missing > 0 ? FREE_PLAY_TEXT.locked(game.missing) : FREE_PLAY_TEXT.notReady}`}
            onPress={() => { if (!game.open) return; void soundService.stopSpeaking(); setMode(game.id); }}
            style={[candyCard.tile, tablet && { flex: 1 }, { backgroundColor: candy.face, borderBottomColor: candy.lip }, !game.open && { opacity: 0.55 }]}>
            <View style={[candyCard.icon, { backgroundColor: candy.chip }]}><Icon size={25} color={candy.icon} strokeWidth={2.3} /></View>
            <View style={candyCard.body}><Text style={[candyCard.title, { color: candy.ink }]}>{text.title}</Text>
              <Text style={[candyCard.hint, { color: candy.ink }]}>{game.open ? text.hint : game.missing > 0 ? FREE_PLAY_TEXT.locked(game.missing) : FREE_PLAY_TEXT.notReady}</Text></View>
          </TouchableOpacity>;
        })}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showAll }} accessibilityLabel={MENU_TEXT.more} onPress={() => setShowAll(v => !v)} style={candyCard.more}>
        <Text style={candyCard.moreText}>{MENU_TEXT.more}</Text>{showAll ? <ChevronUp size={22} color="#475569" /> : <ChevronDown size={22} color="#475569" />}
      </TouchableOpacity>
      {showAll && GAME_SECTIONS.map((section) => (
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
  review: { minHeight: 96, flexDirection: 'row', justifyContent: 'flex-start', gap: 12 },
  big: { minHeight: 132, borderRadius: 28, borderBottomWidth: 6, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 10 },
  bigIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bigTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, textAlign: 'center' },
  more: { minHeight: 48, borderRadius: 18, borderWidth: 2, borderColor: '#cbd5e1', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center' },
  moreText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 15, color: '#475569' },
  sectionHeader: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 15, color: '#334155', textAlign: 'right', paddingHorizontal: 4 },
  tile: { minHeight: 72, borderRadius: 24, borderBottomWidth: 4, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, color: '#ffffff', textAlign: 'right' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, color: '#ffffff', textAlign: 'right', marginTop: 1 },
  speakBtn: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
