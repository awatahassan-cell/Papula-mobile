import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { rtlProps, rtlLayout } from '../../theme/rtl';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { assessWriting, advanceWriting, normalizeIndependentWriting, writingMastered, suggestedWritingMode } from '../../services/foundationalLearning';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, PanResponder, Modal } from 'react-native';
import { Text } from '../../components/RTLText';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { Play, Eraser, Undo2 } from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { useResponsive, writingBoardSide } from '../../theme/responsive';
import { MODE_LABELS, OPEN_WORD_WRITING, PEN_LABELS, TOOL_LABELS, OVERALL_SCORE_LABEL, STAGE_TITLES } from './writingText';
import { WritingResultDetails } from './WritingResultDetails';
import { StarRating } from '../../components/StarRating';
import { mockLetters } from '../../data/mockLetters';
import { getKurdishStrokeGuide } from '../../data/kurdishLetterGuides';
import { soundService } from '../../services/soundService';
import { TracingScoreResult } from '../../services/tracingScorer';
import { resamplePolyline } from '../../services/pathSimilarity';
import { StrokePoint, WritingMode } from '../../services/types';
import { useAppStore } from '../../store/useAppStore';
import { isLessonUnlocked, isLessonComplete } from '../../services/lessonPath';

const DAY_PENS = ['#7c5cff', '#38a8e8', '#2fbf94'];
const NIGHT_PENS = ['#5eead4', '#ff8fd0', '#ffd66b'];
const pathFor = (points: StrokePoint[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
const Stroke: React.FC<{ points: StrokePoint[]; color: string; width: number }> = ({ points, color, width }) => {
  if (!points.length) return null;
  if (points.length === 1) return <Circle cx={points[0].x} cy={points[0].y} r={width / 2} fill={color} />;
  return <Path d={pathFor(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
};

export const WritingScreen: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { colors, extras } = useAppearance();
  const { selectedLetter, setSelectedLetter, setRoute, saveWritingScore, currentProfile } = useAppStore();
  const [letter, setLetter] = useState(selectedLetter || mockLetters[0]);
  const [mode,setMode]=useState<WritingMode>(()=>suggestedWritingMode(currentProfile.writingProgress?.[(selectedLetter||mockLetters[0]).id]));
  const [confirmedMastery,setConfirmedMastery]=useState(false);
  const attemptStarted=useRef(0);
  const usedHelp=useRef(false);
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [active, setActive] = useState<StrokePoint[]>([]);
  const { isNight } = useAppearance();
  const pens = isNight ? NIGHT_PENS : DAY_PENS;
  const [penIndex, setPenIndex] = useState(0);
  const pen = pens[penIndex];
  const setPen = (color: string) => setPenIndex(Math.max(0, pens.indexOf(color)));
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<TracingScoreResult | null>(null);
  const [submitted, setSubmitted] = useState<StrokePoint[][]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState<number | null>(null);
  const info = useResponsive();
  const split = info.wide && info.landscape;
  const side = writingBoardSide(info);
  const sideRef = useRef(side);
  useLayoutEffect(() => { sideRef.current = side; }, [side]);
  const strokeRef = useRef<StrokePoint[][]>([]);
  const activeRef = useRef<StrokePoint[]>([]);
  const lockedRef = useRef(false);
  const isLocked = busy || result !== null || demo !== null;
  useLayoutEffect(() => { lockedRef.current = isLocked; }, [isLocked]);
  const checkingRef = useRef(false);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const guide = getKurdishStrokeGuide(letter.id) || getKurdishStrokeGuide(letter.glyph) || letter.strokeGuide;
  const index = mockLetters.findIndex(item => item.id === letter.id);
  const hasNext = index < mockLetters.length - 1 && isLessonUnlocked(currentProfile, mockLetters[index + 1].id);

  const stopDemo = () => {
    if (demoTimer.current) clearInterval(demoTimer.current);
    demoTimer.current = null;
    setDemo(null);
  };
  const clear = () => {
    strokeRef.current = [];
    activeRef.current = [];
    setStrokes([]);
    setActive([]);
    setError('');
  };
  useEffect(() => {
    // Reset the whole attempt whenever the letter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    clear(); stopDemo(); setResult(null); setDrawing(false);setMode(suggestedWritingMode(currentProfile.writingProgress?.[letter.id]));usedHelp.current=false;attemptStarted.current=Date.now();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    return () => { if (demoTimer.current) clearInterval(demoTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the letter (or its guide) changes
  }, [letter.id, guide]);
  useEffect(() => () => { void soundService.stopSpeaking(); }, []);

  const responder = useMemo(() => {
    const point = (x: number, y: number): StrokePoint => ({
      x: Math.max(0, Math.min(100, x / sideRef.current * 100)),
      y: Math.max(0, Math.min(100, y / sideRef.current * 100)),
    });
    const finish = () => {
      if (activeRef.current.length) {
        strokeRef.current = [...strokeRef.current, activeRef.current];
        setStrokes(strokeRef.current);
      }
      activeRef.current = [];
      setActive([]); setDrawing(false);
    };
    // PanResponder callbacks only read the refs at gesture time, never during render.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => {
        activeRef.current = [point(event.nativeEvent.locationX, event.nativeEvent.locationY)];
        setActive(activeRef.current); setDrawing(true); setError('');
      },
      onPanResponderMove: event => {
        const next = point(event.nativeEvent.locationX, event.nativeEvent.locationY);
        const last = activeRef.current[activeRef.current.length - 1];
        if (!last || Math.hypot(last.x - next.x, last.y - next.y) >= 0.35) {
          activeRef.current = [...activeRef.current, next];
          setActive(activeRef.current);
        }
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, []);

  const playDemo = () => {
    if (!guide || demoTimer.current || busy) return;
    usedHelp.current=true;clear(); setDemo(0);
    const started = Date.now();
    const duration = Math.max(2400, guide.suggestedSpeedMs || 2400);
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
  const demoStrokes = guide?.strokes.map(stroke => resamplePolyline(stroke, 1)) || [];
  let remainingDemoPoints = Math.floor((demo || 0) * demoStrokes.reduce((sum, stroke) => sum + stroke.length, 0));
  const shownDemo = demoStrokes.map(stroke => {
    const shown = stroke.slice(0, Math.max(0, remainingDemoPoints));
    remainingDemoPoints -= stroke.length;
    return shown;
  });

  const evaluate = async () => {
    if (!guide || checkingRef.current || demo !== null) return;
    checkingRef.current = true; setBusy(true); setError('');
    const captured = [...strokeRef.current, ...(activeRef.current.length ? [activeRef.current] : [])];
    const evaluated = assessWriting(guide, captured, mode);
    try {
      if (captured.length > 0) await saveWritingScore(letter.id, evaluated.score, evaluated.stars, mode, usedHelp.current, Math.round((Date.now()-attemptStarted.current)/1000));
      const confirmed=writingMastered(advanceWriting(currentProfile.writingProgress?.[letter.id],mode,evaluated.mastered,usedHelp.current));
      setConfirmedMastery(confirmed);
      setSubmitted(captured);
      setResult(evaluated);
      if (evaluated.mastered) {
        soundService.playCorrect();
        void soundService.speakWord(confirmed?`ئافەرم! تەواو فێری نووسینی پیتی ${letter.name} بوویت.`:'ئافەرم! ئەم مەشقەت بە باشی تەواو کرد.');
      } else soundService.playEncouragingTryAgain();
    } catch {
      setError('ئەنجامەکە هەڵنەگیرا. جارێکی تر تاقی بکەرەوە.');
    } finally { checkingRef.current = false; setBusy(false); }
  };
  const selectLetter = (nextIndex: number) => {
    const next = mockLetters[nextIndex];
    if (!next || busy || !isLessonUnlocked(currentProfile, next.id)) return;
    void soundService.stopSpeaking(); setSelectedLetter(next); setLetter(next);
  };
  // eslint-disable-next-line react-hooks/purity -- runs in an event handler, not during render
  const changeMode=(next:WritingMode)=>{stopDemo();void soundService.stopSpeaking();setMode(next);setResult(null);clear();usedHelp.current=false;attemptStarted.current=Date.now();};
  const goHome = () => { void soundService.stopSpeaking(); setResult(null); setRoute('home'); };
  const nextLesson = () => {
    if (!hasNext || !result?.mastered || !isLessonComplete(currentProfile, letter.id)) return;
    void soundService.stopSpeaking();
    setSelectedLetter(mockLetters[index + 1]);
    setResult(null); setRoute('letter-detail');
  };

  const boardNode = (
    <View style={[styles.boardFrame, isNight && styles.boardNight]}>
      <View testID="writing-board" accessibilityLabel={`بۆردی نووسینی پیتی ${letter.glyph}`} style={{ width: side, height: side }} {...responder.panHandlers}>
        <Svg width={side} height={side} viewBox="0 0 100 100" pointerEvents="none">
          {[22, 45, 70, 88].map(y => <Line key={y} x1={5} y1={y} x2={95} y2={y}
            stroke={y === 70 ? (isNight ? '#ff8fd0' : '#e8a26b') : (isNight ? 'rgba(255,255,255,0.14)' : '#dcd6f2')} strokeWidth={y === 70 ? 0.65 : 0.3} />)}
          {mode==='trace' && guide?.outlinePath && <Path d={guide.outlinePath} fill={isNight ? 'rgba(255,255,255,0.16)' : '#cfc8ee'} fillRule="evenodd" />}
          {mode==='trace' && !guide?.outlinePath && guide?.strokes.map((stroke, i) => <Stroke key={`guide-${i}`} points={stroke} color={isNight ? 'rgba(255,255,255,0.16)' : '#cfc8ee'} width={6} />)}
          {strokes.map((stroke, i) => <Stroke key={`draw-${i}`} points={stroke} color={pen} width={3.6} />)}
          <Stroke points={active} color={pen} width={3.6} />
          {demo !== null && shownDemo.map((stroke, i) => <Stroke key={`demo-${i}`} points={stroke} color="#0369a1" width={3.6} />)}
          {mode==='trace' && strokes.length === 0 && demo === null && guide?.strokes[0]?.[0] && <Circle cx={guide.strokes[0][0].x} cy={guide.strokes[0][0].y} r={2} fill="#047857" />}
        </Svg>
      </View>
    </View>
  );
  const controlsNode = (
    <>
    {demo !== null && <Text style={styles.hint}>سەیر بکە چۆن دەنووسرێت…</Text>}
    <View style={styles.toolRow}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={demo !== null ? TOOL_LABELS.stop : TOOL_LABELS.play} style={styles.roundTool} onPress={() => { if (demo !== null) stopDemo(); else playDemo(); }} disabled={busy || mode!=='trace'}>
        <Play size={22} color={colors.mint} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={TOOL_LABELS.undo} style={styles.roundTool} disabled={busy || demo !== null} onPress={() => { strokeRef.current = strokeRef.current.slice(0, -1); setStrokes(strokeRef.current); }}>
        <Undo2 size={22} color={colors.ink} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={TOOL_LABELS.erase} style={styles.roundTool} disabled={busy || demo !== null} onPress={clear}>
        <Eraser size={22} color={colors.ink} /></TouchableOpacity>
      <View style={[styles.toolDivider, { backgroundColor: colors.edge }]} />
      {pens.map((color, i) => <TouchableOpacity key={color} accessibilityRole="button" accessibilityLabel={PEN_LABELS[i]}
        accessibilityState={{ selected: pen === color }} onPress={() => setPen(color)} style={[styles.penDot, { backgroundColor: color }, pen === color && { borderWidth: 3, borderColor: colors.paper, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]} />)}
    </View>
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    <BigButton onPress={evaluate} disabled={busy || drawing || demo !== null || !guide} variant="success" size="lg" style={styles.fullButton}>
      {busy ? 'پشکنین دەکەم…' : 'نووسینەکەم چۆنە؟ ✓'}
    </BigButton>
    <BigButton onPress={() => setRoute('word-writing')} variant="outline" style={styles.fullButton}>{OPEN_WORD_WRITING}</BigButton>

    </>
  );
  return <ScrollView ref={scrollRef} scrollEnabled={!drawing} contentContainerStyle={[styles.container, split && styles.containerSplit]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="پیتی پێشوو" disabled={index === 0 || busy}
        style={[styles.arrow, index === 0 && styles.disabled]} onPress={() => selectLetter(index - 1)}><Text style={styles.arrowText}>→</Text></TouchableOpacity>
      <View style={styles.letterInfo}><Text style={styles.label}>با پیتی {letter.name} بنووسین</Text>{mode!=='independent' && <Text style={[styles.reference, split && { fontSize: 34, lineHeight: 44 }]}>{letter.glyph}</Text>}</View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="پیتی دواتر" disabled={!hasNext || busy}
        style={[styles.arrow, !hasNext && styles.disabled]} onPress={() => selectLetter(index + 1)}><Text style={styles.arrowText}>←</Text></TouchableOpacity>
    </View>
    <View style={[styles.modeBar, { backgroundColor: extras.glass }, split && styles.toolsCompact]} accessibilityRole="tablist">{(['trace','copy','independent'] as const).map((value,i)=>{
      const locked = (value==='copy'&&!currentProfile.writingProgress?.[letter.id]?.tracePassed) || (value==='independent'&&!currentProfile.writingProgress?.[letter.id]?.copyPassed);
      const on = mode===value;
      return <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{selected:on,disabled:busy||locked}} disabled={busy || locked} style={[styles.modeTab, on && { backgroundColor: colors.mint }, locked && { opacity: 0.5 }]} onPress={()=>changeMode(value)}>
        <Text style={[styles.modeTabText, { color: on ? '#ffffff' : colors.muted }]}>{MODE_LABELS[i]}</Text></TouchableOpacity>;
    })}</View>
    {split && <Text style={styles.stage}>{STAGE_TITLES[mode]}</Text>}
    <Text style={styles.instruction}>{mode==='trace'?guide?.instructionKu:mode==='copy'?'نموونەکە سەیر بکە و لە بۆردە بەتاڵەکە بینووسە.':'بەبێ ڕێنما پیتەکە بنووسە؛ هەموو هێڵ و خاڵەکانی بیر بکەرەوە.'}</Text>
    {split ? <View style={styles.split}><View style={styles.splitBoard}>{boardNode}</View><View style={styles.splitControls}>{controlsNode}</View></View> : <>{boardNode}{controlsNode}</>}
    {result && <Modal transparent animationType="fade" visible onRequestClose={() => setResult(null)}>
      <View {...rtlProps} style={[styles.backdrop, rtlLayout]}><ScrollView contentContainerStyle={styles.modalScroll}><View style={styles.modalCard}>
        <Text style={styles.celebration}>{result.mastered ? '🌟' : '🌱'}</Text>
        <Text style={styles.resultTitle}>{confirmedMastery ? 'تەواو فێر بوویت!' : result.mastered ? 'ئافەرم! ئەم مەشقەت تەواو کرد' : 'با جارێکی تر ڕاهێنان بکەین'}</Text>
        <Text style={styles.resultText}>{result.mastered ? `ئافەرم! پیتی «${letter.glyph}» بە جوانی نووسیت.` : result.feedbackKu}</Text>
        <StarRating stars={result.stars} maxStars={3} size="lg" />
        <Text style={styles.resultText}>{OVERALL_SCORE_LABEL}: {result.score}٪</Text>
        {result.rubric && guide && <WritingResultDetails guide={guide} strokes={submitted} aligned={mode==='trace'?submitted:normalizeIndependentWriting(guide,submitted)} rubric={result.rubric} stars={result.stars} />}
        {result.mastered ? <>
          {mode!=='independent' && <BigButton onPress={()=>changeMode(mode==='trace'?'copy':'independent')} variant="success" size="lg" style={styles.fullButton}>{mode==='trace'?'ئێستا بە نموونە بنووسم':'ئێستا سەربەخۆ بنووسم'}</BigButton>}
          {mode==='independent' && !confirmedMastery && <Text style={styles.resultText}>سەربەخۆ نووسیت! لە ڕۆژێکی دیکە دووبارەی بکەوە، بۆ دڵنیابوون لە فێربوون.</Text>}
          {hasNext && isLessonComplete(currentProfile,letter.id) && <BigButton onPress={nextLesson} variant="success" size="lg" style={styles.fullButton}>{`پیتی نوێ «${mockLetters[index + 1].glyph}» کراوەتەوە ←`}</BigButton>}
          {!isLessonComplete(currentProfile,letter.id) && <BigButton onPress={()=>{setResult(null);setRoute('letter-detail');}} variant="outline" style={styles.fullButton}>هەنگاوەکانی وانەکە تەواو بکەم</BigButton>}
          {index===mockLetters.length-1 && isLessonComplete(currentProfile,letter.id) && <Text style={styles.resultText}>گەیشتیتە کۆتایی پیتەکان! 🎉</Text>}
          <BigButton onPress={goHome} variant="outline" size="lg" style={styles.fullButton}>گەڕانەوە بۆ سەرەتا 🏠</BigButton>
        </> : <>
          {mode!=='trace' && <BigButton onPress={()=>changeMode('trace')} variant="outline" style={styles.fullButton}>ڕێنما ببینم؛ یارمەتی دەوێت</BigButton>}
          <BigButton onPress={() => { setResult(null); clear(); usedHelp.current=false;attemptStarted.current=Date.now(); }} size="lg" style={styles.fullButton}>دووبارە بنووسم ✍️</BigButton>
        </>}
      </View></ScrollView></View>
    </Modal>}
  </ScrollView>;
};

const baseStyles = StyleSheet.create({
  modeBar: { flexDirection: 'row', width: '100%', borderRadius: 999, padding: 4, gap: 4 },
  modeTab: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  modeTabText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 14 },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' },
  roundTool: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  toolDivider: { width: 2, height: 28, borderRadius: 1, marginHorizontal: 4 },
  penDot: { width: 30, height: 30, borderRadius: 15 },
  boardNight: { backgroundColor: '#1a1570', borderColor: 'rgba(255,255,255,0.22)' },
  container: { padding: 16, paddingBottom: 32, alignItems: 'center', gap: 12, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 },
  letterInfo: { flex: 1, alignItems: 'center' },
  label: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, color: '#1e293b', textAlign: 'center' },
  reference: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 34, lineHeight: 46, color: '#78350f' },
  arrow: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7' },
  arrowText: { fontSize: 26, color: '#78350f' },
  disabled: { opacity: 0.3 },
  toolsCompact: { maxWidth: 640, alignSelf: 'center' },
  containerSplit: { maxWidth: 1080 },
  split: { flexDirection: 'row', gap: 24, width: '100%', alignItems: 'flex-start', justifyContent: 'center' },
  splitBoard: { alignItems: 'center' },
  splitControls: { flex: 1, minWidth: 260, maxWidth: 420, gap: 12, alignItems: 'center' },
  stage: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 15, color: '#047857', textAlign: 'center' },
  instruction: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 16, textAlign: 'center', color: '#334155' },
  boardFrame: { backgroundColor: '#fffef7', borderColor: '#cbd5e1', borderWidth: 2, borderRadius: 22, overflow: 'hidden' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 14, color: '#475569', textAlign: 'center' },
  tools: { width: '100%', flexDirection: 'row', gap: 8 },
  tool: { flex: 1, minHeight: 68, padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf2f8', borderRadius: 18, gap: 6 },
  toolText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: '#334155', textAlign: 'center' },
  colors: { flexDirection: 'row', gap: 16, marginVertical: 4 },
  color: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: '#fffdfa' },
  selectedColor: { borderColor: '#0f172a' },
  error: { color: '#b91c1c', fontSize: 16, textAlign: 'center' },
  fullButton: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: 20 },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#fffef7', borderRadius: 28, padding: 24, alignItems: 'center', gap: 16 },
  celebration: { fontSize: 56 },
  resultTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 26, color: '#047857', textAlign: 'center' },
  resultText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 17, color: '#334155', textAlign: 'center' },
  listenHelp: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
});
