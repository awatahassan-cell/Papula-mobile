import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Play, Volume2 } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { HighlightedWord } from '../../components/HighlightedWord';
import { LETTER_HIGHLIGHT_COLOR } from '../../services/letterHighlight';
import { CharacterPicture } from '../../components/CharacterPicture';
import { TactileButton } from '../../components/TactileButton';
import { useAppearance } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { soundService } from '../../services/soundService';
import { introWords } from '../../services/letterIntro';
import { SPOKEN_GUIDES } from '../../data/spokenGuides';
import { mockLetters } from '../../data/mockLetters';

type Letter = (typeof mockLetters)[number];
// Calm reading for small children: a clear rest after every word and after each time the letter is said.
const SAFETY_MS = 8000, WORD_PAUSE_MS = 1900, SLOW_WORD_RATE = 0.78, RED = LETTER_HIGHLIGHT_COLOR;

/**
 * The start of a letter's journey, all by ear: the letter is said a few times, then «the letter is in these words»
 * and five pictures are named one by one. Only then does the practice begin.
 */
export function LetterIntro({ letter, onDone }: { letter: Letter; onDone: () => void }) {
  const { colors: c, isNight } = useAppearance();
  const words = useMemo(() => introWords(letter, text => soundService.canSpeak(text)), [letter]);
  const stage = 'words' as const; // «letter X is in these words» is the first screen of the letter
  const [current, setCurrent] = useState(-1), [again, setAgain] = useState(0);
  const run = useRef(0), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const stopAll = () => { run.current++; timers.current.forEach(clearTimeout); timers.current = []; void soundService.stopSpeaking(); };
  useEffect(() => stopAll, []);

  /** Says one thing and carries on when it ends; a missing or stuck recording never holds the child up. */
  const speak = (token: number, text: string, options: Record<string, unknown>, next: () => void, pause: number) => {
    if (token !== run.current) return;
    let moved = false;
    const go = () => { if (moved || token !== run.current) return; moved = true; next(); };
    later(go, SAFETY_MS + pause);
    void soundService.speakWord(text, { ...options, onEnd: () => later(go, pause), onError: go });
  };
  useEffect(() => {
    stopAll();
    const token = run.current;
    {
      const parts: { text: string; index: number; letterName?: string }[] = [
        { text: `پیتی ${letter.name}`, index: -1 },
        ...(soundService.canSpeak(SPOKEN_GUIDES.letterWords) ? [{ text: SPOKEN_GUIDES.letterWords, index: -1 }] : []),
        ...words.map((item, index) => ({ text: item.word, index })),
      ].filter(part => soundService.canSpeak(part.text)); // a word without a recording is shown but not spoken
      const say = (n: number) => {
        if (token !== run.current) return;
        if (n === parts.length) { setCurrent(-1); return; }
        setCurrent(parts[n].index);
        speak(token, parts[n].text, parts[n].index >= 0 ? { playbackRate: SLOW_WORD_RATE } : {}, () => say(n + 1), WORD_PAUSE_MS);
      };
      later(() => say(0), 700);
    }
    return stopAll;
  }, [stage, again]); // eslint-disable-line react-hooks/exhaustive-deps

  const fill = accentFill(c, isNight);
  const play = <TactileButton accessibilityRole="button" accessibilityLabel="دەست پێ بکە" onPress={() => { stopAll(); onDone(); }} style={[s.go, { backgroundColor: fill }]}><Play size={40} color="#ffffff" fill="#ffffff" /></TactileButton>;
  const replay = () => { setCurrent(-1); setAgain(n => n + 1); };
  return <ScrollView testID="letter-intro" contentContainerStyle={[s.page, { backgroundColor: c.background }]}>
    <View style={s.top}>
      <TactileButton accessibilityRole="button" accessibilityLabel="دووبارە ببیستە" onPress={replay} style={[s.round, { backgroundColor: c.sky }]}><Volume2 size={30} color={c.mint} /></TactileButton>
    </View>
    {<>
        <TactileButton accessibilityRole="button" accessibilityLabel={letter.name} onPress={() => { stopAll(); setCurrent(-1); void soundService.speakWord(letter.glyph, { letterName: letter.name }); }} style={[s.smallCard, { backgroundColor: c.paper, borderColor: c.mint }]}><Text style={[s.mid, { color: RED }]}>{letter.glyph}</Text></TactileButton>
        <View style={s.grid}>{words.map((item, i) => <TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={item.word} onPress={() => { stopAll(); setCurrent(i); void soundService.speakWord(item.word, { playbackRate: SLOW_WORD_RATE }); }}
          style={[s.word, { backgroundColor: c.paper, borderColor: current === i ? '#f59e0b' : c.edge }, current === i && s.on]}>
          <CharacterPicture symbol={item.picture} size={72} animate={false} /><HighlightedWord word={item.word} glyph={letter.glyph} style={[s.wordText, { color: c.ink }]}/></TactileButton>)}</View>
      </>}
    {play}
  </ScrollView>;
}

const s = StyleSheet.create({
  page: { flexGrow: 1, padding: 14, gap: 14, alignItems: 'center', width: '100%', maxWidth: 650, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  round: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bigCard: { width: '100%', minHeight: 300, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  huge: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 190, lineHeight: 250, textAlign: 'center' },
  smallCard: { minWidth: 120, paddingHorizontal: 24, borderRadius: 28, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  mid: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 76, lineHeight: 104, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  word: { width: '30%', minWidth: 100, flexGrow: 1, minHeight: 126, borderRadius: 24, borderWidth: 4, borderBottomWidth: 7, alignItems: 'center', justifyContent: 'center', gap: 2, padding: 6 },
  on: { transform: [{ scale: 1.07 }] },
  wordText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19, textAlign: 'center' },
  go: { width: '100%', maxWidth: 360, minHeight: 72, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' },
});
