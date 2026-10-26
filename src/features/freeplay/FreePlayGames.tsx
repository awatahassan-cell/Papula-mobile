import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Text } from '../../components/RTLText';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { LearningWord, shuffled } from '../../services/learningEngine';
import { completedLetterIds } from '../../services/lessonPath';
import { mockLetters } from '../../data/mockLetters';
import { pairWords, trainWords } from '../../services/freePlay';
import { learningStyles as baseLearningStyles } from '../learning/learningStyles';
import { FREE_PLAY_TEXT as T } from './freePlayText';

type Props = { onExit: () => void };
const say = (text: string) => { if (soundService.canSpeak(text)) void soundService.speakWord(text); };
const sayLetter = (glyph: string) => { const letter = mockLetters.find(item => item.glyph === glyph); void soundService.speakWord(glyph, { letterName: letter?.name }); };
const useStop = () => useEffect(() => () => { void soundService.stopSpeaking(); }, []);
const canSay = (text: string) => soundService.canSpeak(text);

/** Finished screen shared by the three games. */
const Finish: React.FC<{ onAgain: () => void; onExit: () => void }> = ({ onAgain, onExit }) => {
  const s = useThemeStyles(baseLearningStyles);
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.emoji}>🦋</Text><Text style={s.title}>{T.done}</Text>
    <TouchableOpacity accessibilityRole="button" style={s.button} onPress={onAgain}><Text style={s.buttonText}>{T.again}</Text></TouchableOpacity>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

