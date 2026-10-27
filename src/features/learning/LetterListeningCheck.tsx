import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Volume2 } from 'lucide-react-native';
import { mockLetters } from '../../data/mockLetters';
import { Text } from '../../components/RTLText';
import { BackButton } from '../../components/BackButton';
import { TactileButton } from '../../components/TactileButton';
import { useAppStore } from '../../store/useAppStore';
import { soundService } from '../../services/soundService';
import { letterCheckOptions } from '../../services/letterChecks';
import { exerciseHelp } from '../../services/exerciseHelp';
import { useAppearance } from '../../theme/useAppearance';

/** No model, picture, coloured answer or target glyph: only the first heard answer is evidence. */
export function LetterListeningCheck({ letterId, onExit }: { letterId: string; onExit: () => void }) {
  const { recordLetterCheck } = useAppStore();
  const { colors: c } = useAppearance();
  const letter = mockLetters.find(item => item.id === letterId)!;
  const [options] = useState(() => letterCheckOptions(letterId));
  const [heard, setHeard] = useState(false), [error, setError] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const generation = useRef(0), ready = useRef(false), answered = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const play = useCallback(() => {
    const active = ++generation.current;
    clearTimeout(timeout.current);
    ready.current = false; setHeard(false); setError(false);
    const fail = () => {
      if (active !== generation.current) return;
      generation.current++; clearTimeout(timeout.current); ready.current = false; setHeard(false); setError(true);
      void soundService.stopSpeaking();
    };
    timeout.current = setTimeout(fail, 20000);
    const target = () => {
      if (active !== generation.current) return;
      void soundService.speakWord(letter.glyph, { letterName: letter.name,
        onEnd: () => { if (active === generation.current) { clearTimeout(timeout.current); ready.current = true; setHeard(true); } }, onError: fail });
    };
    void soundService.speakWord(exerciseHelp.letter, { onEnd: target, onError: fail });
  }, [letter]);
  useFocusEffect(useCallback(() => {
    play();
    return () => { generation.current++; clearTimeout(timeout.current); ready.current = false; void soundService.stopSpeaking(); };
  }, [play]));
  const pick = (id: string) => {
    if (!ready.current || answered.current) return;
    answered.current = true; generation.current++; setAnswer(id);
    recordLetterCheck(letterId, id === letterId);
    if (id === letterId) soundService.playCorrect(); else soundService.playEncouragingTryAgain();
  };
  return <ScrollView contentContainerStyle={s.page}>
    <Text style={[s.title, { color: c.ink }]}>گوێ بگرە و هەڵبژێرە</Text>
    <TactileButton accessibilityRole="button" accessibilityLabel="دەنگەکە دووبارە ببیستە" disabled={answer !== null} onPress={play} style={[s.speaker, { backgroundColor: c.lavender }]}><Volume2 size={52} color={c.mint}/></TactileButton>
    <View style={s.options}>{options.map(item => <TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={`پیتی ${item.name}`} disabled={!heard || answer !== null} onPress={() => pick(item.id)} style={[s.option, { backgroundColor: c.paper, borderColor: answer !== null && item.id === letterId ? c.mint : c.edge }]}><Text style={[s.glyph, { color: c.ink }]}>{item.glyph}</Text></TactileButton>)}</View>
    {error && <Text accessibilityLiveRegion="polite" style={{ color: c.ink }}>دەنگەکە نەهات؛ دووبارە دەست لە دەنگ بدە.</Text>}
    {answer !== null && <Text accessibilityLiveRegion="polite" style={[s.feedback, { color: c.ink }]}>{answer === letterId ? 'ئافەرین!' : 'هەوڵێکی باش بوو. پیتی دروست نیشان کراوە؛ جارێکی تر مەشقی دەکەین.'}</Text>}
    <BackButton fullWidth onPress={onExit}>{answer === null ? 'دواتر دەیکەم' : 'بەردەوام بە'}</BackButton>
  </ScrollView>;
}
const s = StyleSheet.create({ page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 18, gap: 24, width: '100%', maxWidth: 620, alignSelf: 'center' }, title: { fontSize: 23, textAlign: 'center', lineHeight: 38 }, speaker: { width: 104, height: 104, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }, options: { flexDirection: 'row', gap: 12, width: '100%' }, option: { flex: 1, minHeight: 104, borderRadius: 24, borderWidth: 3, justifyContent: 'center', alignItems: 'center' }, glyph: { fontSize: 47, lineHeight: 76 }, feedback: { textAlign: 'center', fontSize: 18, lineHeight: 32 } });
