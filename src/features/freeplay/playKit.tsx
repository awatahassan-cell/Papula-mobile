import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { BackButton } from '../../components/BackButton';
import { CharacterPicture } from '../../components/CharacterPicture';
import { Text } from '../../components/RTLText';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { soundService } from '../../services/soundService';
import { mockLetters } from '../../data/mockLetters';
import { FREE_PLAY_TEXT as T } from './freePlayText';

export const say = (text: string) => { if (soundService.canSpeak(text)) void soundService.speakWord(text); };
export const sayLetter = (glyph: string) => { const letter = mockLetters.find(item => item.glyph === glyph); void soundService.speakWord(glyph, { letterName: letter?.name }); };
export const canSay = (text: string) => soundService.canSpeak(text);
export const useStop = () => useEffect(() => () => { void soundService.stopSpeaking(); }, []);

/** Bright, toy-like colours: every game has its own thick border colour, a coloured play area and raised buttons. */
export const PALETTE = {
  amber: { face: '#fbbf24', lip: '#d97706', soft: '#fef3c7', ink: '#451a03' },
  emerald: { face: '#34d399', lip: '#047857', soft: '#d1fae5', ink: '#064e3b' },
  purple: { face: '#a78bfa', lip: '#6d28d9', soft: '#ede9fe', ink: '#3b0764' },
  rose: { face: '#fb7185', lip: '#be123c', soft: '#ffe4e6', ink: '#4c0519' },
  sky: { face: '#38bdf8', lip: '#0369a1', soft: '#e0f2fe', ink: '#082f49' },
  indigo: { face: '#818cf8', lip: '#4338ca', soft: '#e0e7ff', ink: '#1e1b4b' },
};
export type Tone = keyof typeof PALETTE;
export const BUBBLE_COLOURS = [PALETTE.rose, PALETTE.amber, PALETTE.emerald, PALETTE.sky, PALETTE.purple, PALETTE.indigo];

export const K = StyleSheet.create({
  page: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14, gap: 10, width: '100%', maxWidth: 720, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 26, borderWidth: 4, backgroundColor: '#ffffff', width: '100%' },
  prompt: { flex: 1, minWidth: 0 },
  target: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 40, lineHeight: 54, textAlign: 'center', minWidth: 72, borderRadius: 18, borderWidth: 3, paddingHorizontal: 8 },
  count: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#334155', textAlign: 'center' },
  speaker: { width: 64, height: 64, borderRadius: 24, borderBottomWidth: 6, alignItems: 'center', justifyContent: 'center' },
  area: { width: '100%', borderRadius: 30, borderWidth: 4, borderColor: '#ffffff', overflow: 'hidden' },
  big: { minHeight: 64, borderRadius: 24, borderBottomWidth: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  bigText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  tile: { minWidth: 76, minHeight: 76, borderRadius: 24, borderWidth: 4, borderBottomWidth: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 40, lineHeight: 56, textAlign: 'center', color: '#1e1b4b' },
  cheer: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, textAlign: 'center', color: '#047857' },
});

/** Top card of a game: a big speaker button, the target (a letter or a picture) and a small counter. */
export const PlayHeader: React.FC<{ tone: Tone; onSpeak: () => void; label: string; children?: React.ReactNode; counter?: string }> = ({ tone, onSpeak, label, children, counter }) => {
  const p = PALETTE[tone];
  return <View style={[K.head, { borderColor: p.face }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onSpeak} style={[K.speaker, { backgroundColor: p.face, borderBottomColor: p.lip }]}><Volume2 size={36} color="#ffffff" strokeWidth={2.5} /></TouchableOpacity>
    <View style={K.prompt}>{children}</View>
    {!!counter && <Text style={K.count}>{counter}</Text>}
  </View>;
};

/** A raised, colourful tile: 3D lip that sinks when pressed (TactileButton). */
export const Tile: React.FC<{ tone: Tone; onPress: () => void; label: string; children: React.ReactNode; state?: 'idle' | 'right' | 'wrong' | 'done'; disabled?: boolean; style?: object }> = ({ tone, onPress, label, children, state = 'idle', disabled, style }) => {
  const p = PALETTE[tone];
  const colours = state === 'right' || state === 'done' ? { backgroundColor: PALETTE.emerald.soft, borderColor: PALETTE.emerald.face, borderBottomColor: PALETTE.emerald.lip }
    : state === 'wrong' ? { backgroundColor: PALETTE.rose.soft, borderColor: PALETTE.rose.face, borderBottomColor: PALETTE.rose.lip }
      : { backgroundColor: '#ffffff', borderColor: p.face, borderBottomColor: p.lip };
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[K.tile, colours, state === 'done' && { opacity: 0.55 }, style]}>{children}</TouchableOpacity>;
};

/** Finished screen shared by the free-play games. */
export const Finish: React.FC<{ onAgain: () => void; onExit: () => void }> = ({ onAgain, onExit }) => (
  <ScrollView contentContainerStyle={[K.page, { alignItems: 'center', paddingTop: 30, gap: 16 }]}>
    <CharacterPicture symbol="🦋" size={140} /><CharacterPicture symbol="🌟" size={72} animate={false} />
    <Text style={K.cheer}>{T.done}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={T.again} style={[K.big, { backgroundColor: PALETTE.amber.face, borderBottomColor: PALETTE.amber.lip }]} onPress={onAgain}><Text style={[K.bigText, { color: PALETTE.amber.ink }]}>{T.again}</Text></TouchableOpacity>
    <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
  </ScrollView>
);
