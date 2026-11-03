import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/RTLText';
import { CharacterPicture } from '../../components/CharacterPicture';
import { TactileButton } from '../../components/TactileButton';
import { useAppStore } from '../../store/useAppStore';
import { soundService } from '../../services/soundService';
import { todaysLetter } from '../../services/lessonPath';
import { getLetterStory } from '../../data/letterStories';
import { SPOKEN_GUIDES } from '../../data/spokenGuides';
import { DAY_DONE_TEXT as T } from './homeText';

/**
 * Today's letter is done and the next one waits for tomorrow. The child is sent to three things by picture:
 * games, the story of today's letter, and a look back at the earlier letters.
 */
let playedOn = ''; // the spoken welcome plays once a day by itself; the speaker button repeats it
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

export function DayDone() {
  const { currentProfile, setRoute, setSelectedStory, setSelectedLetter } = useAppStore();
  const letter = todaysLetter(currentProfile);
  const story = letter ? getLetterStory(letter.id) : undefined;
  const token = useRef(0);
  /** «Today's letter is …», then the letter's name, then the nudge to practise more. A line without a recording is skipped. */
  const say = useCallback(() => {
    if (!letter) return;
    const mine = ++token.current;
    const parts = [SPOKEN_GUIDES.todayLetter, `پیتی ${letter.name}`, SPOKEN_GUIDES.morePractice].filter(text => soundService.canSpeak(text));
    const run = (i: number) => { if (mine !== token.current || i >= parts.length) return; let moved = false; const go = () => { if (!moved) { moved = true; setTimeout(() => run(i + 1), 500); } }; void soundService.speakWord(parts[i], { onEnd: go, onError: go }); };
    run(0);
  }, [letter]);
  useEffect(() => {
    if (playedOn !== localDay()) { playedOn = localDay(); say(); }
    const counter = token;
    return () => { counter.current++; void soundService.stopSpeaking(); };
  }, [say]);
  const open = (action: () => void) => () => { void soundService.stopSpeaking(); action(); };
  return <View testID="day-done" style={s.wrap}>
    <View style={s.top}><CharacterPicture symbol="🌙" size={44} animate={false} />{letter && <Text accessibilityLabel={T.todayLetter(letter.name)} style={s.glyph}>{letter.glyph}</Text>}<CharacterPicture symbol="⭐" size={36} animate={false} />
      <TactileButton accessibilityRole="button" accessibilityLabel={T.todayLetter(letter?.name || '')} onPress={say} style={s.speak}><CharacterPicture symbol="🔊" size={30} animate={false} /></TactileButton></View>
    <View style={s.row}>
      <TactileButton accessibilityRole="button" accessibilityLabel={T.games} onPress={open(() => setRoute('match-game'))} style={[s.tile, s.games]}><CharacterPicture symbol="🎮" size={64} animate={false} /></TactileButton>
      {story && <TactileButton accessibilityRole="button" accessibilityLabel={T.story} onPress={open(() => { if (letter) setSelectedLetter(letter); setSelectedStory(story); setRoute('story-reader'); })} style={[s.tile, s.story]}><CharacterPicture symbol="📖" size={64} animate={false} /></TactileButton>}
      <TactileButton accessibilityRole="button" accessibilityLabel={T.review} onPress={open(() => setRoute('daily-practice'))} style={[s.tile, s.review]}><CharacterPicture symbol="🌱" size={64} animate={false} /></TactileButton>
    </View>
  </View>;
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 12, alignItems: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  speak: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 56, lineHeight: 100, color: '#dc2626', fontFamily: 'IBMPlexSansArabic_700Bold' },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', justifyContent: 'center' },
  tile: { flex: 1, maxWidth: 150, minHeight: 112, borderRadius: 28, borderWidth: 4, borderBottomWidth: 8, alignItems: 'center', justifyContent: 'center' },
  games: { backgroundColor: '#ede9fe', borderColor: '#a78bfa', borderBottomColor: '#6d28d9' },
  story: { backgroundColor: '#ffe4e6', borderColor: '#fb7185', borderBottomColor: '#be123c' },
  review: { backgroundColor: '#d1fae5', borderColor: '#34d399', borderBottomColor: '#047857' },
});
