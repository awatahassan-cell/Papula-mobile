import { LetterFormsLesson } from '../learning/LetterFormsLesson';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { LetterItem } from '../../services/types';
import { soundService } from '../../services/soundService';
import { mockLetters } from '../../data/mockLetters';
import { getKurdishStrokeGuide } from '../../data/kurdishLetterGuides';
import { useAppStore } from '../../store/useAppStore';

const titles = ['گوێ بگرە', 'شێوەکانی پیت', 'وشەکان ببینە', 'پیتەکە بدۆزەوە', 'با بینووسین'];
const kurdishNumber = (value: number) => String(value).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

// The data uses both Kurdish heh forms. Highlight either without changing the word.
const WordWithLetter: React.FC<{ word: string; glyph: string }> = ({ word, glyph }) => {
  const matchWord = word.replace(/ھ/g, 'ه');
  const matchGlyph = glyph.replace(/ھ/g, 'ه');
  const index = matchWord.indexOf(matchGlyph);
  return <Text style={styles.word} accessibilityLabel={word}>
    {index < 0 ? word : <>{word.slice(0, index)}<Text style={styles.highlight}>{word.slice(index, index + glyph.length)}</Text>{word.slice(index + glyph.length)}</>}
  </Text>;
};

export const GuidedLetterLesson: React.FC<{ letter: LetterItem; onDetails: () => void }> = ({ letter, onDetails }) => {
  const { setRoute, setSelectedLetter, saveWord, recordPracticeResult } = useAppStore();
  const [formsPassed,setFormsPassed]=useState(false);
  const [step, setStep] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const answerLocked = useRef(false);
  const correct = answer === letter.glyph;
  const letterIndex = mockLetters.findIndex((item) => item.id === letter.id);
  const otherLetters = mockLetters.filter((item) => item.glyph !== letter.glyph);
  const distractor = otherLetters[(Math.max(0, letterIndex) + round) % otherLetters.length];
  const choices = (letterIndex + round) % 2 === 0 ? [letter, distractor] : [distractor, letter];
  const example = letter.exampleWords[wordIndex];
  const practiceWord = letter.exampleWords[round];
  const guide = getKurdishStrokeGuide(letter.id) || getKurdishStrokeGuide(letter.glyph) || letter.strokeGuide;
  const writingInstruction = guide?.instructionKu || 'دەست لە پیشاندان بدە، پاشان بە پەنجە بنووسە';

  useEffect(() => () => { void soundService.stopSpeaking(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [step, wordIndex, round]);
  const changeStep = (next: number) => {
    void soundService.stopSpeaking();
    setStep(next);
    answerLocked.current = false;
    setAnswer(null);
    if (next === 3) setRound(0);
  };
  const selectWord = (index: number) => {
    void soundService.stopSpeaking();
    setWordIndex(index);
  };
  const choose = (glyph: string) => {
    if (answerLocked.current) return;
    answerLocked.current = true;
    setAnswer(glyph);
    recordPracticeResult([letter.id],glyph===letter.glyph,undefined,'recognition',true);
    if (glyph === letter.glyph) soundService.playCorrect();
    else soundService.playEncouragingTryAgain();
  };
  const openLetter = (index: number) => {
    const nextLetter = mockLetters[index];
    if (!nextLetter) return;
    void soundService.stopSpeaking();
    setSelectedLetter(nextLetter);
  };
  const advance = () => {
    void soundService.stopSpeaking();
    if (step === 2 && wordIndex < letter.exampleWords.length - 1) {
      setWordIndex((index) => index + 1);
    } else if (step === 3 && round < letter.exampleWords.length - 1) {
      setRound((index) => index + 1);
      answerLocked.current = false;
    setAnswer(null);
    } else if (step === 4) {
      setSelectedLetter(letter);
      setRoute('writing');
    } else {
      changeStep(step + 1);
    }
  };
  const listen = () => {
    const text = step === 0 ? `پیتی ${letter.name}` : step === 1 ? `پیتی ${letter.name} لە وشەدا شێوەی دەگۆڕێت. شێوە و خاڵەکانی سەیر بکە.` : step === 2 ? example.word
      : step === 3 ? `وشەی ${practiceWord.word}. پیتی ${letter.name} بدۆزەوە.` : writingInstruction;
    void soundService.speakWord(text);
  };
  const nextLabel = step === 4 ? 'بنووسم ✍️'
    : step === 2 && wordIndex < letter.exampleWords.length - 1 ? 'وشەی دواتر ←'
    : step === 3 && round < letter.exampleWords.length - 1 ? 'یاریی دواتر ←' : 'هەنگاوی دواتر ←';

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => { void soundService.stopSpeaking(); setRoute('alphabet'); }}>
        <Text style={styles.secondaryText}>هەموو پیتەکان 🔤</Text>
      </TouchableOpacity>
      <Text style={styles.caption}>پیتی «{letter.glyph}» · {kurdishNumber(letterIndex + 1)} / {kurdishNumber(mockLetters.length)}</Text>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="هەنگاوەکانی وانە"
        accessibilityValue={{ min: 1, max: 5, now: step + 1 }}>
        {titles.map((title, index) => <View key={title} style={[styles.dot, index <= step && styles.dotActive]} />)}
      </View>
      <Text style={styles.stepLabel}>{kurdishNumber(step + 1)} / ٥</Text>
      <Text style={styles.title}>{titles[step]}</Text>
      <View style={styles.panel}>
        {step === 0 && <>
          <Text style={styles.glyph}>{letter.glyph}</Text>
          {letter.phonemeAudioUri && <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={()=>void soundService.playReviewedSound(letter.phonemeAudioUri!)}><Text style={styles.secondaryText}>دەنگی پیتەکە ببیستە 🔊</Text></TouchableOpacity>}
          <Text style={styles.caption}>ناوی پیت: {letter.name}</Text>
          <Text style={styles.caption}>ناوی پیت و دەنگی لە وشەدا جیاوازن؛ وشەکە ببیستە و سەیری شوێنی پیتەکە بکە.</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={()=>void soundService.speakWord(letter.exampleWords[0].word)}><Text style={styles.secondaryText}>وشەی «{letter.exampleWords[0].word}» ببیستە 🔊</Text></TouchableOpacity>
        </>}
        {step === 1 && <LetterFormsLesson key={letter.id} letter={letter} onPass={()=>setFormsPassed(true)} />}
        {step === 2 && <>
          <Text style={styles.stepLabel}>وشەی {kurdishNumber(wordIndex + 1)} / {kurdishNumber(letter.exampleWords.length)}</Text>
          <Text style={styles.rain} accessibilityLabel={example.meaningKu}>{example.imageEmoji}</Text>
          <WordWithLetter word={example.word} glyph={letter.glyph} />
          <Text style={styles.caption}>{example.meaningKu}</Text>
          <View style={styles.choices}>
            {letter.exampleWords.map((item, index) => <TouchableOpacity key={item.id} accessibilityRole="button"
              accessibilityLabel={`وشەی ${item.word}`} accessibilityState={{ selected: index === wordIndex }}
              style={[styles.wordTab, index === wordIndex && styles.activeWord]} onPress={() => selectWord(index)}>
              <Text style={styles.wordTabText}>{kurdishNumber(index + 1)} {item.imageEmoji}</Text>
            </TouchableOpacity>)}
          </View>
          <TouchableOpacity accessibilityRole="button" disabled={savedWords.includes(example.word)}
            style={styles.secondary} onPress={() => { saveWord(example.word); setSavedWords((words) => [...words, example.word]); }}>
            <Text style={styles.secondaryText}>{savedWords.includes(example.word) ? 'خەزن کرا ✓' : 'زیادی بکە بۆ وشەکانم 📒'}</Text>
          </TouchableOpacity>
        </>}
        {step === 3 && <>
          <Text style={styles.stepLabel}>یاریی {kurdishNumber(round + 1)} / {kurdishNumber(letter.exampleWords.length)}</Text>
          <Text style={styles.exampleEmoji}>{practiceWord.imageEmoji}</Text>
          <Text style={styles.practiceWord}>{practiceWord.word}</Text>
          <Text style={styles.caption}>پیتی «{letter.glyph}» بدۆزەوە</Text>
          <View style={styles.choices}>
            {choices.map((item) => <TouchableOpacity key={item.id} accessibilityRole="button"
              accessibilityLabel={`پیتی ${item.glyph}`} accessibilityState={{ selected: answer === item.glyph, disabled: answer !== null }}
              disabled={answer !== null} onPress={() => choose(item.glyph)}
              style={[styles.choice, answer === item.glyph && (correct ? styles.correct : styles.retry)]}>
              <Text style={styles.choiceGlyph}>{item.glyph}</Text>
              {answer === item.glyph && <Text style={styles.choiceMark}>{correct ? '✓' : '↻'}</Text>}
            </TouchableOpacity>)}
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>
            {answer === null ? `سەیری شێوەی «${letter.glyph}» بکە` : correct ? `ئافەرم! پیتی «${letter.glyph}» دۆزییەوە 🌟` : `باشە، جارێکی تر! پیتی «${letter.glyph}» بدۆزەوە 💛`}
          </Text>
          {answer!==null && !correct && <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={()=>{answerLocked.current=false;setAnswer(null);}}><Text style={styles.secondaryText}>جارێکی تر هەوڵ بدەم</Text></TouchableOpacity>}
        </>}
        {step === 4 && <>
          <Text style={styles.rain}>✍️</Text>
          <Text style={styles.caption}>{writingInstruction}</Text>
          <Text style={styles.glyph}>{letter.glyph}</Text>
        </>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="دەنگەکە ببیستە" style={styles.listen} onPress={listen}>
          <Volume2 color="#78350f" size={25} /><Text style={styles.listenText}>ببیستە</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity accessibilityRole="button" disabled={(step === 3 && !correct) || (step === 1 && !formsPassed)}
        accessibilityState={{ disabled: (step === 3 && !correct) || (step === 1 && !formsPassed) }} onPress={advance}
        style={[styles.next, ((step === 3 && !correct) || (step === 1 && !formsPassed)) && styles.disabled]}>
        <Text style={styles.nextText}>{nextLabel}</Text>
      </TouchableOpacity>
      {step > 0 && <TouchableOpacity accessibilityRole="button" style={styles.secondary}
        onPress={() => step === 2 && wordIndex > 0 ? selectWord(wordIndex - 1) : changeStep(step - 1)}>
        <Text style={styles.secondaryText}>{step === 2 && wordIndex > 0 ? 'وشەی پێشوو' : 'هەنگاوی پێشوو'}</Text>
      </TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={onDetails}>
        <Text style={styles.secondaryText}>زیاتر دەربارەی پیتی «{letter.glyph}»</Text>
      </TouchableOpacity>
      <View style={styles.choices}>
        {letterIndex > 0 && <TouchableOpacity accessibilityRole="button" style={styles.letterNav} onPress={() => openLetter(letterIndex - 1)}>
          <Text style={styles.secondaryText}>پیتی پێشوو «{mockLetters[letterIndex - 1].glyph}»</Text>
        </TouchableOpacity>}
        {letterIndex < mockLetters.length - 1 && <TouchableOpacity accessibilityRole="button" style={styles.letterNav} onPress={() => openLetter(letterIndex + 1)}>
          <Text style={styles.secondaryText}>پیتی دواتر «{mockLetters[letterIndex + 1].glyph}»</Text>
        </TouchableOpacity>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wordTab: { flex: 1, minHeight: 64, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  activeWord: { borderColor: '#b45309', backgroundColor: '#fef3c7' },
  wordTabText: { fontSize: 22, color: '#78350f' },
  exampleEmoji: { fontSize: 48 },
  practiceWord: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 26, color: '#334155', textAlign: 'center' },
  letterNav: { flex: 1, minHeight: 64, padding: 10, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center' },
  container: { padding: 20, gap: 12, width: '100%', maxWidth: 620, alignSelf: 'center', paddingBottom: 32 },
  progress: { flexDirection: 'row-reverse', gap: 8, justifyContent: 'center' },
  dot: { width: 40, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: '#d97706' },
  stepLabel: { textAlign: 'center', color: '#64748b', fontSize: 16 },
  title: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 28, textAlign: 'center', color: '#1e293b' },
  panel: { backgroundColor: '#fffbeb', borderRadius: 28, padding: 24, alignItems: 'center', gap: 12 },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 140, lineHeight: 200, color: '#92400e' },
  caption: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 20, color: '#334155', textAlign: 'center' },
  rain: { fontSize: 90, marginVertical: 16 },
  word: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 50, color: '#1e293b', writingDirection: 'rtl' },
  highlight: { color: '#b45309' },
  listen: { minHeight: 64, minWidth: 160, padding: 16, borderRadius: 22, flexDirection: 'row-reverse', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fde68a' },
  listenText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, color: '#78350f' },
  choices: { flexDirection: 'row-reverse', gap: 16, width: '100%' },
  choice: { flex: 1, minHeight: 145, backgroundColor: '#ffffff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#e2e8f0' },
  choiceGlyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 70, color: '#1e293b' },
  choiceMark: { fontSize: 24, color: '#334155' },
  correct: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  retry: { borderColor: '#d97706', backgroundColor: '#fef3c7' },
  feedback: { minHeight: 64, fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 18, textAlign: 'center', color: '#334155' },
  next: { minHeight: 68, padding: 18, borderRadius: 22, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  nextText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, color: '#ffffff' },
  disabled: { backgroundColor: '#64748b' },
  secondary: { minHeight: 64, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 17, color: '#475569', textAlign: 'center' },
});

