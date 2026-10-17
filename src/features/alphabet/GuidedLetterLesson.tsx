import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import { LetterVoicePractice } from './LetterVoicePractice';
import { LetterFormsLesson } from '../learning/LetterFormsLesson';
import React, { useEffect, useRef, useState } from 'react';
import { Image, View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/RTLText';
import { Volume2, Headphones, Shapes, Images, Target, PencilLine, Check, Sparkles, Sprout, BookOpen, ArrowLeft } from 'lucide-react-native';
import { LetterItem } from '../../services/types';
import { soundService } from '../../services/soundService';
import { mockLetters } from '../../data/mockLetters';
import { getLetterStories } from '../../data/letterStories';
import { getKurdishStrokeGuide } from '../../data/kurdishLetterGuides';
import { isLessonUnlocked, lessonResumeStep } from '../../services/lessonPath';
import { useAppStore } from '../../store/useAppStore';

const stepIcons = [Headphones, Shapes, Images, Target, PencilLine];
const titles = ['گوێ بگرە', 'شێوەکانی پیت', 'وشەکان ببینە', 'پیتەکە بدۆزەوە', 'با بینووسین'];
const kurdishNumber = (value: number) => String(value).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

// The data uses both Kurdish heh forms. Highlight either without changing the word.
const WordWithLetter: React.FC<{ word: string; glyph: string }> = ({ word, glyph }) => {
  const styles = useThemeStyles(baseStyles);
  const matchWord = word.replace(/ھ/g, 'ه');
  const matchGlyph = glyph.replace(/ھ/g, 'ه');
  const index = matchWord.indexOf(matchGlyph);
  return <Text style={styles.word} accessibilityLabel={word}>
    {index < 0 ? word : <>{word.slice(0, index)}<Text style={styles.highlight}>{word.slice(index, index + glyph.length)}</Text>{word.slice(index + glyph.length)}</>}
  </Text>;
};

export const GuidedLetterLesson: React.FC<{ letter: LetterItem }> = ({ letter }) => {
  const styles = useThemeStyles(baseStyles);
  const { currentProfile, setRoute, setSelectedLetter, setSelectedStory, saveWord, recordPracticeResult, recordLessonStep } = useAppStore();
  const progress = currentProfile.lessonProgress?.[letter.id];
  const [formsPassed,setFormsPassed]=useState(!!progress?.formsPassed);
  const [listened,setListened]=useState(!!progress?.listened || currentProfile.masteredLetterIds.includes(letter.id));
  const completedListens = useRef(0);
  const listeningAttempt = useRef(0);
  const resumeStep = lessonResumeStep(currentProfile,letter.id);
  const initialWord = Math.max(0,letter.exampleWords.findIndex(word=>!progress?.seenExampleIds.includes(word.id)));
  const [seenExamples,setSeenExamples]=useState<string[]>([...new Set([...(progress?.seenExampleIds || []), ...(resumeStep===2?[letter.exampleWords[initialWord].id]:[])])]);
  const [step, setStep] = useState(resumeStep);
  const [wordIndex, setWordIndex] = useState(initialWord);
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
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

  useEffect(() => {
    if(step===0) {void soundService.speakWord('پەپوولە ئەمڕۆ پیتێکی تازەی بۆ هێناون و ئەویش بریتییە لە', {onEnd:()=>{void soundService.speakWord(`پیتی ${letter.name}`, {onEnd:()=>{void soundService.speakWord('تۆش بە جوانی گوێ بگرە و چەند جارێک بیڵێرەوە.');}});}});}
    else void soundService.speakWord(titles[step]);
    return ()=>{void soundService.stopSpeaking();};
  }, [step,letter.name]);
  useEffect(() => () => { void soundService.stopSpeaking(); }, []);
  useEffect(() => {
    if (step === 2) {
      const id = letter.exampleWords[wordIndex].id;
      recordLessonStep(letter.id,'example',id);
    }
  }, [step, wordIndex, letter.id, letter.exampleWords, recordLessonStep]);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [step, wordIndex, round]);
  const changeStep = (next: number) => {
    void soundService.stopSpeaking();
    setStep(next);
    answerLocked.current = false;
    setAnswer(null);
    if (next === 3) setRound(0);
    if (next === 2) {
      const id = letter.exampleWords[wordIndex].id;
      recordLessonStep(letter.id, 'example', id);
      setSeenExamples(previous => [...new Set([...previous, id])]);
    }
  };
  const selectWord = (index: number) => {
    void soundService.stopSpeaking();
    setWordIndex(index);
    recordLessonStep(letter.id, 'example', letter.exampleWords[index].id);
    setSeenExamples(previous => [...new Set([...previous, letter.exampleWords[index].id])]);
  };
  const choose = (glyph: string) => {
    if (answerLocked.current) return;
    answerLocked.current = true;
    setAnswer(glyph);
    recordPracticeResult([letter.id],glyph===letter.glyph,undefined,'recognition',true);
    if (glyph === letter.glyph) { recordLessonStep(letter.id, 'recognition', practiceWord.id); soundService.playCorrect(); }
    else soundService.playEncouragingTryAgain();
  };
  const openLetter = (index: number) => {
    const nextLetter = mockLetters[index];
    if (!nextLetter || !isLessonUnlocked(currentProfile, nextLetter.id)) return;
    void soundService.stopSpeaking();
    setSelectedLetter(nextLetter);
  };
  const advance = () => {
    void soundService.stopSpeaking();
    if (step === 2 && wordIndex < letter.exampleWords.length - 1) {
      selectWord(wordIndex + 1);
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
    if (step === 0) {
      setListened(false);
      const attempt = ++listeningAttempt.current;
      const praise = () => {
        let finished = false;
        void soundService.speakWord('ئافەرم! ئامادەیت بۆ هەنگاوی دواتر.', {onEnd:()=>{
          if (finished || attempt !== listeningAttempt.current) return;
          finished = true;
          setListened(true);
          recordLessonStep(letter.id, 'listening');
        }});
      };
      if (completedListens.current >= 3) { praise(); return; }
      let finished = false;
      void soundService.speakWord(`پیتی ${letter.name}`, {onEnd:()=>{
        if (finished || attempt !== listeningAttempt.current) return;
        finished = true;
        completedListens.current++;
        if (completedListens.current === 3) praise();
      }});
      return;
    }
    const text = step === 0 ? `پیتی ${letter.name}` : step === 1 ? 'شێوە و خاڵەکانی پیتەکە لە وشەدا سەیر بکە.' : step === 2 ? example.word
      : step === 3 ? `وشەی ${practiceWord.word}. پیتی ${letter.name} بدۆزەوە.` : writingInstruction;
    void soundService.speakWord(text, { onEnd: () => {
    } });
  };
  const nextLabel = step === 4 ? 'بنووسم ✍️'
    : step === 2 && wordIndex < letter.exampleWords.length - 1 ? 'وشەی دواتر ←'
    : step === 3 && round < letter.exampleWords.length - 1 ? 'یاریی دواتر ←' : 'هەنگاوی دواتر ←';
  const nextDisabled = (step === 0 && !listened) || (step === 1 && !formsPassed) || (step === 2 && wordIndex === 2 && seenExamples.length < 3) || (step === 3 && !correct);

  return (
    <View style={styles.screen}>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      <View style={styles.journey} accessibilityRole="progressbar" accessibilityLabel="هەنگاوەکانی وانە" accessibilityValue={{min:1,max:5,now:step+1}}>
        {titles.map((title,index)=>{const Icon=index<step?Check:stepIcons[index];return <View key={title} style={styles.journeyItem}><View style={[styles.journeyBubble,index===step&&styles.journeyCurrent,index<step&&styles.journeyDone]}><Icon size={21} strokeWidth={2} color={index<step?'#ffffff':index===step?styles.journeyLabelCurrent.color:styles.journeyLabel.color} /></View><Text style={[styles.journeyLabel,index===step&&styles.journeyLabelCurrent]}>{['گوێگرتن','شێوەکان','وشەکان','یاری','نووسین'][index]}</Text></View>})}
      </View>
      <View style={styles.lessonHeading}><Text style={styles.title}>{step===0?'پیتی ئەمڕۆ':titles[step]}</Text></View>
      <View style={step === 1 ? styles.formsPanel : styles.lessonCard}>
        {step === 0 && <>
          <View style={styles.letterScene}><View accessible={false}><Sparkles size={26} color={styles.sceneSpark.color} strokeWidth={1.8} /></View><View style={styles.glyphCircle}><Text style={styles.glyph}>{letter.glyph}</Text></View><View accessible={false} style={{alignSelf:'flex-end',marginBottom:18}}><Sprout size={32} color={styles.journeyLabelCurrent.color} strokeWidth={1.8} /></View></View>
        </>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="دەنگەکە ببیستە" style={styles.audioButton} onPress={listen}><Volume2 color="#ffffff" size={24} /><Text style={styles.audioButtonText}>{step===0?'گوێ لە پیتەکە بگرە':'ڕێنماییەکە ببیستە'}</Text><Text accessible={false} style={styles.audioWaves}>▂ ▅ ▃</Text></TouchableOpacity>
        {step===0&&<>
          {listened&&<View style={styles.listenedBadge}><Text style={styles.listenedText}>✓ ئافەرم! ئامادەیت بۆ هەنگاوی دواتر</Text></View>}
          {letter.phonemeAudioUri&&<TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={()=>void soundService.playReviewedSound(letter.phonemeAudioUri!)}><Text style={styles.secondaryText}>دەنگی پیتەکە ببیستە 🔊</Text></TouchableOpacity>}
        </>}
        {step === 1 && <LetterFormsLesson key={letter.id} letter={letter} onPass={()=>{setFormsPassed(true);recordLessonStep(letter.id,'forms');}} />}
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
      </View>
      {step === 0 && getLetterStories(letter.id).map(story => <TouchableOpacity key={story.id} accessibilityRole="button" accessibilityLabel={`چیرۆکی پیتی ${letter.glyph}: ${story.titleKu}`} style={styles.storyLink} onPress={() => {
        void soundService.stopSpeaking(); setSelectedStory(story); setRoute('story-reader');
      }}>
        {story.coverImage !== undefined && <Image source={story.coverImage} accessible={false} resizeMode="cover" style={styles.storyThumb} />}
        <View style={styles.storyCopy}><View style={{flexDirection:'row',gap:6,alignItems:'center'}}><BookOpen size={15} color={styles.storyEyebrow.color} strokeWidth={1.8} /><Text style={styles.storyEyebrow}>چیرۆکی پیتەکە</Text></View><Text style={styles.storyTitle}>{story.titleKu}</Text><Text style={styles.storyHint}>ببینە و گوێ بگرە</Text></View><View style={styles.storyArrow}><ArrowLeft size={19} color={styles.storyEyebrow.color} strokeWidth={2} /></View>
      </TouchableOpacity>)}
            <LetterVoicePractice />
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:showMore}} style={styles.more} onPress={()=>setShowMore(!showMore)}><Text style={styles.secondaryText}>{showMore?'کەمتر ⌃':'زیاتر ⌄'}</Text></TouchableOpacity>
      {showMore && <><TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => { void soundService.stopSpeaking(); setRoute('alphabet'); }}>
        <Text style={styles.secondaryText}>هەموو پیتەکان 🔤</Text>
      </TouchableOpacity><View style={styles.choices}>
        {letterIndex > 0 && <TouchableOpacity accessibilityRole="button" style={styles.letterNav} onPress={() => openLetter(letterIndex - 1)}>
          <Text style={styles.secondaryText}>پیتی پێشوو «{mockLetters[letterIndex - 1].glyph}»</Text>
        </TouchableOpacity>}
        {letterIndex < mockLetters.length - 1 && isLessonUnlocked(currentProfile,mockLetters[letterIndex+1].id) && <TouchableOpacity accessibilityRole="button" style={styles.letterNav} onPress={() => openLetter(letterIndex + 1)}>
          <Text style={styles.secondaryText}>پیتی دواتر «{mockLetters[letterIndex + 1].glyph}»</Text>
        </TouchableOpacity>}
      </View></>}
    </ScrollView>
    <View style={styles.footer}>
      {step > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={step === 2 && wordIndex > 0 ? 'وشەی پێشوو' : 'هەنگاوی پێشوو'} style={styles.previous}
        onPress={() => step === 2 && wordIndex > 0 ? selectWord(wordIndex - 1) : changeStep(step - 1)}><Text style={styles.previousText}>→</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" disabled={nextDisabled}
        accessibilityState={{ disabled: nextDisabled }} onPress={advance}
        style={[styles.next, styles.footerNext, nextDisabled && styles.disabled]}>
        <Text style={styles.nextText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View></View>
  );
};

const baseStyles = StyleSheet.create({
  screen: { flex: 1 },
  journey:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,gap:4},
  journeyItem:{flex:1,alignItems:'center',gap:5},
  journeyBubble:{width:40,height:40,borderRadius:16,backgroundColor:'#eaf0ed',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'transparent'},
  journeyCurrent:{backgroundColor:'#e3f5ec',borderColor:'#23875f'},
  journeyDone:{backgroundColor:'#23875f'},
  journeyIcon:{fontSize:19,color:'#ffffff'},
  journeyLabel:{fontSize:11,color:'#657d79',textAlign:'center'},
  journeyLabelCurrent:{color:'#176445',fontFamily:'IBMPlexSansArabic_700Bold'},
  lessonHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:4,gap:12},
  letterScene:{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:18,paddingVertical:4},
  glyphCircle:{width:152,height:152,borderRadius:76,backgroundColor:'#e3f5ec',alignItems:'center',justifyContent:'center',borderWidth:6,borderColor:'#f2faf6'},
  sceneSpark:{fontSize:28,color:'#c98a1b'},
  sceneLeaf:{fontSize:30,alignSelf:'flex-end',marginBottom:16},
  heroTitle:{fontSize:20,lineHeight:34,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a',textAlign:'center'},
  heroHint:{fontSize:15,color:'#657d79',textAlign:'center'},
  audioButton:{width:'100%',maxWidth:460,alignSelf:'center',minHeight:58,borderRadius:19,backgroundColor:'#23875f',borderBottomWidth:4,borderBottomColor:'#176445',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:10},
  audioButtonText:{fontSize:18,fontFamily:'IBMPlexSansArabic_700Bold',color:'#ffffff',textAlign:'center',flexShrink:1},
  audioWaves:{fontSize:17,color:'#c8ead8'},
  listenedBadge:{paddingHorizontal:10,paddingVertical:6,borderRadius:12,backgroundColor:'#eff8ed'},
  listenedText:{fontSize:13,color:'#176445',textAlign:'center'},
  storyLink:{width:'100%',flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#fff3df',borderRadius:24,padding:12,borderWidth:1,borderColor:'#f0dfc0'},
  storyThumb:{width:82,height:92,borderRadius:16,backgroundColor:'#ffffff'},
  storyCopy:{flex:1,gap:3},
  storyEyebrow:{fontSize:12,color:'#8d6636'},
  storyTitle:{fontSize:20,color:'#243b3a',fontFamily:'IBMPlexSansArabic_700Bold'},
  storyHint:{fontSize:13,color:'#657d79'},
  storyArrow:{width:32,height:32,borderRadius:16,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},
  storyArrowText:{fontSize:22,color:'#8d6636'},
  stepHeader: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8 },
  stepVoice: { width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:20,backgroundColor:'#fde68a' },
  formsPanel: { width:'100%' },
  footer: { width:'100%',maxWidth:620,alignSelf:'center',paddingHorizontal:12,paddingTop:6,paddingBottom:10,flexDirection:'row',gap:8,backgroundColor:'#fffdf7' },
  footerNext: { flex:1 },
  previous: { width:60,minHeight:60,alignItems:'center',justifyContent:'center',backgroundColor:'#f1f5f9',borderRadius:20 },
  previousText: { fontSize:26,color:'#334155' },
  more: { minHeight:44,alignItems:'center',justifyContent:'center' },
  wordTab: { flex: 1, minHeight: 64, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  activeWord: { borderColor: '#b45309', backgroundColor: '#fef3c7' },
  wordTabText: { fontSize: 22, color: '#78350f' },
  exampleEmoji: { fontSize: 48 },
  practiceWord: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 26, color: '#334155', textAlign: 'center' },
  letterNav: { flex: 1, minHeight: 64, padding: 10, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center' },
  container: { padding: 12, gap: 10, width: '100%', maxWidth: 620, alignSelf: 'center', paddingBottom: 12 },
  progress: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot: { width: 14, height: 6, borderRadius: 4, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: '#d97706' },
  stepLabel: { minWidth:44, textAlign: 'center', color: '#64748b', fontSize: 16 },
  title: { flex:1,fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 21, textAlign: 'right', color: '#1e293b' },
  lessonCard: { backgroundColor: '#ffffff', borderRadius: 30, borderWidth:1, borderColor:'#dce9e1', padding: 20, alignItems: 'center', gap: 12 },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 104, lineHeight: 138, color: '#92400e' },
  caption: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 20, color: '#334155', textAlign: 'center' },
  rain: { fontSize: 64, marginVertical: 4 },
  word: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 50, color: '#1e293b', writingDirection: 'rtl' },
  highlight: { color: '#b45309' },
  listen: { minHeight: 64, minWidth: 160, padding: 16, borderRadius: 22, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fde68a' },
  listenText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, color: '#78350f' },
  choices: { flexDirection: 'row', gap: 16, width: '100%' },
  choice: { flex: 1, minHeight: 145, backgroundColor: '#ffffff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#e2e8f0' },
  choiceGlyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 70, color: '#1e293b' },
  choiceMark: { fontSize: 24, color: '#334155' },
  correct: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  retry: { borderColor: '#d97706', backgroundColor: '#fef3c7' },
  feedback: { minHeight: 64, fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 18, textAlign: 'center', color: '#334155' },
  next: { minHeight: 60, padding: 12, borderRadius: 22, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  nextText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 22, color: '#ffffff' },
  disabled: { backgroundColor: '#64748b' },
  secondary: { minHeight: 64, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 17, color: '#475569', textAlign: 'center' },
  detailsButton: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 22, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0' },
  detailsText: { flex: 1, fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, lineHeight: 28, color: '#334155', writingDirection: 'rtl', textAlign: 'right' },
  detailsBadge: { width: 44, minHeight: 46, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  detailsGlyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 30, lineHeight: 42, color: '#78350f', textAlign: 'center' },
});

