import { BackButton } from '../../components/BackButton';
import { HelpHint } from '../../components/HelpButton';
import { exerciseHelp } from '../../services/exerciseHelp';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useGameScroll } from './useGameScroll';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../../components/RTLText';
import { soundService } from '../../services/soundService';
import { assembleSyllables, checkSyllableOrder, syllableRounds } from '../../services/syllables';
import { useAppStore } from '../../store/useAppStore';
import { useThemeStyles } from '../../theme/useAppearance';
import { learningStyles as baseLearningStyles } from './learningStyles';

export const SyllableBuilder: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const s = useThemeStyles(baseLearningStyles);
  const { currentProfile, recordPracticeResult, finishLearningGame } = useAppStore();
  const [rounds] = useState(() => syllableRounds(currentProfile));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [correct, setCorrect] = useState(false);
  const scroll=useGameScroll(index,correct||feedback!=='');
  const [finished, setFinished] = useState(false);
  const helped = useRef(false);
  const advanced = useRef(-1);
  const round = rounds[index];

  useEffect(() => {
    if (!round || finished) return;
    void soundService.speakWord(round.word.word);
  }, [index, round, finished]);

  useEffect(() => () => { void soundService.stopSpeaking(); }, []);

  const undo = () => { setFeedback(''); setSelected(previous => previous.slice(0, -1)); };
  const reset = () => { setFeedback(''); setSelected([]); };
  const check = () => {
    if (!round || selected.length !== round.syllables.length || correct) return;
    const passed = checkSyllableOrder(round, selected);
    setCorrect(passed);
    recordPracticeResult(round.word.letterIds, passed, round.word.id, 'syllables', helped.current);
    if (passed) {
      setFeedback(`ئافەرم! «${round.word.word}» ${round.syllables.length} بڕگەیە`);
      soundService.playCorrect();
      void soundService.speakWord(round.word.word);
    } else {
      helped.current = true;
      setFeedback('نزیک بوویت! وشەکە جارێکی تر ببیستە و بڕگەکان بە ڕیز دابنێ');
      soundService.playEncouragingTryAgain();
    }
  };
  useEffect(() => {
    if (round && selected.length === round.syllables.length && !feedback && !correct) {
      check();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.length, round, feedback, correct]);
  const next = () => {
    if (!correct || advanced.current === index) return;
    advanced.current = index;
    void soundService.stopSpeaking();
    if (index + 1 === rounds.length) { finishLearningGame('syllables'); setFinished(true); return; }
    helped.current = false; setIndex(index + 1); setSelected([]); setFeedback(''); setCorrect(false);
  };

  if (!round) {
    return <View style={s.container}><Text style={s.text}>وشەی گونجاو ئامادە نییە</Text>
      <BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton></View>;
  }
  if (finished) {
    return <ScrollView contentContainerStyle={s.container}>
      <Text style={s.emoji}></Text><Text style={s.title}>ئافەرم! بڕگەکانت پێکەوە بەست</Text>
      <Text style={s.text}>{rounds.map(item => item.syllables.join(' - ')).join('، ')}</Text>
      <BackButton fullWidth onPress={onExit}>گەڕانەوە بۆ یارییەکان</BackButton>
    </ScrollView>;
  }
  const assembled = assembleSyllables(round, selected);
  const canHearSyllables = round.syllables.every(text => soundService.canSpeak(text));
  const full = selected.length === round.syllables.length;
  return <ScrollView ref={scroll} contentContainerStyle={s.container}><HelpHint text={exerciseHelp.syllables} />
    <Text style={s.title}>بڕگەکان پێکەوە ببەستە</Text><Text style={s.text}>{index + 1} / {rounds.length}</Text>
    <View style={s.card}>
      <Text style={s.emoji}>{round.word.imageEmoji}</Text>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={() => void soundService.speakWord(round.word.word)}><Text style={s.text}>وشەکە ببیستە</Text></TouchableOpacity>
      <Text accessibilityLiveRegion="polite" style={[s.glyph, { minHeight: 44, writingDirection: 'rtl' }]}>{assembled || '…'}</Text>
      <Text style={s.text}>وشەکە {round.syllables.length} بڕگەیە؛ بە ڕیز هەڵیانبژێرە</Text>
      <View style={s.row}>{round.tiles.map(tile => {
        const used = selected.includes(tile.id);
        return <TouchableOpacity key={tile.id} accessibilityRole="button" accessibilityLabel={`بڕگەی ${tile.id + 1}: ${tile.text}`} disabled={used || correct}
          style={[s.tile, (used || correct) && s.disabled]} onPress={() => { setFeedback(''); setSelected(previous => [...previous, tile.id]); if (soundService.canSpeak(tile.text)) void soundService.speakWord(tile.text); }}>
          <Text style={s.glyph}>{tile.text}</Text></TouchableOpacity>;
      })}</View>
      {!!feedback && <Text accessibilityLiveRegion="polite" style={s.text}>{feedback}</Text>}
      {canHearSyllables && <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={() => void soundService.speakPhrases(round.syllables)}><Text style={s.text}>گوێ لە بڕگەکان بگرە</Text></TouchableOpacity>}
    </View>
    {correct
      ? <TouchableOpacity accessibilityRole="button" style={s.button} onPress={next}><Text style={s.buttonText}>{index + 1 === rounds.length ? 'تەواو بکەم ✓' : 'وشەی دواتر ←'}</Text></TouchableOpacity>
      : <TouchableOpacity accessibilityRole="button" disabled={!full} style={[s.button, !full && s.disabled]} onPress={check}><Text style={s.buttonText}>پشکنین ✓</Text></TouchableOpacity>}
    {!correct && <View style={s.row}>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={undo}><Text style={s.text}>بڕگەی پێشوو ↶</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={s.secondary} onPress={reset}><Text style={s.text}>دووبارە دایبنێم</Text></TouchableOpacity>
    </View>}
    <BackButton fullWidth onPress={onExit}>گەڕانەوە</BackButton>
  </ScrollView>;
};
