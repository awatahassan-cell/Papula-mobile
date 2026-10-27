import React, { useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { BackButton } from '../../components/BackButton';
import { CharacterPicture } from '../../components/CharacterPicture';
import { Text } from '../../components/RTLText';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { soundService } from '../../services/soundService';
import { kurdishDigits } from '../../services/rewards';
import { useAppStore } from '../../store/useAppStore';
import { CONFUSABLE_GROUPS, LearningWord, shuffled } from '../../services/learningEngine';
import { completedLetterIds } from '../../services/lessonPath';
import { mockLetters } from '../../data/mockLetters';
import { matchWords, similarPairs, trainWords } from '../../services/freePlay';
import { Finish, GameGuide, K, PALETTE, PlayHeader, Tile, Tone, canSay, say, sayLetter, useStop } from './playKit';
import { FREE_PLAY_TEXT as T, FREE_PLAY_GUIDES } from './freePlayText';

/** Touch coordinates are physical, but `left` flips to the right edge under forced RTL; `right` flips back. */
const fromLeft = (x: number) => (I18nManager.isRTL ? { right: x } : { left: x });

type Props = { onExit: () => void };
type Letter = (typeof mockLetters)[number];
const letterIdOf = (glyph: string) => mockLetters.find(item => item.glyph === glyph)?.id;
const randomInt = (n: number) => Math.floor(Math.random() * n);
const coin = () => Math.random() < 0.5;
const counter = (a: number, b: number) => `${kurdishDigits(a)} / ${kurdishDigits(b)}`;

const BASKET = 96, CATCHES = 6;
type Drop = { x: number; y: number; speed: number; letter: Letter };
/** Letters drift down slowly; the child drags the basket under the one that was named. A wrong letter just falls past. */
export const BasketGame: React.FC<Props> = ({ onExit }) => {
  const { currentProfile, recordPracticeResult } = useAppStore();
  const letters = useMemo(() => mockLetters.filter(letter => completedLetterIds(currentProfile).includes(letter.id)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [run, setRun] = useState(0), [score, setScore] = useState(0), [width, setWidth] = useState(0), [basketX, setBasketX] = useState(0), [drops, setDrops] = useState<Drop[]>([]);
  const target = useMemo<Letter>(() => shuffled(letters)[0], [run, letters]); // eslint-disable-line react-hooks/exhaustive-deps
  const height = Math.max(326, Math.min(566, useWindowDimensions().height - 404));
  const basket = useRef(0);
  const missed = useRef(false);
  const moveBasket = (x: number) => { basket.current = x; setBasketX(x); };
  useStop();
  useEffect(() => {
    if (!width) return;
    const others = letters.filter(letter => letter.id !== target.id);
    const make = (): Drop => ({ x: 34 + Math.random() * Math.max(10, width - 68), y: -30 - Math.random() * 160, speed: 1.1 + Math.random() * 0.9, letter: Math.random() < 0.45 || !others.length ? target : others[randomInt(others.length)] });
    const sim = [make(), make(), make()];
    let frame = 0, last = Date.now(), caught = 0;
    const loop = () => {
      const now = Date.now(), step = Math.min(3, (now - last) / 16); last = now;
      const top = height - BASKET + 14;
      sim.forEach((item, index) => {
        item.y += item.speed * step;
        if (item.y + 26 >= top && item.y - 26 <= top + 50 && Math.abs(item.x - basket.current) <= BASKET / 2 + 6) {
          if (item.letter.id === target.id) {
            soundService.playCorrect(false); caught += 1; setScore(caught);
            if (caught === CATCHES && !missed.current) recordPracticeResult([target.id], true, undefined, 'recognition', true);
          } else {
            if (!missed.current) recordPracticeResult([target.id], false, undefined, 'recognition', true);
            missed.current = true; soundService.playEncouragingTryAgain();
          }
          sim[index] = make();
        } else if (item.y > height + 40) sim[index] = make();
      });
      setDrops(sim.map(item => ({ ...item })));
      if (caught < CATCHES) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width, run, target, letters, height]); // eslint-disable-line react-hooks/exhaustive-deps
  if (score >= CATCHES) return <Finish onAgain={() => { missed.current = false; setScore(0); setRun(r => r + 1); }} onExit={onExit} />;
  return <ScrollView scrollEnabled={false} contentContainerStyle={K.page}>
    <GameGuide game="basket" target={target.glyph} letter/>
    <PlayHeader tone="emerald" label={T.basket.ask} onSpeak={() => sayLetter(target.glyph)} counter={counter(score, CATCHES)}>
      <Text style={[K.target, { color: PALETTE.emerald.lip, backgroundColor: PALETTE.emerald.soft, borderColor: PALETTE.emerald.face, borderBottomColor: PALETTE.emerald.lip }]}>{target.glyph}</Text>
    </PlayHeader>
    <LinearGradient colors={['#a7f3d0', '#ccfbf1', '#fef3c7']} style={[K.area, { height, borderColor: '#34d399', borderBottomColor: '#059669' }]} onLayout={event => { const w = event.nativeEvent.layout.width; basket.current = w / 2; setBasketX(w / 2); setWidth(w); }} onTouchStart={event => moveBasket(event.nativeEvent.locationX)} onTouchMove={event => moveBasket(event.nativeEvent.locationX)}>
      {drops.map((item, i) => <View key={i} pointerEvents="none" style={[local.drop, { ...fromLeft(item.x - 28), top: item.y - 28, borderColor: PALETTE.emerald.face }]}><Text style={local.dropText}>{item.letter.glyph}</Text></View>)}
      <View pointerEvents="none" style={[local.basket, { ...fromLeft(Math.max(0, Math.min(width - BASKET, basketX - BASKET / 2))), top: height - BASKET - 4 }]}><CharacterPicture symbol="🧺" size={BASKET} animate={false} /></View>
    </LinearGradient>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const ODD_ROUNDS = 5;
/** Three of one letter and one look-alike: the child taps the one that is different. */
export const OddGame: React.FC<Props> = ({ onExit }) => {
  const { currentProfile, recordPracticeResult } = useAppStore();
  const pairs = useMemo(() => similarPairs(currentProfile), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [run, setRun] = useState(0), [round, setRound] = useState(0), [wrong, setWrong] = useState<number[]>([]), [won, setWon] = useState(false);
  const rounds = useMemo(() => Array.from({ length: ODD_ROUNDS }, () => {
    const [a, b] = pairs[randomInt(pairs.length)], flip = coin(), main = flip ? b : a, odd = flip ? a : b;
    const place = randomInt(4);
    return { main, odd, place, glyphs: [0, 1, 2, 3].map(i => (i === place ? odd : main)) };
  }), [run, pairs]); // eslint-disable-line react-hooks/exhaustive-deps
  const missed = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const accepted = useRef(false);
  useStop(); useEffect(() => () => clearTimeout(timer.current), []);
  const current = rounds[round];
  if (round >= ODD_ROUNDS) return <Finish onAgain={() => { setRun(r => r + 1); setRound(0); }} onExit={onExit} />;
  const pick = (index: number) => {
    if (accepted.current || won || wrong.includes(index)) return;
    const ids = [letterIdOf(current.main), letterIdOf(current.odd)].filter((id): id is string => !!id);
    if (index === current.place) {
      accepted.current = true;
      if (!missed.current) recordPracticeResult(ids, true, undefined, 'recognition', false);
      setWon(true); soundService.playCorrect(); sayLetter(current.odd);
      timer.current = setTimeout(() => { accepted.current = false; setWon(false); setWrong([]); missed.current = false; setRound(r => r + 1); }, 1300);
    } else { if (!missed.current) recordPracticeResult(ids, false, undefined, 'recognition', false); missed.current = true; setWrong(list => [...list, index]); soundService.playEncouragingTryAgain(); }
  };
  return <ScrollView contentContainerStyle={K.page}>
    <GameGuide game="odd"/>
    <PlayHeader tone="purple" label={T.odd.ask} onSpeak={() => soundService.speakWord(FREE_PLAY_GUIDES.odd)} counter={counter(round + 1, ODD_ROUNDS)}><CharacterPicture symbol="👁" size={64} /></PlayHeader>
    <LinearGradient colors={['#ede9fe', '#fae8ff', '#ffffff']} style={[K.area, local.oddArea]}>
      <View style={K.row}>{current.glyphs.map((glyph, i) => <Tile key={`${round}-${i}`} tone="purple" label={glyph} state={won && i === current.place ? 'right' : wrong.includes(i) ? 'wrong' : 'idle'} onPress={() => pick(i)} style={local.oddTile}>
        <Text style={[K.glyph, { fontSize: 56, lineHeight: 76, color: PALETTE.purple.ink }]}>{glyph}</Text></Tile>)}</View>
    </LinearGradient>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

/** Two columns: letters on one side and pictures on the other. The child taps a letter and then its picture. */
export const MatchLettersGame: React.FC<Props> = ({ onExit }) => {
  const { currentProfile, recordPracticeResult } = useAppStore();
  const [run, setRun] = useState(0);
  const words = useMemo<LearningWord[]>(() => matchWords(currentProfile, canSay), [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = useMemo(() => shuffled(words), [words]), right = useMemo(() => shuffled(words), [words]);
  const [letter, setLetter] = useState<string | null>(null), [picture, setPicture] = useState<string | null>(null), [done, setDone] = useState<string[]>([]), [bad, setBad] = useState<string[]>([]);
  const missed = useRef<string[]>([]), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const judged = useRef(new Set<string>()), judging = useRef(false);
  useStop(); useEffect(() => () => clearTimeout(timer.current), []);
  if (words.length && done.length === words.length) return <Finish onAgain={() => { judged.current.clear(); judging.current = false; setDone([]); setLetter(null); setPicture(null); missed.current = []; setRun(r => r + 1); }} onExit={onExit} />;
  const judge = (l: string, p: string) => {
    if (judging.current || judged.current.has(l)) return;
    if (l === p) {
      judged.current.add(l);
      const word = words.find(item => item.id === l)!;
      if (!missed.current.includes(l)) recordPracticeResult([word.letterIds[0]], true, undefined, 'phonics', true);
      soundService.playCorrect(); say(word.word); setDone(list => [...list, l]); setLetter(null); setPicture(null);
    } else {
      judging.current = true;
      const word = words.find(item => item.id === l)!;
      if (!missed.current.includes(l)) recordPracticeResult([word.letterIds[0]], false, undefined, 'phonics', true);
      missed.current.push(l); setBad([l, p]); soundService.playEncouragingTryAgain();
      timer.current = setTimeout(() => { judging.current = false; setBad([]); setLetter(null); setPicture(null); }, 600);
    }
  };
  const chooseLetter = (word: LearningWord) => { if (done.includes(word.id) || bad.length) return; sayLetter(word.units[0]); setLetter(word.id); if (picture) judge(word.id, picture); };
  const choosePicture = (word: LearningWord) => { if (done.includes(word.id) || bad.length) return; say(word.word); setPicture(word.id); if (letter) judge(letter, word.id); };
  const stateOf = (id: string, side: 'l' | 'p') => done.includes(id) ? 'done' : bad.includes(id) && (side === 'l' ? letter === id : picture === id) ? 'wrong' : 'idle';
  return <ScrollView contentContainerStyle={K.page}>
    <GameGuide game="match"/>
    <PlayHeader tone="indigo" label={T.match.ask} onSpeak={() => letter && sayLetter(words.find(item => item.id === letter)?.units[0] || '')} counter={counter(done.length, words.length)}><CharacterPicture symbol="🖼" size={64} /></PlayHeader>
    <LinearGradient colors={['#e0e7ff', '#dbeafe', '#ffffff']} style={[K.area, local.matchArea]}>
      <View style={local.column}>{left.map((word, i) => <Tile key={word.id} tone={(['rose', 'amber', 'emerald', 'sky'] as Tone[])[i % 4]} label={word.units[0]} state={stateOf(word.id, 'l')} onPress={() => chooseLetter(word)} style={[local.matchTile, letter === word.id && local.picked]}>
        <Text style={[K.glyph, { fontSize: 48, lineHeight: 64 }]}>{word.units[0]}</Text></Tile>)}</View>
      <View style={local.column}>{right.map(word => <Tile key={word.id} tone="indigo" label={word.word} state={stateOf(word.id, 'p')} onPress={() => choosePicture(word)} style={[local.matchTile, picture === word.id && local.picked]}>
        <CharacterPicture symbol={word.imageEmoji} size={64} animate={false} /></Tile>)}</View>
    </LinearGradient>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const FILLS = 3;
/** A picture and its word with one carriage missing: the child picks the missing letter from three. */
export const FillGame: React.FC<Props> = ({ onExit }) => {
  const { currentProfile, recordPracticeResult } = useAppStore();
  const [run, setRun] = useState(0), [index, setIndex] = useState(0), [done, setDone] = useState(false), [wrong, setWrong] = useState<string[]>([]);
  const known = useMemo(() => mockLetters.filter(letter => completedLetterIds(currentProfile).includes(letter.id)).map(letter => letter.glyph), []); // eslint-disable-line react-hooks/exhaustive-deps
  const queue = useMemo(() => shuffled(trainWords(currentProfile, canSay)).slice(0, FILLS).map(word => {
    const missing = randomInt(word.units.length), answer = word.units[missing];
    const answerId = letterIdOf(answer);
    const group = answerId ? (CONFUSABLE_GROUPS.find(g => g.includes(answerId)) || []) : [];
    const confusableGlyphs = mockLetters.filter(l => group.includes(l.id) && l.glyph !== answer && known.includes(l.glyph)).map(l => l.glyph);
    const otherGlyphs = shuffled(known.filter(glyph => glyph !== answer && !confusableGlyphs.includes(glyph)));
    return { word, missing, answer, options: shuffled([answer, ...[...shuffled(confusableGlyphs), ...otherGlyphs].slice(0, 2)]) };
  }), [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const missed = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const accepted = useRef(false);
  useStop(); useEffect(() => () => clearTimeout(timer.current), []);
  const item = queue[index];
  if (!item) return <Finish onAgain={() => { setRun(r => r + 1); setIndex(0); }} onExit={onExit} />;
  const pick = (glyph: string) => {
    if (accepted.current || done || wrong.includes(glyph)) return;
    if (glyph === item.answer) {
      accepted.current = true;
      if (!missed.current) recordPracticeResult(item.word.letterIds, true, item.word.id, 'word', false);
      setDone(true); soundService.playCorrect(); say(item.word.word);
    } else { if (!missed.current) recordPracticeResult(item.word.letterIds, false, item.word.id, 'word', false); missed.current = true; setWrong(list => [...list, glyph]); soundService.playEncouragingTryAgain(); }
  };
  const next = () => { accepted.current = false; setDone(false); setWrong([]); missed.current = false; setIndex(index + 1); };
  return <ScrollView contentContainerStyle={K.page}>
    <GameGuide game="fill" target={item.word.word}/>
    <PlayHeader tone="rose" label={item.word.word} onSpeak={() => say(item.word.word)} counter={counter(index + 1, queue.length)}><CharacterPicture symbol="🔍" size={64} /></PlayHeader>
    <LinearGradient colors={['#ffe4e6', '#fef3c7', '#ffffff']} style={[K.area, local.trainArea]}>
      <View style={local.picCard}><CharacterPicture symbol={item.word.imageEmoji} size={110} /></View>
      <View style={K.row}>{item.word.units.map((glyph, i) => <View key={i} style={[K.tile, local.slot, (i !== item.missing || done) && { borderStyle: 'solid', borderColor: i === item.missing ? PALETTE.emerald.face : PALETTE.rose.face, backgroundColor: i === item.missing ? PALETTE.emerald.soft : '#ffffff' }]}>
        <Text style={K.glyph}>{i === item.missing && !done ? '؟' : glyph}</Text></View>)}</View>
      <View style={K.row}>{item.options.map(glyph => <Tile key={glyph} tone="rose" label={glyph} state={wrong.includes(glyph) ? 'wrong' : done && glyph === item.answer ? 'right' : 'idle'} onPress={() => pick(glyph)}>
        <Text style={K.glyph}>{glyph}</Text></Tile>)}</View>
      {done && <Text accessibilityLabel={item.word.word} style={[K.glyph, { writingDirection: 'rtl' }]}>{item.word.word}</Text>}
      {done && <Text accessibilityLiveRegion="polite" style={K.cheer}>{T.right}</Text>}
      {done && <TouchableOpacity accessibilityRole="button" accessibilityLabel={T.next} style={[K.big, { backgroundColor: PALETTE.emerald.face, borderBottomColor: PALETTE.emerald.lip }]} onPress={next}><Text style={[K.bigText, { color: PALETTE.emerald.ink }]}>{T.next}</Text></TouchableOpacity>}
    </LinearGradient>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>;
};

const local = StyleSheet.create({
  drop: { position: 'absolute', width: 58, height: 58, borderRadius: 29, borderWidth: 4, borderBottomWidth: 6, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  dropText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 30, lineHeight: 42, color: '#1e293b' },
  basket: { position: 'absolute', width: BASKET, height: BASKET },
  oddArea: { padding: 16, alignItems: 'center', borderColor: '#c4b5fd', borderBottomColor: '#7c3aed' },
  oddTile: { width: '44%', minHeight: 120 },
  matchArea: { flexDirection: 'row', gap: 12, padding: 12, borderColor: '#a5b4fc', borderBottomColor: '#4f46e5' },
  column: { flex: 1, gap: 12 },
  matchTile: { minHeight: 92, width: '100%' },
  picked: { transform: [{ scale: 1.06 }], borderColor: '#f59e0b', borderBottomColor: '#d97706' },
  trainArea: { padding: 14, gap: 16, alignItems: 'center', borderColor: '#fda4af', borderBottomColor: '#e11d48' },
  picCard: { padding: 10, borderRadius: 30, backgroundColor: '#ffffff', borderWidth: 4, borderBottomWidth: 7, borderColor: PALETTE.rose.face, borderBottomColor: PALETTE.rose.lip },
  slot: { borderStyle: 'dashed', borderColor: PALETTE.rose.lip, backgroundColor: '#ffffff', borderBottomWidth: 5, minWidth: 66 },
});
