import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Play, Eraser, Eye, Volume2 } from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { StarRating } from '../../components/StarRating';
import { Text } from '../../components/RTLText';
import { normalizeIndependentWriting } from '../../services/foundationalLearning';
import { soundService } from '../../services/soundService';
import { TracingScoreResult } from '../../services/tracingScorer';
import { StrokePoint } from '../../services/types';
import {
  availableSentenceWritingTasks,
  availableWordWritingTasks,
  sessionDone,
  startSession,
  submitSlot,
  WritingSession,
  WritingTask,
} from '../../services/wordWriting';
import { useAppStore } from '../../store/useAppStore';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { tileSet } from '../../theme/candy';
import { WritingBoard } from './WritingBoard';
import { WritingResultDetails } from './WritingResultDetails';

type Tab = 'word' | 'sentence';

export const WordWritingScreen: React.FC = () => {
  const s = useThemeStyles(baseStyles);
  const { isNight, colors } = useAppearance();
  const tiles = tileSet(isNight);
  const { currentProfile, setRoute, recordPracticeResult, finishLearningGame, registerBackHandler } = useAppStore();
  const { width, height } = useWindowDimensions();
  const side = Math.max(170, Math.min(width - 56, height - 360, 260));
  const [tab, setTab] = useState<Tab>('word');
  const [session, setSession] = useState<WritingSession | null>(null);
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [assessment, setAssessment] = useState<TracingScoreResult | null>(null);
  const [submitted, setSubmitted] = useState<StrokePoint[][]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [retry, setRetry] = useState(0);
  const [reward, setReward] = useState<number | null>(null);
  const [demo, setDemo] = useState<number | null>(null);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const helped = useRef(false);
  const rewarded = useRef(false);

  const stopDemo = () => {
    if (demoTimer.current) clearInterval(demoTimer.current);
    demoTimer.current = null;
    setDemo(null);
  };

  useEffect(() => () => {
    stopDemo();
    void soundService.stopSpeaking();
  }, []);

  useEffect(() => {
    if (!registerBackHandler) return;
    if (session) {
      return registerBackHandler(() => {
        stopDemo();
        void soundService.stopSpeaking();
        setSession(null);
        return true;
      });
    }
    registerBackHandler(null);
    return () => registerBackHandler(null);
  }, [session, registerBackHandler]);

  const tasks = tab === 'word' ? availableWordWritingTasks(currentProfile, 12) : availableSentenceWritingTasks(currentProfile);
  const begin = (task: WritingTask) => {
    stopDemo();
    helped.current = false;
    rewarded.current = false;
    setReward(null);
    setSession(startSession(task));
    setStrokes([]);
    setAssessment(null);
    setShowGuide(true);
    setRetry(r => r + 1);
    void soundService.speakWord(task.title);
  };
  const leave = () => {
    stopDemo();
    void soundService.stopSpeaking();
    setSession(null);
  };

  const slotOf = (current: WritingSession) => current.task.slots[Math.min(current.index, current.task.slots.length - 1)];

  const playDemo = () => {
    if (!session || demoTimer.current) return;
    const slot = slotOf(session);
    helped.current = true;
    setRetry(r => r + 1);
    setDemo(0);
    const started = Date.now();
    const duration = Math.max(2200, slot.guide.suggestedSpeedMs || 2200);
    demoTimer.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      setDemo(progress);
      if (progress === 1) {
        if (demoTimer.current) clearInterval(demoTimer.current);
        demoTimer.current = null;
        setDemo(null);
      }
    }, 40);
  };

  const check = () => {
    if (!session || sessionDone(session) || !strokes.length || demo !== null) return;
    const slot = slotOf(session);
    const step = submitSlot(session, strokes, helped.current);
    recordPracticeResult([slot.letter.id], step.passed, undefined, 'writing', helped.current);
    setSubmitted(helped.current ? strokes : normalizeIndependentWriting(slot.guide, strokes));
    setAssessment(step.assessment);
    setSession(step.session);
    if (step.passed) {
      soundService.playCorrect();
      void soundService.speakWord(`ئافەرم!`);
    } else {
      soundService.playEncouragingTryAgain();
    }
    if (step.passed && sessionDone(step.session) && !rewarded.current) {
      rewarded.current = true;
      const { task } = step.session;
      if (task.learningWord) recordPracticeResult(task.learningWord.letterIds, true, task.learningWord.id, 'word', step.session.results.some(r => r.helped));
      setReward(finishLearningGame('writing'));
      void soundService.speakWord(task.title);
    }
  };
  const nextOrRetry = () => {
    stopDemo();
    helped.current = false;
    setShowGuide(true);
    setAssessment(null);
    setStrokes([]);
    setRetry(r => r + 1);
  };

  if (session && sessionDone(session) && assessment) {
    return (
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.doneCard}>
          <Text style={s.big}>{session.task.emoji}</Text>
          <Text style={s.title}>ئافەرم! «{session.task.title}»ت نووسی 🌟</Text>
          <StarRating stars={3} maxStars={3} size="lg" />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`گوێ لە ${session.task.title} بگرە`}
            style={s.speakPill}
            onPress={() => void soundService.speakWord(session.task.title)}
          >
            <Volume2 size={22} color="#78350f" />
            <Text style={s.speakPillText}>{session.task.title}</Text>
          </TouchableOpacity>
          {!!reward && <Text style={s.rewardBadge}>+{reward} ئەستێرە ⭐</Text>}
        </View>
        <BigButton onPress={() => setSession(null)} size="md" variant="success" style={s.full}>وشە و ڕستەی دیکە 📝</BigButton>
        <BigButton onPress={() => setRoute('writing')} size="md" variant="outline" style={s.full}>گەڕانەوە بۆ نووسینی پیت</BigButton>
      </ScrollView>
    );
  }

  if (session) {
    const slot = slotOf(session);
    const failed = !!assessment && !assessment.mastered;
    const passedNow = !!assessment && assessment.mastered;
    return (
      <ScrollView contentContainerStyle={s.container} scrollEnabled>
        <View style={s.sessionHeader}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`گوێ لە ${session.task.title} بگرە`}
            style={s.wordBanner}
            onPress={() => void soundService.speakWord(session.task.title)}
          >
            <Text style={s.bannerEmoji}>{session.task.emoji}</Text>
            <Text style={s.modelText}>{session.task.words.join('   ')}</Text>
            <Volume2 size={20} color="#78350f" />
          </TouchableOpacity>
          <View style={s.chips} accessibilityLabel={`پیتی ${session.index + 1} لە ${session.task.slots.length}`}>
            {session.task.slots.map((item, i) => (
              <View
                key={i}
                style={[
                  s.chip,
                  i < session.index && s.chipDone,
                  i === Math.min(session.index, session.task.slots.length - 1) && !passedNow && s.chipNow,
                ]}
              >
                <Text style={s.chipText}>{i < session.index ? '✓' : item.letter.glyph}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={s.hint}>پیتی «{slot.letter.glyph}» بنووسە ({Math.min(session.index + 1, session.task.slots.length)} / {session.task.slots.length})</Text>
        <WritingBoard
          side={side}
          guide={slot.guide}
          showGuide={showGuide}
          disabled={!!assessment}
          demoProgress={demo}
          resetKey={`${session.task.id}-${session.index}-${retry}`}
          onStrokesChange={setStrokes}
        />
        {!assessment && (
          <>
            <View style={s.toolBar}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="پیشاندان"
                style={s.iconTool}
                onPress={() => { if (demo !== null) stopDemo(); else playDemo(); }}
              >
                <Play size={20} color={colors.mint} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showGuide ? 'شاردنەوەی ڕێنما' : 'ڕێنما ببینم'}
                style={[s.iconTool, showGuide && s.toolOn]}
                onPress={() => { helped.current = true; setShowGuide(v => !v); }}
              >
                <Eye size={20} color={colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="گوێ لە پیتەکە بگرە"
                style={s.iconTool}
                onPress={() => void soundService.speakWord(slot.letter.glyph, { letterName: slot.letter.name })}
              >
                <Volume2 size={20} color={colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="سڕینەوە"
                style={s.iconTool}
                onPress={() => { stopDemo(); setRetry(r => r + 1); }}
              >
                <Eraser size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <BigButton onPress={check} disabled={!strokes.length || demo !== null} variant="success" size="md" style={s.full}>
              پشکنینی پیتەکەم ✓
            </BigButton>
          </>
        )}
        {assessment?.rubric && (
          <View style={s.evalBox}>
            <Text style={s.title}>{passedNow ? 'ئافەرم! 🌟' : 'با جارێکی تر بنووسین'}</Text>
            <StarRating stars={assessment.stars} maxStars={3} size="md" />
            <WritingResultDetails guide={slot.guide} strokes={strokes} aligned={submitted} rubric={assessment.rubric} stars={assessment.stars} />
            {failed ? (
              <BigButton onPress={nextOrRetry} size="md" style={s.full}>دووبارە بنووسم ✍️</BigButton>
            ) : (
              <BigButton onPress={nextOrRetry} variant="success" size="md" style={s.full}>پیتی دواتر ←</BigButton>
            )}
          </View>
        )}
        <BigButton onPress={leave} variant="outline" size="md" style={s.full}>گەڕانەوە بۆ لیست</BigButton>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.tabBar}>
        {(['word', 'sentence'] as const).map(value => {
          const active = tab === value;
          return (
            <TouchableOpacity
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[s.tabBtn, active && s.tabBtnActive]}
              onPress={() => setTab(value)}
            >
              <Text style={[s.tabBtnText, active && s.tabBtnTextActive]}>
                {value === 'word' ? '📝 نووسینی وشە' : '📖 نووسینی ڕستە'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.grid}>
        {tasks.map((task, idx) => {
          const candy = tiles[idx % tiles.length];
          return (
            <TouchableOpacity
              key={task.id}
              accessibilityRole="button"
              accessibilityLabel={`بنووسە: ${task.title}`}
              style={[s.taskCard, { backgroundColor: candy.face, borderBottomColor: candy.lip }]}
              onPress={() => begin(task)}
            >
              <View style={[s.taskEmojiBox, { backgroundColor: candy.chip }]}>
                <Text style={s.taskEmoji}>{task.emoji}</Text>
              </View>
              <View style={s.taskBody}>
                <Text style={[s.taskTitle, { color: candy.ink }]}>{task.title}</Text>
                <View style={s.slotRow}>
                  {task.slots.map((slot, sIdx) => (
                    <View key={sIdx} style={[s.miniChip, { backgroundColor: candy.chip }]}>
                      <Text style={[s.miniChipText, { color: candy.ink }]}>{slot.letter.glyph}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[s.writeBadge, { backgroundColor: candy.chip }]}>
                <Text style={{ fontSize: 18 }}>✍️</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <BigButton onPress={() => setRoute('writing')} variant="outline" size="md" style={s.full}>گەڕانەوە بۆ نووسینی پیت</BigButton>
    </ScrollView>
  );
};

const baseStyles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 16, alignItems: 'center', gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, color: '#1e293b', textAlign: 'center' },
  hint: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 15, color: '#047857', textAlign: 'center' },
  big: { fontSize: 48, textAlign: 'center' },
  full: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  tabBar: { width: '100%', flexDirection: 'row', gap: 8, backgroundColor: '#ede5ff', padding: 4, borderRadius: 22 },
  tabBtn: { flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: '#6d4ae8', borderBottomWidth: 3, borderBottomColor: '#4f33b8' },
  tabBtnText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 15, color: '#3b2f63' },
  tabBtnTextActive: { color: '#ffffff' },
  grid: { width: '100%', gap: 10 },
  taskCard: { width: '100%', minHeight: 74, borderRadius: 22, borderBottomWidth: 4, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskEmojiBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  taskEmoji: { fontSize: 28 },
  taskBody: { flex: 1, gap: 4, alignItems: 'flex-start' },
  taskTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, textAlign: 'right', alignSelf: 'stretch' },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniChip: { minWidth: 26, height: 26, borderRadius: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  miniChipText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 14 },
  writeBadge: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sessionHeader: { width: '100%', alignItems: 'center', gap: 6 },
  wordBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ede5ff', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#cab8f5' },
  bannerEmoji: { fontSize: 28 },
  modelText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 28, lineHeight: 40, color: '#3b2f63', textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  chip: { minWidth: 38, height: 38, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  chipDone: { backgroundColor: '#bbf7d0' },
  chipNow: { backgroundColor: '#fde68a', borderWidth: 2, borderColor: '#d97706' },
  chipText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19, color: '#1e293b' },
  toolBar: { flexDirection: 'row', justifyContent: 'center', gap: 12, width: '100%' },
  iconTool: { width: 46, height: 46, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cab8f5', borderBottomWidth: 3, borderBottomColor: '#cab8f5', alignItems: 'center', justifyContent: 'center' },
  toolOn: { backgroundColor: '#dcfce7', borderColor: '#16a34a', borderBottomColor: '#15803d' },
  evalBox: { width: '100%', backgroundColor: '#f8f5ff', borderRadius: 24, padding: 12, alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#cab8f5' },
  doneCard: { width: '100%', backgroundColor: '#f8f5ff', borderRadius: 26, padding: 18, alignItems: 'center', gap: 10, borderWidth: 2, borderColor: '#cab8f5' },
  speakPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde68a', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18, borderBottomWidth: 3, borderBottomColor: '#d97706' },
  speakPillText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18, color: '#78350f' },
  rewardBadge: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18, color: '#b45309' },
});