/** Memory: a picture card and the card with its word. Opening a card reads the word aloud; a wrong pair just turns back. */
export const PairsGame: React.FC<Props> = ({ onExit }) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile, recordPracticeResult } = useAppStore();
  const [run, setRun] = useState(0);
  const words = useMemo(() => shuffled(pairWords(currentProfile, canSay)).slice(0, 3), [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const cards = useMemo(() => shuffled(words.flatMap(word => [{ key: `${word.id}-p`, word, pic: true }, { key: `${word.id}-w`, word, pic: false }])), [words]);
  const [open, setOpen] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const missed = useRef<string[]>([]), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useStop(); useEffect(() => () => clearTimeout(timer.current), []);
  const reset = () => { clearTimeout(timer.current); setOpen([]); setDone([]); missed.current = []; setRun(r => r + 1); };
  if (words.length && done.length === words.length * 2) return <Finish onAgain={reset} onExit={onExit} />;
  const flip = (key: string) => {
    if (open.length >= 2 || open.includes(key) || done.includes(key)) return;
    const card = cards.find(item => item.key === key)!;
    say(card.word.word);
    const now = [...open, key];
    setOpen(now);
    if (now.length < 2) return;
    const [a, b] = now.map(k => cards.find(item => item.key === k)!);
    if (a.word.id === b.word.id) {
      // Only a pair found on the first try counts as practice; recordPracticeResult gives the one star for a new word.
      if (!missed.current.includes(a.word.id)) recordPracticeResult(a.word.letterIds, true, a.word.id, 'word', false);
      soundService.playCorrect();
      timer.current = setTimeout(() => { setDone(list => [...list, ...now]); setOpen([]); }, 700);
    } else {
      missed.current.push(a.word.id, b.word.id);
      soundService.playEncouragingTryAgain();
      timer.current = setTimeout(() => setOpen([]), 1100);
    }
  };
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>{T.pairs.ask}</Text>
    <View style={s.row}>{cards.map(card => {
      const shown = open.includes(card.key) || done.includes(card.key);
      return <TouchableOpacity key={card.key} accessibilityRole="button" accessibilityLabel={shown ? card.word.word : '🦋'} onPress={() => flip(card.key)}
        style={[s.tile, local.card, !shown && local.back, done.includes(card.key) && s.correct]}>
        {!shown ? <Text style={s.emoji}>🦋</Text> : card.pic ? <Text style={[s.emoji, { fontSize: 52, lineHeight: 62 }]}>{card.word.imageEmoji}</Text> : <Text style={s.glyph}>{card.word.word}</Text>}
      </TouchableOpacity>;
    })}</View>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const ROUNDS = 6;
/** The child hears a letter and taps its bubble. No clock and nothing falls; a wrong bubble just fades. */
export const CatchGame: React.FC<Props> = ({ onExit }) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile, recordPracticeResult } = useAppStore();
  const letters = useMemo(() => mockLetters.filter(letter => completedLetterIds(currentProfile).includes(letter.id)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [run, setRun] = useState(0), [round, setRound] = useState(0), [caught, setCaught] = useState(false), [wrong, setWrong] = useState<string[]>([]);
  const targets = useMemo(() => { const order = shuffled(letters); return Array.from({ length: ROUNDS }, (_, i) => order[i % order.length]); }, [run, letters]); // eslint-disable-line react-hooks/exhaustive-deps
  const missed = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = targets[round];
  const options = useMemo(() => target ? shuffled([target, ...shuffled(letters.filter(letter => letter.id !== target.id)).slice(0, 5)]) : [], [target, letters]);
  useStop(); useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (target) sayLetter(target.glyph); }, [target, round]);
  if (round >= ROUNDS) return <Finish onAgain={() => { setRun(r => r + 1); setRound(0); }} onExit={onExit} />;
  const tap = (id: string) => {
    if (caught || wrong.includes(id)) return;
    if (id === target.id) {
      if (!missed.current) recordPracticeResult([id], true, undefined, 'recognition', false);
      setCaught(true); soundService.playCorrect();
      timer.current = setTimeout(() => { setCaught(false); setWrong([]); missed.current = false; setRound(r => r + 1); }, 900);
    } else {
      if (!missed.current) recordPracticeResult([target.id], false, undefined, 'recognition', false);
      missed.current = true; setWrong(list => [...list, id]); soundService.playEncouragingTryAgain();
    }
  };
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.text}>{round + 1} / {ROUNDS}</Text>
    <Text style={s.title}>{T.catch.ask}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={T.catch.ask} style={s.secondary} onPress={() => sayLetter(target.glyph)}><Text style={s.text}>🔊</Text></TouchableOpacity>
    <View style={s.row}>{options.map((letter, i) => <TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={letter.glyph}
      style={[local.bubble, { marginTop: i % 2 ? 18 : 0 }, caught && letter.id === target.id && s.correct, wrong.includes(letter.id) && s.retry, wrong.includes(letter.id) && s.disabled]} onPress={() => tap(letter.id)}>
      <Text style={s.glyph}>{letter.glyph}</Text></TouchableOpacity>)}</View>
    {caught && <Text accessibilityLiveRegion="polite" style={s.text}>{T.right} 🦋</Text>}
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const TRAINS = 3;
/** A picture and empty carriages: the child taps the letters in order. A wrong letter just stays in the bank. */
export const TrainGame: React.FC<Props> = ({ onExit }) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile, recordPracticeResult } = useAppStore();
  const [run, setRun] = useState(0), [index, setIndex] = useState(0), [filled, setFilled] = useState(0), [wrong, setWrong] = useState<number | null>(null);
  const queue = useMemo<LearningWord[]>(() => shuffled(trainWords(currentProfile, canSay)).slice(0, TRAINS), [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const word = queue[index];
  const bank = useMemo(() => word ? shuffled(word.units.map((glyph, id) => ({ glyph, id }))) : [], [word]);
  const [usedIds, setUsedIds] = useState<number[]>([]), missed = useRef(false);
  useStop();
  useEffect(() => { if (word) say(word.word); }, [word]);
  if (!word) return <Finish onAgain={() => { setRun(r => r + 1); setIndex(0); setFilled(0); setUsedIds([]); }} onExit={onExit} />;
  const complete = filled === word.units.length;
  const tap = (tile: { glyph: string; id: number }) => {
    if (complete || usedIds.includes(tile.id)) return;
    if (tile.glyph === word.units[filled]) {
      setUsedIds(list => [...list, tile.id]); setFilled(filled + 1); sayLetter(tile.glyph);
      if (filled + 1 === word.units.length) { recordPracticeResult(word.letterIds, !missed.current, word.id, 'word', false); soundService.playCorrect(); say(word.word); }
    } else { missed.current = true; setWrong(tile.id); soundService.playEncouragingTryAgain(); setTimeout(() => setWrong(null), 500); }
  };
  const next = () => { setUsedIds([]); missed.current = false; setFilled(0); setIndex(index + 1); };
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.text}>{index + 1} / {queue.length}</Text>
    <Text style={s.title}>{T.train.ask}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={word.word} onPress={() => say(word.word)}><Text style={[s.emoji, { fontSize: 84, lineHeight: 100 }]}>{word.imageEmoji}</Text></TouchableOpacity>
    <View style={s.row}>{word.units.map((glyph, i) => <View key={i} style={[s.tile, local.slot, i < filled && s.correct]}>{i < filled && <Text style={s.glyph}>{glyph}</Text>}</View>)}</View>
    <View style={s.row}>{bank.map(tile => <TouchableOpacity key={tile.id} accessibilityRole="button" accessibilityLabel={tile.glyph} onPress={() => tap(tile)}
      style={[s.tile, usedIds.includes(tile.id) && s.disabled, wrong === tile.id && s.retry]}><Text style={s.glyph}>{tile.glyph}</Text></TouchableOpacity>)}</View>
    {complete && <Text accessibilityLiveRegion="polite" style={s.text}>{T.right} 🦋</Text>}
    {complete && <TouchableOpacity accessibilityRole="button" style={s.button} onPress={next}><Text style={s.buttonText}>{T.next}</Text></TouchableOpacity>}
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const local = StyleSheet.create({
  card: { width: '30%', minHeight: 96, flexGrow: 1 },
  back: { backgroundColor: '#ede9fe', borderColor: '#a78bfa' },
  bubble: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#93c5fd', backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  slot: { borderStyle: 'dashed', minWidth: 54 },
});
