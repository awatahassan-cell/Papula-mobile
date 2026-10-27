import { HelpHint } from '../../components/HelpButton';
import { sectionIntroductions } from '../../services/sectionIntroductions';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react-native';
import { CharacterPicture } from '../../components/CharacterPicture';
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
import { BasketGame, FillGame, MatchLettersGame, OddGame } from '../freeplay/FreePlayMore';
import { PALETTE, Tone } from '../freeplay/playKit';
import { FREE_PLAY_TEXT, FREE_PLAY_TILE } from '../freeplay/freePlayText';
import { kurdishDigits } from '../../services/rewards';
import { FreePlayId, freePlayStates } from '../../services/freePlay';

type GameMode = 'word' | 'sound' | 'similar' | 'phonics' | 'syllables' | 'vocab' | 'quests' | FreePlayId;
const FREE_ICONS: Record<FreePlayId, { icon: string; tone: Tone }> = {
  pairs: { icon: '🃏', tone: 'purple' }, catch: { icon: '🫧', tone: 'sky' }, match: { icon: '🖼', tone: 'indigo' }, odd: { icon: '👁', tone: 'purple' },
  basket: { icon: '🧺', tone: 'emerald' }, fill: { icon: '🔍', tone: 'rose' }, train: { icon: '🚂', tone: 'amber' },
};

const MENU_TEXT = { today: 'ئەمڕۆ ئەم یارییانە بکە', more: 'یارییەکانی تر', review: 'مەشقی دووبارەکردنەوە', reviewHint: (n: number) => `${n} شت کاتی بیرخستنەوەیانە` };

