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
import { isLessonComplete, isLessonUnlocked, lessonChecklist, lessonResumeStep } from '../../services/lessonPath';
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
  const passedLetter = isLessonComplete(currentProfile, letter.id) || !!currentProfile.writingProgress?.[letter.id]?.tracePassed;
  const checklist = lessonChecklist(currentProfile, letter.id);
  const [formsPassed, setFormsPassed] = useState(passedLetter || !!progress?.formsPassed);
  const [listened, setListened] = useState(passedLetter || !!progress?.listened || currentProfile.masteredLetterIds.includes(letter.id));
  const completedListens = useRef(0);
  const listeningAttempt = useRef(0);
  const resumeStep = lessonResumeStep(currentProfile, letter.id);
  const initialWord = Math.max(0, letter.exampleWords.findIndex(word => !progress?.seenExampleIds.includes(word.id)));
  const [seenExamples, setSeenExamples] = useState<string[]>(
    passedLetter
      ? letter.exampleWords.map(w => w.id)
      : [...new Set([...(progress?.seenExampleIds || []), ...(resumeStep === 2 ? [letter.exampleWords[initialWord].id] : [])])]
  );
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
    if (step === 2 && wordIndex < letter.exampleWords.length - 1 && !passedLetter) {
      selectWord(wordIndex + 1);
    } else if (step === 3 && round < letter.exampleWords.length - 1 && (!passedLetter || answer !== null)) {
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
      if (!passedLetter) setListened(false);
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
    : step === 2 && wordIndex < letter.exampleWords.length - 1 && !passedLetter ? 'وشەی دواتر ←'
    : step === 3 && round < letter.exampleWords.length - 1 && (!passedLetter || answer !== null) ? 'یاریی دواتر ←' : 'هەنگاوی دواتر ←';
  const nextDisabled = passedLetter
    ? false
    : (step === 0 && !listened) || (step === 1 && !formsPassed) || (step === 2 && wordIndex === 2 && seenExamples.length < 3) || (step === 3 && !correct && !checklist[3]?.done);

  return (
    <View style={styles.screen}>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      <View style={styles.journey} accessibilityRole="progressbar" accessibilityLabel="هەنگاوەکانی وانە" accessibilityValue={{min:1,max:5,now:step+1}}>
        {titles.map((title,index)=>{
          const stepDone = passedLetter || index < step || !!checklist[index]?.done;
          const canJump = passedLetter || index <= step || index <= resumeStep || stepDone || (index === 4 && !!checklist[3]?.done);
          const Icon = stepDone && index !== step ? Check : stepIcons[index];
          const bubble = (
            <>
              <View style={[styles.journeyBubble, index === step && styles.journeyCurrent, stepDone && index !== step && styles.journeyDone]}>
                <Icon size={19} strokeWidth={2.2} color={stepDone && index !== step ? '#ffffff' : index === step ? styles.journeyLabelCurrent.color : styles.journeyLabel.color} />
              </View>
              <Text style={[styles.journeyLabel, index === step && styles.journeyLabelCurrent]}>{['گوێگرتن','شێوەکان','وشەکان','یاری','نووسین'][index]}</Text>
            </>
          );
          if (canJump && passedLetter) {
            return (
              <TouchableOpacity
                key={title}
                accessibilityRole="button"
                accessibilityLabel={title}
                style={styles.journeyItem}
                onPress={() => {
                  if (index === 4) {
                    void soundService.stopSpeaking();
                    setSelectedLetter(letter);
                    setRoute('writing');
                  } else {
                    changeStep(index);
                  }
                }}
              >
                {bubble}
              </TouchableOpacity>
            );
          }
          return <View key={title} style={styles.journeyItem}>{bubble}</View>;
        })}
      </View>
      <View style={styles.lessonHeading}>
        <Text style={styles.title}>{step===0?'پیتی ئەمڕۆ':titles[step]}</Text>
        <View style={styles.letterNameBadge}>
          <Text style={styles.letterNameBadgeText}>{`پیتی ${letter.name}`}</Text>
        </View>
        {passedLetter && step < 4 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`نووسین ${letter.glyph}`}
            style={styles.quickWriteBtn}
            onPress={() => { void soundService.stopSpeaking(); setSelectedLetter(letter); setRoute('writing'); }}
          >
            <Text style={styles.quickWriteText}>بنووسم ✍️</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={step === 1 ? styles.formsPanel : styles.lessonCard}>
        <View style={styles.audioRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="دەنگەکە ببیستە" style={[styles.audioButton, { flex: 1 }]} onPress={listen}>
            <Volume2 color="#ffffff" size={22} />
            <Text style={styles.audioButtonText}>{step===0?'گوێ لە پیتەکە بگرە':'ڕێنماییەکە ببیستە'}</Text>
            <Text accessible={false} style={styles.audioWaves}>▂ ▅ ▃</Text>
          </TouchableOpacity>
          <LetterVoicePractice />
        </View>
        {step === 0 && <>
          <View style={styles.letterScene}><View accessible={false}><Sparkles size={24} color={styles.sceneSpark.color} strokeWidth={1.8} /></View><View style={styles.glyphCircle}><Text style={styles.glyph}>{letter.glyph}</Text></View><View accessible={false} style={{alignSelf:'flex-end',marginBottom:12}}><Sprout size={28} color={styles.journeyLabelCurrent.color} strokeWidth={1.8} /></View></View>
          {listened&&<View style={styles.listenedBadge}><Text style={styles.listenedText}>✓ ئافەرم! ئامادەیت بۆ هەنگاوی دواتر</Text></View>}
          {letter.phonemeAudioUri&&<TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={()=>void soundService.playReviewedSound(letter.phonemeAudioUri!)}><Text style={styles.secondaryText}>دەنگی پیتەکە ببیستە</Text></TouchableOpacity>}
        </>}
        {step === 1 && <LetterFormsLesson key={letter.id} letter={letter} onPass={()=>{setFormsPassed(true);recordLessonStep(letter.id,'forms');}} />}
        {step === 2 && <>
          <View style={styles.wordCompactHeader}>
            <Text style={styles.rain} accessibilityLabel={example.meaningKu}>{example.imageEmoji}</Text>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <WordWithLetter word={example.word} glyph={letter.glyph} />
              <Text style={styles.caption}>{example.meaningKu}</Text>
            </View>
            <Text style={styles.stepLabel}>وشەی {kurdishNumber(wordIndex + 1)} / {kurdishNumber(letter.exampleWords.length)}</Text>
          </View>
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
          <View style={styles.findWordRow}>
            <Text style={styles.exampleEmoji}>{practiceWord.imageEmoji}</Text>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.practiceWord}>{practiceWord.word}</Text>
              <Text style={styles.caption}>پیتی «{letter.glyph}» بدۆزەوە</Text>
            </View>
            <View style={styles.roundBadge}>
              <Text style={styles.stepLabel}>یاریی {kurdishNumber(round + 1)} / {kurdishNumber(letter.exampleWords.length)}</Text>
            </View>
          </View>
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
            {answer === null ? `سەیری شێوەی «${letter.glyph}» بکە` : correct ? `ئافەرم! پیتی «${letter.glyph}» دۆزییەوە` : `باشە، جارێکی تر! پیتی «${letter.glyph}» بدۆزەوە`}
          </Text>
          {answer!==null && !correct && <TouchableOpacity accessibilityRole="button" style={styles.retryBtn} onPress={()=>{answerLocked.current=false;setAnswer(null);}}><Text style={styles.retryBtnText}>جارێکی تر هەوڵ بدەم</Text></TouchableOpacity>}
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
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:showMore}} style={styles.more} onPress={()=>setShowMore(!showMore)}><Text style={styles.secondaryText}>{showMore?'کەمتر ⌃':'زیاتر ⌄'}</Text></TouchableOpacity>
      {showMore && <><TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => { void soundService.stopSpeaking(); setRoute('alphabet'); }}>
        <Text style={styles.secondaryText}>هەموو پیتەکان</Text>
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
      {step > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={step === 2 && wordIndex > 0 && !passedLetter ? 'وشەی پێشوو' : 'هەنگاوی پێشوو'} style={styles.previous}
        onPress={() => step === 2 && wordIndex > 0 && !passedLetter ? selectWord(wordIndex - 1) : changeStep(step - 1)}><Text style={styles.previousText}>→</Text></TouchableOpacity>}
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
  journey:{flexDirection:'row',justifyContent:'space-between',paddingVertical:2,gap:4},
  journeyItem:{flex:1,alignItems:'center',gap:3},
  journeyBubble:{width:36,height:36,borderRadius:14,backgroundColor:'#eaf0ed',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'transparent'},
  journeyCurrent:{backgroundColor:'#e3f5ec',borderColor:'#23875f'},
  journeyDone:{backgroundColor:'#23875f'},
  journeyIcon:{fontSize:18,color:'#ffffff'},
  journeyLabel:{fontSize:11,color:'#657d79',textAlign:'center'},
  journeyLabelCurrent:{color:'#176445',fontFamily:'IBMPlexSansArabic_700Bold'},
  lessonHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:4,gap:8},
  letterNameBadge:{backgroundColor:'#ede5ff',paddingHorizontal:12,paddingVertical:4,borderRadius:14,borderWidth:1.5,borderColor:'#cab8f5'},
  letterNameBadgeText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:15,color:'#3b2f63'},
  quickWriteBtn:{backgroundColor:'#fde68a',paddingHorizontal:12,paddingVertical:6,borderRadius:16,borderBottomWidth:3,borderBottomColor:'#d97706'},
  quickWriteText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:14,color:'#78350f'},
  audioRow:{width:'100%',flexDirection:'row',alignItems:'center',gap:8},
  letterScene:{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16,paddingVertical:2},
  glyphCircle:{width:118,height:118,borderRadius:59,backgroundColor:'#e3f5ec',alignItems:'center',justifyContent:'center',borderWidth:5,borderColor:'#f2faf6'},
  sceneSpark:{fontSize:24,color:'#c98a1b'},
  sceneLeaf:{fontSize:26,alignSelf:'flex-end',marginBottom:12},
  heroTitle:{fontSize:18,lineHeight:30,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a',textAlign:'center'},
  heroHint:{fontSize:14,color:'#657d79',textAlign:'center'},
  audioButton:{minHeight:52,borderRadius:18,backgroundColor:'#23875f',borderBottomWidth:4,borderBottomColor:'#176445',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:12,paddingVertical:8},
  audioButtonText:{fontSize:16,fontFamily:'IBMPlexSansArabic_700Bold',color:'#ffffff',textAlign:'center',flexShrink:1},
  audioWaves:{fontSize:15,color:'#c8ead8'},
  listenedBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:12,backgroundColor:'#eff8ed'},
  listenedText:{fontSize:13,color:'#176445',textAlign:'center'},
  storyLink:{width:'100%',flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#fff3df',borderRadius:22,padding:10,borderWidth:1,borderColor:'#f0dfc0'},
  storyThumb:{width:68,height:74,borderRadius:14,backgroundColor:'#ffffff'},
  storyCopy:{flex:1,gap:2},
  storyEyebrow:{fontSize:11,color:'#8d6636'},
  storyTitle:{fontSize:18,color:'#243b3a',fontFamily:'IBMPlexSansArabic_700Bold'},
  storyHint:{fontSize:12,color:'#657d79'},
  storyArrow:{width:30,height:30,borderRadius:15,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},
  storyArrowText:{fontSize:20,color:'#8d6636'},
  stepHeader: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8 },
  stepVoice: { width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:18,backgroundColor:'#fde68a' },
  formsPanel: { width:'100%', backgroundColor: '#ffffff', borderRadius: 26, borderWidth: 1, borderColor: '#dce9e1', padding: 14, gap: 10 },
  footer: { width:'100%',maxWidth:620,alignSelf:'center',paddingHorizontal:12,paddingTop:4,paddingBottom:8,flexDirection:'row',gap:8,backgroundColor:'#fffdf7' },
  footerNext: { flex:1 },
  previous: { width:54,minHeight:52,alignItems:'center',justifyContent:'center',backgroundColor:'#f1f5f9',borderRadius:18 },
  previousText: { fontSize:24,color:'#334155' },
  more: { minHeight:36,alignItems:'center',justifyContent:'center' },
  wordCompactHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#f8f5ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  findWordRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#f8f5ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  roundBadge: { backgroundColor: '#ede5ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  wordTab: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  activeWord: { borderColor: '#b45309', backgroundColor: '#fef3c7' },
  wordTabText: { fontSize: 19, color: '#78350f' },
  exampleEmoji: { fontSize: 40 },
  practiceWord: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 24, color: '#334155', textAlign: 'center' },
  letterNav: { flex: 1, minHeight: 52, padding: 8, borderRadius: 16, backgroundColor: '#dbeafe', justifyContent: 'center' },
  container: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, gap: 8, width: '100%', maxWidth: 620, alignSelf: 'center' },
  progress: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot: { width: 14, height: 6, borderRadius: 4, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: '#d97706' },
  stepLabel: { textAlign: 'center', color: '#475569', fontSize: 13, fontFamily: 'IBMPlexSansArabic_600SemiBold' },
  title: { flex:1,fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 19, textAlign: 'right', color: '#1e293b' },
  lessonCard: { backgroundColor: '#ffffff', borderRadius: 26, borderWidth:1, borderColor:'#dce9e1', padding: 14, alignItems: 'center', gap: 10 },
  glyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 76, lineHeight: 100, color: '#92400e' },
  caption: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 16, color: '#334155', textAlign: 'center' },
  rain: { fontSize: 46, marginVertical: 2 },
  word: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 38, color: '#1e293b', writingDirection: 'rtl' },
  highlight: { color: '#b45309' },
  listen: { minHeight: 52, minWidth: 140, padding: 12, borderRadius: 20, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fde68a' },
  listenText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 18, color: '#78350f' },
  choices: { flexDirection: 'row', gap: 12, width: '100%' },
  choice: { flex: 1, minHeight: 92, backgroundColor: '#f8f5ff', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#cab8f5', borderBottomWidth: 5, borderBottomColor: '#cab8f5' },
  choiceGlyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 50, color: '#1e293b' },
  choiceMark: { fontSize: 20, color: '#334155' },
  correct: { borderColor: '#16a34a', borderBottomColor: '#15803d', backgroundColor: '#dcfce7' },
  retry: { borderColor: '#d97706', borderBottomColor: '#b45309', backgroundColor: '#fef3c7' },
  feedback: { minHeight: 28, fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 15, textAlign: 'center', color: '#334155' },
  retryBtn: { width: '100%', minHeight: 48, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#fde68a', borderWidth: 2, borderColor: '#f59e0b', borderBottomWidth: 4, borderBottomColor: '#d97706', justifyContent: 'center', alignItems: 'center' },
  retryBtnText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 17, color: '#78350f', textAlign: 'center' },
  next: { minHeight: 52, padding: 10, borderRadius: 22, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  nextText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 20, color: '#ffffff' },
  disabled: { backgroundColor: '#64748b' },
  secondary: { width: '100%', minHeight: 46, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, color: '#1e293b', textAlign: 'center' },
  detailsButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0' },
  detailsText: { flex: 1, fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 16, lineHeight: 26, color: '#334155', writingDirection: 'rtl', textAlign: 'right' },
  detailsBadge: { width: 40, minHeight: 42, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  detailsGlyph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 28, lineHeight: 38, color: '#78350f', textAlign: 'center' },
});


