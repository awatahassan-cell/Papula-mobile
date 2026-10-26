import { kurdishDigits } from '../../services/rewards';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../../components/Motion';
import { BackButton } from '../../components/BackButton';
import { CharacterPicture } from '../../components/CharacterPicture';
import { Text } from '../../components/RTLText';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { LearningWord, shuffled } from '../../services/learningEngine';
import { completedLetterIds } from '../../services/lessonPath';
import { mockLetters } from '../../data/mockLetters';
import { pairWords, trainWords } from '../../services/freePlay';
import { BUBBLE_COLOURS, Finish, K, PALETTE, PlayHeader, Tile, canSay, say, sayLetter, useStop } from './playKit';
import { FREE_PLAY_TEXT as T } from './freePlayText';

type Props = { onExit: () => void };

/** Memory: a picture card and the card with its word. Opening a card reads the word aloud; a wrong pair just turns back. */
export const PairsGame: React.FC<Props> = ({ onExit }) => {
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
  return <ScrollView contentContainerStyle={K.page}>
    <View style={K.row}>{cards.map((card, i) => {
      const shown = open.includes(card.key) || done.includes(card.key), tone = BUBBLE_COLOURS[i % BUBBLE_COLOURS.length];
      const finished = done.includes(card.key);
      return <TouchableOpacity key={card.key} accessibilityRole="button" accessibilityLabel={shown ? card.word.word : '🦋'} onPress={() => flip(card.key)}
        style={[K.tile, local.card, shown ? { backgroundColor: finished ? PALETTE.emerald.soft : '#ffffff', borderColor: finished ? PALETTE.emerald.face : PALETTE.amber.face, borderBottomColor: finished ? PALETTE.emerald.lip : PALETTE.amber.lip } : { backgroundColor: tone.face, borderColor: tone.lip, borderBottomColor: tone.lip }]}>
        {!shown ? <CharacterPicture symbol="🦋" size={52} animate={false} /> : card.pic ? <CharacterPicture symbol={card.word.imageEmoji} size={72} animate={false} /> : <Text style={K.glyph}>{card.word.word}</Text>}
      </TouchableOpacity>;
    })}</View>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const ROUNDS = 6;
const BUBBLE = 92;
const LEFTS = ['0%', '16%', '32%', '48%', '64%', '72%'];
/** The sky takes the space left under the header and above the back button and tab bar. */
const skyHeight = (windowHeight: number) => Math.max(380, Math.min(660, windowHeight - 400));
type Letter = (typeof mockLetters)[number];
/** One coloured bubble rising slowly from the bottom edge of the sky and starting over when it leaves the top; with reduced motion it just sits still. */
const Bubble: React.FC<{ letter: Letter; index: number; state: 'idle' | 'caught' | 'wrong'; height: number; onPress: () => void }> = ({ letter, index, state, height, onPress }) => {
  const reduced = useReducedMotion();
  const [y] = useState(() => new Animated.Value(height));
  const tone = BUBBLE_COLOURS[index % BUBBLE_COLOURS.length];
  useEffect(() => {
    if (reduced) { y.setValue(24 + (index % 3) * Math.round((height - BUBBLE - 48) / 2)); return; }
    let alive = true;
    const travel = height + BUBBLE, duration = 11000 + index * 1400;
    const run = (from: number) => {
      y.setValue(from);
      Animated.timing(y, { toValue: -BUBBLE, duration: duration * (from + BUBBLE) / travel, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false })
        .start(({ finished }) => { if (alive && finished) run(height); });
    };
    run(height - (index * travel) / 6.5);
    return () => { alive = false; y.stopAnimation(); };
  }, [reduced, index, y, height]);
  return <Animated.View style={[local.floater, { left: LEFTS[index % LEFTS.length] as `${number}%`, transform: [{ translateY: y }] }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={letter.glyph} onPress={onPress}
      style={[local.bubble, { backgroundColor: tone.face + 'cc', borderColor: tone.lip }, state === 'caught' && local.caught, state === 'wrong' && local.wrong]}>
      <View style={local.shine} /><Text style={local.bubbleText}>{letter.glyph}</Text>
    </TouchableOpacity>
  </Animated.View>;
};

/** The child hears a letter and taps its bubble. No clock and nothing falls; a wrong bubble just fades. */
export const CatchGame: React.FC<Props> = ({ onExit }) => {
  const { currentProfile, recordPracticeResult } = useAppStore();
  const letters = useMemo(() => mockLetters.filter(letter => completedLetterIds(currentProfile).includes(letter.id)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [run, setRun] = useState(0), [round, setRound] = useState(0), [caught, setCaught] = useState(false), [wrong, setWrong] = useState<string[]>([]);
  const targets = useMemo(() => { const order = shuffled(letters); return Array.from({ length: ROUNDS }, (_, i) => order[i % order.length]); }, [run, letters]); // eslint-disable-line react-hooks/exhaustive-deps
  const missed = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sky = skyHeight(useWindowDimensions().height);
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
  return <ScrollView contentContainerStyle={K.page}>
    <PlayHeader tone="amber" label={T.catch.ask} onSpeak={() => sayLetter(target.glyph)} counter={`${kurdishDigits(round + 1)} / ${kurdishDigits(ROUNDS)}`}>
      <Text style={[K.target, { color: PALETTE.rose.lip, backgroundColor: PALETTE.rose.soft, borderColor: PALETTE.rose.face }]}>{target.glyph}</Text>
    </PlayHeader>
    <LinearGradient colors={['#38bdf8', '#7dd3fc', '#cffafe']} style={[K.area, { height: sky }]}>{options.map((letter, i) => <Bubble key={`${run}-${round}-${letter.id}`} letter={letter} index={i} height={sky}
      state={caught && letter.id === target.id ? 'caught' : wrong.includes(letter.id) ? 'wrong' : 'idle'} onPress={() => tap(letter.id)} />)}</LinearGradient>
    {caught && <Text accessibilityLiveRegion="polite" style={K.cheer}>{T.right}</Text>}
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const TRAINS = 3;
/** A picture and empty carriages: the child taps the letters in order. A wrong letter just stays in the bank. */
export const TrainGame: React.FC<Props> = ({ onExit }) => {
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
  return <ScrollView contentContainerStyle={K.page}>
    <PlayHeader tone="amber" label={word.word} onSpeak={() => say(word.word)} counter={`${kurdishDigits(index + 1)} / ${kurdishDigits(queue.length)}`}>
      <CharacterPicture symbol="🚂" size={64} />
    </PlayHeader>
    <LinearGradient colors={['#fef3c7', '#ffedd5', '#fff7ed']} style={[K.area, local.trainArea]}>
      <View style={local.picCard}><CharacterPicture symbol={word.imageEmoji} size={110} /></View>
      <View style={K.row}>{word.units.map((glyph, i) => <View key={i} style={[K.tile, local.slot, i < filled && { backgroundColor: PALETTE.emerald.soft, borderColor: PALETTE.emerald.face, borderStyle: 'solid' }]}>{i < filled && <Text style={K.glyph}>{glyph}</Text>}</View>)}</View>
      <View style={K.row}>{bank.map(tile => <Tile key={tile.id} tone="amber" label={tile.glyph} state={wrong === tile.id ? 'wrong' : 'idle'} disabled={usedIds.includes(tile.id)} onPress={() => tap(tile)}
        style={usedIds.includes(tile.id) ? { opacity: 0.25 } : undefined}><Text style={K.glyph}>{tile.glyph}</Text></Tile>)}</View>
      {complete && <Text accessibilityLiveRegion="polite" style={K.cheer}>{T.right}</Text>}
      {complete && <TouchableOpacity accessibilityRole="button" accessibilityLabel={T.next} style={[K.big, { backgroundColor: PALETTE.emerald.face, borderBottomColor: PALETTE.emerald.lip }]} onPress={next}><Text style={[K.bigText, { color: PALETTE.emerald.ink }]}>{T.next}</Text></TouchableOpacity>}
    </LinearGradient>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const local = StyleSheet.create({
  card: { width: '30%', minHeight: 110, flexGrow: 1 },
  floater: { position: 'absolute', top: 0, width: BUBBLE, height: BUBBLE },
  bubble: { width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  bubbleText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 46, lineHeight: 62, color: '#ffffff', textShadowColor: '#00000055', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  shine: { position: 'absolute', top: 10, start: 16, width: 22, height: 12, borderRadius: 10, backgroundColor: '#ffffffaa', transform: [{ rotate: '-30deg' }] },
  caught: { backgroundColor: '#86efacdd', borderColor: '#16a34a', transform: [{ scale: 1.2 }] },
  wrong: { opacity: 0.3 },
  trainArea: { padding: 14, gap: 16, alignItems: 'center', borderColor: '#fde68a' },
  picCard: { padding: 10, borderRadius: 30, backgroundColor: '#ffffff', borderWidth: 4, borderColor: PALETTE.amber.face },
  slot: { borderStyle: 'dashed', borderColor: PALETTE.amber.lip, backgroundColor: '#ffffff', borderBottomWidth: 4, minWidth: 64 },
});
