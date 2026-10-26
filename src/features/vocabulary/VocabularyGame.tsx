import { kurdishDigits } from '../../services/rewards';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Text } from '../../components/RTLText';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { shuffled } from '../../services/learningEngine';
import { learningStyles as baseLearningStyles } from '../learning/learningStyles';
import { useGameScroll } from '../learning/useGameScroll';
import {
  PictureWord, VOCAB, VOCAB_CATEGORIES, VOCAB_SENTENCES, VocabCategory, VocabSentence, dueSentences, dueWordCount, dueWords,
  pictureDistractors, sentenceDistractors, wordPlan,
} from '../../data/vocabulary';
import { HelpHint } from '../../components/HelpButton';
import { SPOKEN_GUIDES } from '../../data/spokenGuides';
import { VOCAB_TEXT } from './vocabText';

type Source = VocabCategory | 'sentences' | 'review';
type Round = { kind: 'word'; item: PictureWord; options: PictureWord[] } | { kind: 'sentence'; item: VocabSentence; options: VocabSentence[] };
const ROUNDS = 6;

function buildRounds(profile: Parameters<typeof wordPlan>[0], source: Source): Round[] {
  const word = (item: PictureWord): Round => ({ kind: 'word', item, options: shuffled([item, ...pictureDistractors(item)]) });
  const sentence = (item: VocabSentence): Round => ({ kind: 'sentence', item, options: shuffled([item, ...sentenceDistractors(item)]) });
  if (source === 'sentences') return shuffled(wordPlan(profile, VOCAB_SENTENCES, ROUNDS)).map(sentence);
  if (source === 'review') {
    const words = wordPlan(profile, dueWords(profile), ROUNDS).map(word), sentences = wordPlan(profile, dueSentences(profile), 2).map(sentence);
    return shuffled([...words, ...sentences]).slice(0, ROUNDS);
  }
  return shuffled(wordPlan(profile, VOCAB.filter(item => item.category === source), ROUNDS)).map(word);
}

