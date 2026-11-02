import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/RTLText';
import { CharacterPicture } from '../../components/CharacterPicture';
import { TactileButton } from '../../components/TactileButton';
import { useAppStore } from '../../store/useAppStore';
import { soundService } from '../../services/soundService';
import { todaysLetter } from '../../services/lessonPath';
import { getLetterStory } from '../../data/letterStories';
import { DAY_DONE_TEXT as T } from './homeText';

/**
 * Today's letter is done and the next one waits for tomorrow. The child is sent to three things by picture:
 * games, the story of today's letter, and a look back at the earlier letters.
 */
export function DayDone() {
  const { currentProfile, setRoute, setSelectedStory, setSelectedLetter } = useAppStore();
  const letter = todaysLetter(currentProfile);
  const story = letter ? getLetterStory(letter.id) : undefined;
  const open = (action: () => void) => () => { void soundService.stopSpeaking(); action(); };
  return <View testID="day-done" style={s.wrap}>
    <View style={s.top}><CharacterPicture symbol="🌙" size={44} animate={false} />{letter && <Text accessibilityLabel={T.todayLetter(letter.name)} style={s.glyph}>{letter.glyph}</Text>}<CharacterPicture symbol="⭐" size={36} animate={false} /></View>
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
  glyph: { fontSize: 56, lineHeight: 78, color: '#dc2626', fontFamily: 'IBMPlexSansArabic_700Bold' },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', justifyContent: 'center' },
  tile: { flex: 1, maxWidth: 150, minHeight: 112, borderRadius: 28, borderWidth: 4, borderBottomWidth: 8, alignItems: 'center', justifyContent: 'center' },
  games: { backgroundColor: '#ede9fe', borderColor: '#a78bfa', borderBottomColor: '#6d28d9' },
  story: { backgroundColor: '#ffe4e6', borderColor: '#fb7185', borderBottomColor: '#be123c' },
  review: { backgroundColor: '#d1fae5', borderColor: '#34d399', borderBottomColor: '#047857' },
});
