import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { Text } from '../../components/RTLText';
import { normalizeIndependentWriting } from '../../services/foundationalLearning';
import { soundService } from '../../services/soundService';
import { TracingScoreResult } from '../../services/tracingScorer';
import { StrokePoint } from '../../services/types';
import { sentenceWritingTasks, sessionDone, sessionSummary, startSession, submitSlot, WritingSession, WritingTask, wordWritingTasks } from '../../services/wordWriting';
import { useAppStore } from '../../store/useAppStore';
import { useThemeStyles } from '../../theme/useAppearance';
import { WritingBoard } from './WritingBoard';
import { WritingResultDetails } from './WritingResultDetails';

type Tab = 'word' | 'sentence';

export const WordWritingScreen: React.FC = () => {
  const s = useThemeStyles(baseStyles);
  const { currentProfile, setRoute, recordPracticeResult, finishLearningGame } = useAppStore();
  const { width } = useWindowDimensions();
  const side = Math.max(200, Math.min(width - 56, 400));
  const [tab, setTab] = useState<Tab>('word');
  const [session, setSession] = useState<WritingSession | null>(null);
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [assessment, setAssessment] = useState<TracingScoreResult | null>(null);
  const [submitted, setSubmitted] = useState<StrokePoint[][]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [retry, setRetry] = useState(0);
  const [reward, setReward] = useState<number | null>(null);
  const helped = useRef(false);
  const rewarded = useRef(false);
  useEffect(() => () => { void soundService.stopSpeaking(); }, []);

  const tasks = tab === 'word' ? wordWritingTasks(currentProfile, 6) : sentenceWritingTasks(currentProfile);
  const begin = (task: WritingTask) => { helped.current = false; rewarded.current = false; setReward(null); setSession(startSession(task)); setStrokes([]); setAssessment(null); setShowGuide(false); setRetry(r => r + 1); };
  const leave = () => { void soundService.stopSpeaking(); setSession(null); };

  const slotOf = (current: WritingSession) => current.task.slots[Math.min(current.index, current.task.slots.length - 1)];
  const check = () => {
    if (!session || sessionDone(session) || !strokes.length) return;
    const slot = slotOf(session);
    const step = submitSlot(session, strokes, helped.current);
    recordPracticeResult([slot.letter.id], step.passed, undefined, 'writing', helped.current);
    setSubmitted(helped.current ? strokes : normalizeIndependentWriting(slot.guide, strokes));
    setAssessment(step.assessment);
    setSession(step.session);
    if (step.passed) soundService.playCorrect(); else soundService.playEncouragingTryAgain();
    if (step.passed && sessionDone(step.session) && !rewarded.current) {
      rewarded.current = true;
      const { task } = step.session;
      if (task.learningWord) recordPracticeResult(task.learningWord.letterIds, true, task.learningWord.id, 'word', step.session.results.some(r => r.helped));
      setReward(finishLearningGame('writing'));
      if (task.learningWord) void soundService.speakWord(task.learningWord.word);
    }
  };
  const nextOrRetry = () => { helped.current = false; setShowGuide(false); setAssessment(null); setStrokes([]); setRetry(r => r + 1); };

  if (session && sessionDone(session) && assessment) {
    const sum = sessionSummary(session);
    return <ScrollView contentContainerStyle={s.container}>
      <Text style={s.big}>{session.task.emoji} 🌟</Text>
      <Text style={s.title}>ئافەرم! «{session.task.title}»ت نووسی</Text>
      <Text style={s.text}>{sum.total} پیت نووسرا؛ تێکڕای نمرە {sum.average}٪{sum.unaided > 0 ? `، ${sum.unaided} پیت لە یەکەم هەوڵدا و بێ یارمەتی` : ''}.</Text>
      {sum.retried.length > 0 && <Text style={s.text}>ئەمانە زیاتر ڕاهێنانیان دەوێت: {sum.retried.map(l => l.glyph).join('، ')}</Text>}
      {!!reward && <Text style={s.text}>+{reward} ئەستێرە ⭐</Text>}
      <BigButton onPress={() => setSession(null)} size="lg" variant="success" style={s.full}>نووسینی دیکە</BigButton>
      <BigButton onPress={() => setRoute('writing')} variant="outline" style={s.full}>گەڕانەوە بۆ نووسینی پیت</BigButton>
    </ScrollView>;
  }

  if (session) {
    const slot = slotOf(session);
    const words = session.task.words.map(word => Array.from(word));
    const failed = !!assessment && !assessment.mastered;
    const passedNow = !!assessment && assessment.mastered;
    return <ScrollView contentContainerStyle={s.container} scrollEnabled>
      <Text style={s.title}>{session.task.emoji} {session.task.title}</Text>
      <View style={s.chips} accessibilityLabel={`پیتی ${session.index + 1} لە ${session.task.slots.length}`}>
        {session.task.slots.map((item, i) => <View key={i} style={[s.chip, i < session.index && s.chipDone, i === Math.min(session.index, session.task.slots.length - 1) && !passedNow && s.chipNow]}>
          <Text style={s.chipText}>{i < session.index ? '✓' : item.letter.glyph}</Text></View>)}
      </View>
      <Text style={s.hint}>پیتی {slot.letter.name} بنووسە ({Math.min(session.index + 1, session.task.slots.length)} لە {session.task.slots.length})</Text>
      <View style={s.model}><Text style={s.modelText}>{words.map(chars => chars.join('')).join('   ')}</Text></View>
      <WritingBoard side={side} guide={slot.guide} showGuide={showGuide} disabled={!!assessment} resetKey={`${session.task.id}-${session.index}-${retry}`} onStrokesChange={setStrokes} />
      {!assessment && <>
        <View style={s.row}>
          <TouchableOpacity accessibilityRole="button" style={s.tool} onPress={() => { helped.current = true; setShowGuide(v => !v); }}><Text style={s.toolText}>{showGuide ? 'شاردنەوەی ڕێنما' : 'ڕێنما ببینم'}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={s.tool} onPress={() => void soundService.speakWord(slot.letter.glyph, { letterName: slot.letter.name })}><Text style={s.toolText}>گوێ لە پیتەکە بگرە 🔊</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={s.tool} onPress={() => setRetry(r => r + 1)}><Text style={s.toolText}>سڕینەوە</Text></TouchableOpacity>
        </View>
        <BigButton onPress={check} disabled={!strokes.length} variant="success" size="lg" style={s.full}>پشکنینی پیتەکەم ✓</BigButton>
      </>}
      {assessment?.rubric && <>
        <Text style={s.title}>{passedNow ? 'ئافەرم! ✓' : 'با باشترى بکەین 🌱'}</Text>
        <Text style={s.text}>{assessment.feedbackKu}</Text>
        <WritingResultDetails guide={slot.guide} strokes={strokes} aligned={submitted} rubric={assessment.rubric} />
        {failed
          ? <BigButton onPress={nextOrRetry} size="lg" style={s.full}>دووبارە بنووسم ✍️</BigButton>
          : <BigButton onPress={nextOrRetry} variant="success" size="lg" style={s.full}>پیتی دواتر ←</BigButton>}
      </>}
      <BigButton onPress={leave} variant="outline" style={s.full}>گەڕانەوە</BigButton>
    </ScrollView>;
  }

  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>وشە و ڕستە بنووسە ✍️</Text>
    <Text style={s.text}>هەر پیتێک بە جیا دەنووسیت و پشکنینی وردی بۆ دەکرێت: شێوە، خاڵەکان، قەبارە و ڕێکی دەست.</Text>
    <View style={s.row}>{(['word', 'sentence'] as const).map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: tab === value }} style={[s.tool, tab === value && s.toolOn]} onPress={() => setTab(value)}>
      <Text style={s.toolText}>{value === 'word' ? 'وشە' : 'ڕستە'}</Text></TouchableOpacity>)}</View>
    {tasks.length === 0
      ? <View style={s.card}><Text style={s.text}>هێشتا پیتی پێویست فێر نەبووی. چەند پیتێکی زیاتر فێربە، پاشان وشە و ڕستەکان دەکرێنەوە 🌱</Text>
        <BigButton onPress={() => setRoute('alphabet')} style={s.full}>بچینە سەر وانەکان</BigButton></View>
      : tasks.map(task => <TouchableOpacity key={task.id} accessibilityRole="button" accessibilityLabel={`بنووسە: ${task.title}`} style={s.card} onPress={() => begin(task)}>
        <Text style={s.big}>{task.emoji}</Text><Text style={s.title}>{task.title}</Text><Text style={s.text}>{task.slots.length} پیت</Text></TouchableOpacity>)}
    <BigButton onPress={() => setRoute('writing')} variant="outline" style={s.full}>نووسینی پیت</BigButton>
  </ScrollView>;
};

const baseStyles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, alignItems: 'center', gap: 12, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 24, color: '#1e293b', textAlign: 'center' },
  text: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 15, lineHeight: 26, color: '#475569', textAlign: 'center' },
  hint: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#047857', textAlign: 'center' },
  big: { fontSize: 52, textAlign: 'center' },
  full: { width: '100%' },
  row: { width: '100%', flexDirection: 'row', gap: 8 },
  tool: { flex: 1, minHeight: 56, padding: 8, borderRadius: 16, backgroundColor: '#eaf2f8', alignItems: 'center', justifyContent: 'center' },
  toolOn: { backgroundColor: '#bbf7d0' },
  toolText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: '#334155', textAlign: 'center' },
  card: { width: '100%', backgroundColor: '#fffbeb', borderRadius: 24, padding: 18, alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  chip: { minWidth: 44, height: 44, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  chipDone: { backgroundColor: '#bbf7d0' },
  chipNow: { backgroundColor: '#fde68a', borderWidth: 2, borderColor: '#d97706' },
  chipText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, color: '#1e293b' },
  model: { backgroundColor: '#fffbeb', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 16 },
  modelText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 40, lineHeight: 64, color: '#78350f', textAlign: 'center' },
});
