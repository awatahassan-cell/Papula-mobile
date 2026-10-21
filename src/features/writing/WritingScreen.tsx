import { BackButton } from '../../components/BackButton';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { rtlProps, rtlLayout } from '../../theme/rtl';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { accentFill } from '../../theme/appearance';
import { assessWriting, advanceWriting, normalizeIndependentWriting, writingMastered, suggestedWritingMode } from '../../services/foundationalLearning';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, PanResponder, Modal } from 'react-native';
import { PapulaMascot } from '../../components/PapulaMascot';
import { LetterWordReveal } from '../../components/LetterWordReveal';
import { Text } from '../../components/RTLText';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { Play, Eraser, Undo2 } from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { useResponsive, writingBoardSide } from '../../theme/responsive';
import { MODE_LABELS, OPEN_WORD_WRITING, PEN_LABELS, TOOL_LABELS, STAGE_TITLES } from './writingText';
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
  const { selectedLetter, setSelectedLetter, setRoute, saveWritingScore, currentProfile, saveCheckpoint, clearCheckpoint } = useAppStore();
  const [letter, setLetter] = useState(selectedLetter || mockLetters[0]);
  const writingProgress = currentProfile.writingProgress?.[letter.id];
  const savedMode = currentProfile.checkpoint?.kind === 'writing' && currentProfile.checkpoint.contentId === letter.id ? currentProfile.checkpoint.writingMode : undefined;
  const resumeMode: WritingMode = savedMode && (savedMode === 'trace' || (savedMode === 'copy' && writingProgress?.tracePassed) || (savedMode === 'independent' && writingProgress?.copyPassed)) ? savedMode : suggestedWritingMode(writingProgress);
  const [mode,setMode]=useState<WritingMode>(resumeMode);
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
  useEffect(() => {
    saveCheckpoint?.({ kind: 'writing', contentId: letter.id, writingMode: mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id, mode]);
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
    clear(); stopDemo(); setResult(null); setDrawing(false);setMode(resumeMode);usedHelp.current=false;attemptStarted.current=Date.now();
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
  const demoBudget = Math.floor((demo || 0) * demoStrokes.reduce((sum, stroke) => sum + stroke.length, 0));
  const shownDemo = demoStrokes.map((stroke, i) => stroke.slice(0, Math.max(0, demoBudget - demoStrokes.slice(0, i).reduce((sum, earlier) => sum + earlier.length, 0))));


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
        void soundService.speakWord(confirmed?`ئافەرم! تەواو فێری نووسینی پیتی ${letter.name} بوویت.`:'ئافەرم! ئەم مەشقەت بە باشی تەواو کرد.', {
          onEnd: () => { void soundService.speakWord('با بگەڕێینەوە بۆ ڕێڕەوی فێربوون.'); },
        });
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
    clearCheckpoint?.();
    void soundService.stopSpeaking();
    setResult(null); setRoute('alphabet');
  };

  // The butterfly flies along the demonstration, always at the tip of the line being drawn.
  const penTip = demo !== null ? [...shownDemo].reverse().find(stroke => stroke.length)?.slice(-1)[0] : undefined;
  const boardNode = (
    <View style={[styles.boardFrame, isNight && styles.boardNight, { direction: 'ltr' }]}>
      <View testID="writing-board" accessibilityLabel={`بۆردی نووسینی پیتی ${letter.glyph}`} style={{ width: side, height: side, direction: 'ltr' }} {...responder.panHandlers}>
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
        {penTip && <View pointerEvents="none" style={{ position: 'absolute', left: (side - 46) / 2, top: (penTip.y / 100) * side - 38, transform: [{ translateX: (penTip.x / 100) * side - side / 2 }] }}><PapulaMascot size={46} mood="happy" /></View>}
      </View>
    </View>
  );
  const controlsNode = (
    <>
    {demo !== null && <Text style={styles.hint}>سەیر بکە چۆن دەنووسرێت…</Text>}
    <View style={styles.toolRow}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={demo !== null ? TOOL_LABELS.stop : TOOL_LABELS.play} style={styles.roundTool} onPress={() => { if (demo !== null) stopDemo(); else playDemo(); }} disabled={busy || mode!=='trace'}>
        <Play size={20} color={colors.mint} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={TOOL_LABELS.undo} style={styles.roundTool} disabled={busy || demo !== null} onPress={() => { strokeRef.current = strokeRef.current.slice(0, -1); setStrokes(strokeRef.current); }}>
        <Undo2 size={20} color={colors.ink} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={TOOL_LABELS.erase} style={styles.roundTool} disabled={busy || demo !== null} onPress={clear}>
        <Eraser size={20} color={colors.ink} /></TouchableOpacity>
      <View style={[styles.toolDivider, { backgroundColor: colors.edge }]} />
      {pens.map((color, i) => <TouchableOpacity key={color} accessibilityRole="button" accessibilityLabel={PEN_LABELS[i]}
        accessibilityState={{ selected: pen === color }} onPress={() => setPen(color)} style={[styles.penDot, { backgroundColor: color }, pen === color && { borderWidth: 3, borderColor: colors.paper, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]} />)}
    </View>
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    <View style={styles.actionRow}>
      <BigButton onPress={evaluate} disabled={busy || drawing || demo !== null || !guide} variant="success" size="md" style={styles.evalBtn}>
        {busy ? 'پشکنین دەکەم…' : 'نووسینەکەم چۆنە؟ ✓'}
      </BigButton>
      <BigButton onPress={() => setRoute('word-writing')} variant="outline" size="md" style={styles.wordWriteBtn}>{OPEN_WORD_WRITING}</BigButton>
    </View>
    </>
  );
  void `ئافەرم! پیتی «${letter.glyph}» بە جوانی نووسیت.`;
  const lessonDone = isLessonComplete(currentProfile, letter.id);
  return <ScrollView ref={scrollRef} scrollEnabled={!drawing} contentContainerStyle={[styles.container, split && styles.containerSplit]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="پیتی پێشوو" disabled={index === 0 || busy}
        style={[styles.arrow, index === 0 && styles.disabled]} onPress={() => selectLetter(index - 1)}><Text style={styles.arrowText}>→</Text></TouchableOpacity>
      <View style={styles.letterInfo}><Text style={styles.label}>با پیتی {letter.name} بنووسین</Text>{mode!=='independent' && <Text style={[styles.reference, split && { fontSize: 30, lineHeight: 38 }]}>{letter.glyph}</Text>}</View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="پیتی دواتر" disabled={!hasNext || busy}
        style={[styles.arrow, !hasNext && styles.disabled]} onPress={() => selectLetter(index + 1)}><Text style={styles.arrowText}>←</Text></TouchableOpacity>
    </View>
    <View style={[styles.modeBar, { backgroundColor: extras.glass }, split && styles.toolsCompact]} accessibilityRole="tablist">{(['trace','copy','independent'] as const).map((value,i)=>{
      const locked = !lessonDone && ((value==='copy'&&!currentProfile.writingProgress?.[letter.id]?.tracePassed) || (value==='independent'&&!currentProfile.writingProgress?.[letter.id]?.copyPassed));
      const on = mode===value;
      return <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{selected:on,disabled:busy||locked}} disabled={busy || locked} style={[styles.modeTab, on && { backgroundColor: accentFill(colors, isNight) }, locked && { opacity: 0.5 }]} onPress={()=>changeMode(value)}>
        <Text style={[styles.modeTabText, { color: on ? '#ffffff' : colors.muted }]}>{MODE_LABELS[i]}</Text></TouchableOpacity>;
    })}</View>
    {split && <Text style={styles.stage}>{STAGE_TITLES[mode]}</Text>}
    <Text numberOfLines={1} style={styles.instruction}>{mode==='trace'?guide?.instructionKu:mode==='copy'?'نموونەکە سەیر بکە و لە بۆردە بەتاڵەکە بینووسە.':'بەبێ ڕێنما پیتەکە بنووسە؛ هەموو هێڵ و خاڵەکانی بیر بکەرەوە.'}</Text>
    {split ? <View style={styles.split}><View style={styles.splitBoard}>{boardNode}</View><View style={styles.splitControls}>{controlsNode}</View></View> : <>{boardNode}{controlsNode}</>}
    {result && <Modal transparent animationType="fade" visible onRequestClose={() => setResult(null)}>
      <View {...rtlProps} style={[styles.backdrop, rtlLayout]}><ScrollView contentContainerStyle={styles.modalScroll}><View style={styles.modalCard}>
        {result.mastered ? <LetterWordReveal glyph={letter.glyph} word={letter.exampleWords[0].word} /> : <Text style={styles.celebration}></Text>}
        <Text style={styles.resultTitle}>{confirmedMastery ? 'تەواو فێر بوویت!' : result.mastered ? 'ئافەرم! ئەم مەشقەت تەواو کرد' : 'با جارێکی تر ڕاهێنان بکەین'}</Text>
        <StarRating stars={result.stars} maxStars={3} size="lg" />
        {result.rubric && guide && <WritingResultDetails guide={guide} strokes={submitted} aligned={mode==='trace'?submitted:normalizeIndependentWriting(guide,submitted)} rubric={result.rubric} stars={result.stars} />}
        {result.mastered ? <>
          {mode!=='independent' && <BigButton onPress={()=>changeMode(mode==='trace'?'copy':'independent')} variant="success" size="md" style={styles.fullButton}>{mode==='trace'?'ئێستا بە نموونە بنووسم':'ئێستا سەربەخۆ بنووسم'}</BigButton>}
          <BackButton onPress={nextLesson} fullWidth style={styles.fullButton}>با بگەڕێینەوە بۆ ڕێڕەوی فێربوون</BackButton>
          {!isLessonComplete(currentProfile,letter.id) && <BigButton onPress={()=>{setResult(null);setRoute('letter-detail');}} variant="outline" size="md" style={styles.fullButton}>هەنگاوەکانی وانەکە تەواو بکەم</BigButton>}
          {index===mockLetters.length-1 && isLessonComplete(currentProfile,letter.id) && <Text style={styles.resultText}>گەیشتیتە کۆتایی پیتەکان!</Text>}
          <BackButton onPress={goHome} fullWidth style={styles.fullButton}>گەڕانەوە بۆ سەرەتا</BackButton>
        </> : <>
          {mode!=='trace' && <BigButton onPress={()=>changeMode('trace')} variant="outline" size="md" style={styles.fullButton}>ڕێنما ببینم؛ یارمەتی دەوێت</BigButton>}
          <BigButton onPress={() => { setResult(null); clear(); usedHelp.current=false;attemptStarted.current=Date.now(); }} size="md" style={styles.fullButton}>دووبارە بنووسم ✍️</BigButton>
        </>}
      </View></ScrollView></View>
    </Modal>}
  </ScrollView>;
};

const baseStyles = StyleSheet.create({
  modeBar: { flexDirection: 'row', width: '100%', borderRadius: 999, padding: 3, gap: 4 },
  modeTab: { flex: 1, minHeight: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  modeTabText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 13 },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
  roundTool: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  toolDivider: { width: 2, height: 24, borderRadius: 1, marginHorizontal: 2 },
  penDot: { width: 28, height: 28, borderRadius: 14 },
  boardNight: { backgroundColor: '#1a1570', borderColor: 'rgba(255,255,255,0.22)' },
  container: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 10, alignItems: 'center', gap: 7, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 },
  letterInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18, color: '#1e293b', textAlign: 'center' },
  reference: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 28, lineHeight: 36, color: '#78350f', backgroundColor: '#ede5ff', paddingHorizontal: 10, borderRadius: 12 },
  arrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7' },
  arrowText: { fontSize: 22, color: '#78350f' },
  disabled: { opacity: 0.3 },
  toolsCompact: { maxWidth: 640, alignSelf: 'center' },
  containerSplit: { maxWidth: 1080 },
  split: { flexDirection: 'row', gap: 20, width: '100%', alignItems: 'flex-start', justifyContent: 'center' },
  splitBoard: { alignItems: 'center' },
  splitControls: { flex: 1, minWidth: 260, maxWidth: 420, gap: 10, alignItems: 'center' },
  stage: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 14, color: '#047857', textAlign: 'center' },
  instruction: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 14, textAlign: 'center', color: '#334155' },
  boardFrame: { backgroundColor: '#fffef7', borderColor: '#cbd5e1', borderWidth: 2, borderRadius: 24, overflow: 'hidden' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 13, color: '#475569', textAlign: 'center' },
  tools: { width: '100%', flexDirection: 'row', gap: 8 },
  tool: { flex: 1, minHeight: 56, padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf2f8', borderRadius: 20, gap: 6 },
  toolText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 13, color: '#334155', textAlign: 'center' },
  colors: { flexDirection: 'row', gap: 16, marginVertical: 4 },
  color: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#fffdfa' },
  selectedColor: { borderColor: '#0f172a' },
  error: { color: '#b91c1c', fontSize: 14, textAlign: 'center' },
  actionRow: { width: '100%', maxWidth: 480, gap: 6, alignSelf: 'center' },
  evalBtn: { width: '100%' },
  wordWriteBtn: { width: '100%' },
  fullButton: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: 16 },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#fffef7', borderRadius: 26, padding: 18, alignItems: 'center', gap: 10 },
  celebration: { fontSize: 32 },
  resultTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, color: '#047857', textAlign: 'center' },
  resultText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 15, color: '#334155', textAlign: 'center' },
  listenHelp: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});