/** Picture ↔ word and picture ↔ sentence rounds. Every answer feeds the spaced review. */
export const VocabularyGame: React.FC<{ onExit: () => void; start?: Source }> = ({ onExit, start }) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile, recordPracticeResult, finishLearningGame } = useAppStore();
  const [source, setSource] = useState<Source | null>(start ?? null);
  const [run, setRun] = useState(0);
  const rounds = useMemo(() => (source ? buildRounds(currentProfile, source) : []), [source, run]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const missed = useRef(false), recorded = useRef(false);
  const scroll = useGameScroll(index, answered);
  const due = dueWordCount(currentProfile);
  useEffect(() => () => { void soundService.stopSpeaking(); }, []);

  const begin = (next: Source) => { setSource(next); setRun(r => r + 1); setIndex(0); setWrongIds([]); setAnswered(false); setFirstTry(0); missed.current = false; };
  const round = rounds[index];
  // Each round reads its word or sentence aloud when it appears (children who cannot read yet are guided by ear).
  const spokenNow = round ? (round.kind === 'word' ? round.item.word : round.item.text) : '';
  useEffect(() => { if (spokenNow && soundService.canSpeak(spokenNow)) void soundService.speakWord(spokenNow); }, [spokenNow, index, run]);

  if (!source) return <ScrollView contentContainerStyle={s.container}>
    <HelpHint text={SPOKEN_GUIDES.vocab} disabled={!soundService.canSpeak(SPOKEN_GUIDES.vocab)} />
    <Text style={s.title}>{VOCAB_TEXT.pickCategory}</Text>
    <View style={s.row}>{VOCAB_CATEGORIES.map(category => <TouchableOpacity key={category.id} accessibilityRole="button" accessibilityLabel={category.title} style={[s.card, local.choice]} onPress={() => begin(category.id)}>
      <Text style={s.emoji}>{category.emoji}</Text><Text style={s.title}>{category.title}</Text></TouchableOpacity>)}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={VOCAB_TEXT.sentences} style={[s.card, local.choice]} onPress={() => begin('sentences')}><Text style={s.emoji}>📖</Text><Text style={s.title}>{VOCAB_TEXT.sentences}</Text></TouchableOpacity>
    </View>
    {due > 0 && <TouchableOpacity accessibilityRole="button" style={s.button} onPress={() => begin('review')}><Text style={s.buttonText}>{VOCAB_TEXT.review}</Text><Text style={[s.buttonText, { fontSize: 14 }]}>{VOCAB_TEXT.reviewHint(due)}</Text></TouchableOpacity>}
    <BackButton fullWidth onPress={onExit}>{VOCAB_TEXT.back}</BackButton>
  </ScrollView>;

  if (!round) return <View style={s.container}><Text style={s.text}>{VOCAB_TEXT.nothingDue}</Text><BackButton fullWidth onPress={onExit}>{VOCAB_TEXT.back}</BackButton></View>;

  if (index >= rounds.length) return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.emoji}>🦋</Text><Text style={s.title}>{VOCAB_TEXT.done}</Text><Text style={s.text}>{VOCAB_TEXT.score(firstTry, rounds.length)}</Text>
    <TouchableOpacity accessibilityRole="button" style={s.button} onPress={() => begin(source)}><Text style={s.buttonText}>{VOCAB_TEXT.again}</Text></TouchableOpacity>
    <BackButton fullWidth onPress={() => setSource(null)}>{VOCAB_TEXT.back}</BackButton>
  </ScrollView>;

  const target = round.item;
  const spoken = round.kind === 'word' ? round.item.word : round.item.text;
  const listen = () => { if (soundService.canSpeak(spoken)) void soundService.speakWord(spoken); };
  const pick = (id: string) => {
    if (answered || wrongIds.includes(id)) return;
    const ok = id === target.id;
    if (!missed.current && !recorded.current) { recorded.current = true; recordPracticeResult([], ok, target.id, round.kind === 'word' ? 'word' : 'reading', false); } // only the first try counts for review
    if (ok) {
      if (!missed.current) setFirstTry(n => n + 1);
      setAnswered(true); soundService.playCorrect(); listen();
    } else { missed.current = true; setWrongIds(list => [...list, id]); soundService.playEncouragingTryAgain(); }
  };
  const next = () => {
    void soundService.stopSpeaking();
    if (index + 1 >= rounds.length) finishLearningGame('word');
    setIndex(index + 1); setWrongIds([]); setAnswered(false); missed.current = false; recorded.current = false;
  };
  const optionStyle = (id: string) => [local.option, answered && id === target.id && s.correct, wrongIds.includes(id) && s.retry, wrongIds.includes(id) && s.disabled];
  const guide = round.kind === 'word' ? SPOKEN_GUIDES.vocabWord : SPOKEN_GUIDES.vocabSentence;
  return <ScrollView ref={scroll} contentContainerStyle={s.container}>
    <HelpHint text={guide} disabled={!soundService.canSpeak(guide)} />
    <Text style={s.text}>{kurdishDigits(index + 1)} / {kurdishDigits(rounds.length)}</Text>
    <Text style={s.title}>{round.kind === 'word' ? VOCAB_TEXT.pickWord : VOCAB_TEXT.pickPicture}</Text>
    <View style={s.card}>
      {round.kind === 'word' ? <Text style={[s.emoji, { fontSize: 84, lineHeight: 100 }]}>{round.item.emoji}</Text>
        : <Text style={[s.glyph, { fontSize: 34, lineHeight: 52 }]}>{round.item.text}</Text>}
      {soundService.canSpeak(spoken) && <TouchableOpacity accessibilityRole="button" accessibilityLabel={VOCAB_TEXT.listen} style={s.secondary} onPress={listen}><Text style={s.text}>🔊 {VOCAB_TEXT.listen}</Text></TouchableOpacity>}
    </View>
    <View style={s.row}>{round.kind === 'word'
      ? round.options.map(option => <TouchableOpacity key={option.id} accessibilityRole="button" accessibilityLabel={option.word} style={[s.tile, ...optionStyle(option.id)]} onPress={() => pick(option.id)}><Text style={s.glyph}>{option.word}</Text></TouchableOpacity>)
      : round.options.map(option => <TouchableOpacity key={option.id} accessibilityRole="button" accessibilityLabel={option.emoji} style={[s.tile, ...optionStyle(option.id)]} onPress={() => pick(option.id)}><Text style={[s.emoji, { fontSize: 44 }]}>{option.emoji}</Text></TouchableOpacity>)}</View>
    {answered && <Text accessibilityLiveRegion="polite" style={s.text}>{VOCAB_TEXT.right}</Text>}
    {!answered && wrongIds.length > 0 && <Text accessibilityLiveRegion="polite" style={s.text}>{VOCAB_TEXT.wrong}</Text>}
    {answered && <TouchableOpacity accessibilityRole="button" style={s.button} onPress={next}><Text style={s.buttonText}>{index + 1 >= rounds.length ? VOCAB_TEXT.finish : VOCAB_TEXT.next}</Text></TouchableOpacity>}
    <BackButton fullWidth onPress={() => { void soundService.stopSpeaking(); if (start) onExit(); else setSource(null); }}>{VOCAB_TEXT.back}</BackButton>
  </ScrollView>;
};

const local = StyleSheet.create({
  choice: { flexBasis: '46%', flexGrow: 1 },
  option: { minWidth: 96, minHeight: 72, flexGrow: 1 },
});