type GameItem = { id: GameMode | 'word-writing'; title: string; hint: string; icon: string };
const GAME_SECTIONS: { level: string; items: GameItem[] }[] = [
  {
    level: '⭐ ئاستی ١ — گوێ بگرە و بناسەوە',
    items: [
      { id: 'sound', title: 'یاریی دەنگ', hint: 'گوێ بگرە و پیتەکە بدۆزەوە', icon: '🔊' },
      { id: 'phonics', title: 'دەنگی سەرەتای وشە', hint: 'وشەکە ببیستە و دەنگی یەکەم بدۆزەوە', icon: '👂' },
      { id: 'similar', title: 'پیتە هاوشێوەکان', hint: 'شێوە و خاڵەکان جیا بکەرەوە', icon: '👁' },
    ],
  },
  {
    level: '⭐⭐ ئاستی ٢ — بڕگە و وشە دروست بکە',
    items: [
      { id: 'syllables', title: 'بڕگەکان', hint: 'وشەکە بە بڕگە پێکەوە ببەستە', icon: '🎵' },
      { id: 'word', title: 'وشە دروست بکەم', hint: 'پیتەکان پێکەوە ببەستە', icon: '🧩' },
      { id: 'vocab', title: VOCAB_TILE.title, hint: VOCAB_TILE.hint, icon: '🍎' },
    ],
  },
  {
    level: '⭐⭐⭐ ئاستی ٣ — چیرۆک و نووسین',
    items: [
      { id: 'quests', title: QUEST_TILE.title, hint: QUEST_TILE.hint, icon: '🧭' },
      { id: 'word-writing', title: WORD_WRITING_TILE.title, hint: WORD_WRITING_TILE.hint, icon: '✏' },
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
  if (mode === 'basket') return <BasketGame onExit={() => setMode('menu')} />;
  if (mode === 'odd') return <OddGame onExit={() => setMode('menu')} />;
  if (mode === 'match') return <MatchLettersGame onExit={() => setMode('menu')} />;
  if (mode === 'fill') return <FillGame onExit={() => setMode('menu')} />;
  if (mode === 'word') return <WordBuilder onExit={() => setMode('menu')} />;
  if (mode === 'sound' || mode === 'similar') return <LetterPractice mode={mode} onExit={() => setMode('menu')} />;

  let tileIndex = 0;

  return (
    <ScrollView contentContainerStyle={[s.container, { paddingTop: 8, paddingBottom: 18 }, tablet && { maxWidth: pageMax }]}><HelpHint text={sectionIntroductions['match-game']} />
      {dueCount > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={MENU_TEXT.review} onPress={() => { void soundService.stopSpeaking(); setRoute('daily-practice'); }} style={[candyCard.big, candyCard.review, { backgroundColor: tiles[3 % tiles.length].face, borderColor: tiles[3 % tiles.length].lip, borderBottomColor: tiles[3 % tiles.length].lip }]}>
        <View style={[candyCard.bigIcon, { backgroundColor: tiles[3 % tiles.length].chip }]}><CharacterPicture symbol="🌱" size={56} animate={false} /></View>
        <View style={candyCard.body}><Text style={[candyCard.bigTitle, { color: tiles[3 % tiles.length].ink }]}>{MENU_TEXT.review}</Text><Text style={[candyCard.hint, { color: tiles[3 % tiles.length].ink }]}>{MENU_TEXT.reviewHint(dueCount)}</Text></View>
      </TouchableOpacity>}
      <View style={tablet ? { flexDirection: 'row', gap: 12 } : { gap: 12 }}>
        {suggestedGames(currentProfile).map((id, i) => {
          const item = GAME_SECTIONS.flatMap(section => section.items).find(game => game.id === id)!;
          const candy = tiles[(i + 1) % tiles.length];
          return <TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={item.title}
            onPress={() => { void soundService.stopSpeaking(); setMode(item.id as GameMode); }}
            style={[candyCard.big, tablet && { flex: 1 }, { backgroundColor: candy.face, borderColor: candy.lip, borderBottomColor: candy.lip }]}>
            <View style={[candyCard.bigIcon, { backgroundColor: candy.chip }]}><CharacterPicture symbol={item.icon} size={58} animate={false} /></View>
            <Text style={[candyCard.bigTitle, { color: candy.ink }]}>{item.title}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <View accessible accessibilityLabel={FREE_PLAY_TILE.title} style={candyCard.divider}>
        <View style={candyCard.dividerPill}><Text style={candyCard.dividerEmoji}>🦋</Text><Text style={candyCard.dividerTitle}>{FREE_PLAY_TILE.title}</Text></View>
      </View>
      <View style={candyCard.freeGrid}>
        {freePlayStates(currentProfile, text => soundService.canSpeak(text)).map(game => {
          const text = FREE_PLAY_TEXT[game.id], look = FREE_ICONS[game.id], p = PALETTE[look.tone];
          return <TouchableOpacity key={game.id} accessibilityRole="button" accessibilityState={{ disabled: !game.open }}
            accessibilityLabel={game.open ? text.title : `${text.title}. ${game.missing > 0 ? FREE_PLAY_TEXT.locked(game.missing) : FREE_PLAY_TEXT.notReady}`}
            onPress={() => { if (!game.open) return; void soundService.stopSpeaking(); setMode(game.id); }}
            style={[candyCard.freeTile, { backgroundColor: p.soft, borderColor: p.face, borderBottomColor: p.lip }, !game.open && { opacity: 0.55 }]}>
            <View style={[candyCard.freeIconWrap, { backgroundColor: '#ffffffcc', borderColor: p.face }]}>
              <CharacterPicture symbol={game.open ? look.icon : '🔒'} size={58} animate={false} />
            </View>
            <Text numberOfLines={1} style={[candyCard.freeTitle, { color: p.ink }]}>{game.open || game.missing === 0 ? text.title : `+${kurdishDigits(game.missing)}`}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showAll }} accessibilityLabel={MENU_TEXT.more} onPress={() => setShowAll(v => !v)} style={candyCard.more}>
        <Text style={candyCard.moreText}>{MENU_TEXT.more}</Text>{showAll ? <ChevronUp size={22} color="#3b0764" /> : <ChevronDown size={22} color="#3b0764" />}
      </TouchableOpacity>
      {showAll && GAME_SECTIONS.map((section) => (
        <View key={section.level} style={candyCard.section}>
          <View style={candyCard.sectionBadge}><Text style={candyCard.sectionHeader}>{section.level}</Text></View>
          <View style={tablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : { gap: 10 }}>
            {section.items.map((item) => {
              const candy = tiles[tileIndex++ % tiles.length];
              return (
                <View
                  key={item.id}
                  style={[
                    candyCard.tile,
                    tablet && { width: '48%' },
                    { backgroundColor: candy.face, borderColor: candy.lip, borderBottomColor: candy.lip },
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
                      <CharacterPicture symbol={item.icon} size={42} animate={false} />
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
  section: { width: '100%', gap: 10, marginTop: 4 },
  review: { minHeight: 98, flexDirection: 'row', justifyContent: 'flex-start', gap: 12 },
  big: { minHeight: 138, borderRadius: 30, borderWidth: 3, borderBottomWidth: 8, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 10 },
  bigIcon: { width: 86, height: 86, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  bigTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 21, textAlign: 'center' },
  more: { minHeight: 50, borderRadius: 22, borderWidth: 3, borderBottomWidth: 6, borderColor: '#a78bfa', borderBottomColor: '#6d28d9', backgroundColor: '#ede9fe', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', marginTop: 4 },
  moreText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#3b0764' },
  divider: { alignItems: 'center', marginTop: 6, paddingTop: 4 },
  dividerPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', borderRadius: 20, borderWidth: 2.5, borderBottomWidth: 5, borderColor: '#fbbf24', borderBottomColor: '#d97706', paddingHorizontal: 16, paddingVertical: 5 },
  dividerEmoji: { fontSize: 24 },
  dividerTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#78350f' },
  freeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  freeTile: { width: '47%', flexGrow: 1, minHeight: 132, borderRadius: 28, borderWidth: 4, borderBottomWidth: 8, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10 },
  freeIconWrap: { width: 74, height: 74, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  freeTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, textAlign: 'center' },
  sectionGap: { marginTop: 10 },
  sectionBadge: { alignSelf: 'flex-end', backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 4 },
  sectionHeader: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#1e293b', textAlign: 'right' },
  tile: { minHeight: 78, borderRadius: 26, borderWidth: 3, borderBottomWidth: 7, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, color: '#ffffff', textAlign: 'right' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 12, color: '#ffffff', textAlign: 'right', marginTop: 1 },
  speakBtn: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
