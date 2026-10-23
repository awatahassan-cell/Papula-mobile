import { BackButton } from '../../components/BackButton';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import { mockLetters } from '../../data/mockLetters';
import { LEARNING_PAGE_PAUSE_MS } from '../../services/storyPlayback';
import { StorySequence } from '../learning/StorySequence';
import { readableText } from '../../services/foundationalLearning';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { ResponsiveStoryImage } from '../../components/ResponsiveStoryImage';
import { Text, InlineText } from '../../components/RTLText';
import { StoryVoiceRecorder } from './StoryVoiceRecorder';
import { HelpHint } from '../../components/HelpButton';
import { exerciseHelp } from '../../services/exerciseHelp';
import { androidLetterHighlightRuns } from '../../services/letterHighlight';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Volume2,
  BookOpen,
  Trophy, Sparkles, Star, Check, ArrowLeft, Shapes,
} from 'lucide-react-native';
import { soundService } from '../../services/soundService';
import { StoryPage } from '../../services/types';
import { useAppStore } from '../../store/useAppStore';
import { useResponsive } from '../../theme/responsive';

export const StoryReaderScreen: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { selectedStory, setSelectedLetter, setRoute, completeStory, saveWord, triggerConfetti, currentProfile, recordSkillResult, saveCheckpoint, clearCheckpoint, learningPaused } = useAppStore();
  const bookmark = currentProfile.checkpoint?.kind === 'story' && currentProfile.checkpoint.contentId === selectedStory?.id ? currentProfile.checkpoint : undefined;
  const { isNight, tone } = useAppearance();
  // The word being read glows: warm cream by day, gold at night.
  const highlight = { backgroundColor: isNight ? '#473366' : '#ffe29a' };
  const info = useResponsive();
  const { tablet, pageMax } = info;
  const split = info.wide && info.landscape;
  const artSize = Math.max(300, Math.min(560, info.height - 330));
  const [pageIndex, setPageIndex] = useState(Math.max(0, Math.min((selectedStory?.pages.length || 1) - 1, bookmark?.pageIndex || 0)));
  const [readMode, setReadMode] = useState<'read_to_me' | 'i_read'>(bookmark?.readMode || (selectedStory?.practiceMode==='read'?'i_read':'read_to_me'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWord,setActiveWord]=useState<{start:number;end:number}|null>(null);
  const introduced=useRef(false);
  const [sequencing,setSequencing]=useState(false);
  const readingHelp=useRef(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizSuccess, setQuizSuccess] = useState<boolean | null>(null);
  const [storyFinished, setStoryFinished] = useState(false);
  const [familyRecording, setFamilyRecording] = useState(false);
  useEffect(() => {
    if (storyFinished) clearCheckpoint?.();
    else if (selectedStory) saveCheckpoint?.({ kind: 'story', contentId: selectedStory.id, pageIndex, readMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStory?.id, pageIndex, readMode, storyFinished]);

  const playbackTimerRef = useRef<any>(null);
  const narrationRef = useRef(0);
  const quizLockedRef = useRef(false);
  const completionLockedRef = useRef(false);
  const quizTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const story = selectedStory;
  const targetLetter = mockLetters.find(letter => letter.id === story?.targetLetterId);

  const stopNarration = () => {
    setIsPlaying(false);
    setActiveWord(null);
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    narrationRef.current++;
    void soundService.stopSpeaking();
  };

  useEffect(() => {
    // Narration is restarted whenever the page or mode changes; the starter is defined below the early return.
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
    stopNarration();
    if (!learningPaused && readMode === 'read_to_me' && story && !showQuiz && !storyFinished && !sequencing) {
      startKaraokeNarration(pageIndex);
    }
    return () => stopNarration();
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/immutability */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, readMode, showQuiz, storyFinished, sequencing, learningPaused]);

  useEffect(() => () => { if (quizTimerRef.current) clearTimeout(quizTimerRef.current); }, []);

  if (!story) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>هیچ چیرۆکێک هەڵنەبژێردراوە</Text>
        <BackButton onPress={() => setRoute('stories')} fullWidth style={styles.emptyBtn}>گەڕانەوە بۆ چیرۆکەکان</BackButton>
      </View>
    );
  }

  const currentPage: StoryPage = story.pages[pageIndex];

  const finishReading = () => {
    if (story.quiz) setShowQuiz(true);
    else {
      if (completionLockedRef.current) return;
      completionLockedRef.current = true;
      stopNarration();
      setStoryFinished(true);
      completeStory(story.id);
    }
  };

  const startKaraokeNarration = (pIdx: number) => {
    stopNarration();
    setIsPlaying(true);

    const page = story.pages[pIdx];
    const token = narrationRef.current;
    const readPage = () => { if(token !== narrationRef.current)return; void soundService.speakStory(story.id, page.pageNumber, page.textKu, {
      onWord:(start,end)=>{if(token===narrationRef.current)setActiveWord({start,end});},
      onEnd: () => {
      if (token !== narrationRef.current) return;
      setIsPlaying(false);
      setActiveWord(null);
      if (readMode === 'read_to_me') {
        playbackTimerRef.current = setTimeout(() => {
          if (token !== narrationRef.current) return;
          if (pIdx < story.pages.length - 1) setPageIndex(pIdx + 1);
          else finishReading();
        }, LEARNING_PAGE_PAUSE_MS);
      }
    }, onError: () => { if (token === narrationRef.current) {setIsPlaying(false);setActiveWord(null);} }}); };
    if(targetLetter && pIdx===0 && !introduced.current){
      introduced.current=true;
      void soundService.speakWord(`پیتی ${targetLetter.name}`,{onEnd:()=>{if(token!==narrationRef.current)return;void soundService.speakWord('ئێستا با چیرۆکێک ببیستین. لە وشەکاندا پیتەکە بدۆزەوە.',{onEnd:readPage,onError:readPage});},onError:readPage});
    }else readPage();
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopNarration();
    } else {
      startKaraokeNarration(pageIndex);
    }
  };

  const handleWordTap = (word: string) => {
    if (familyRecording) return;
    readingHelp.current=true;stopNarration();
    soundService.playPop();
    soundService.speakWord(word);
    saveWord(word);
  };

  const handleQuizAnswer = (optionId: string, isCorrect: boolean) => {
    if (quizLockedRef.current) return;
    quizLockedRef.current = true;
    recordSkillResult('reading',isCorrect,readMode==='read_to_me'||readingHelp.current||!story.pages.every(page=>readableText(page.textKu,currentProfile)));
    setQuizSelectedOption(optionId);
    if (isCorrect) {
      setQuizSuccess(true);
      soundService.playSuccessFanfare();
      triggerConfetti();
      quizTimerRef.current = setTimeout(() => {
        if(story.pages.length>1)setSequencing(true);else{setStoryFinished(true);completeStory(story.id);}
      }, 1500);
    } else {
      setQuizSuccess(false);
      soundService.playEncouragingTryAgain();
      quizTimerRef.current = setTimeout(() => {
        quizLockedRef.current = false;
        setQuizSuccess(null);
        setQuizSelectedOption(null);
      }, 1200);
    }
  };

  if(sequencing)return <StorySequence story={story} onComplete={()=>{setSequencing(false);setStoryFinished(true);completeStory(story.id);}} />;
  if (storyFinished) {
    const continueLesson = () => { if(targetLetter){setSelectedLetter(targetLetter);setRoute(story.journeyLetterId ? 'garden-quest' : 'letter-detail');} };
    return (
      <ScrollView contentContainerStyle={styles.completionPage}>
        <View testID="story-completion" style={styles.completionSheet}>
          <View style={styles.celebrationArt} accessible={false}>
            <View style={styles.trophyHalo}><View style={styles.trophyMedal}><Trophy size={48} color={tone('#a36b17')} fill="#f9d67a" strokeWidth={1.6}/></View></View>
            <View style={styles.sparkRight}><Sparkles size={27} color={styles.completionBadgeText.color} strokeWidth={1.8}/></View>
            <View style={styles.sparkLeft}><Star size={21} color={tone('#d79b35')} fill="#f9d67a" strokeWidth={1.7}/></View>
            <View style={styles.successSeal}><Check size={19} color="#ffffff" strokeWidth={3}/></View>
          </View>
          <Text style={styles.completionTitle}>پیرۆزە! چیرۆکەکەت تەواو کرد!</Text>
          <Text style={styles.completionMessage}>{story.quiz?'زۆر باشە! چیرۆکەکەت خوێندەوە و لێی تێگەیشتیت.':'زۆر باشە! وانەکەت خوێندەوە. با پێکەوە مەشق بکەین.'}</Text>
          <View style={styles.completedBook}>
            <View style={styles.completedBookIcon}><BookOpen size={25} color={styles.completionBadgeText.color} strokeWidth={1.8}/></View>
            <View style={styles.completedBookCopy}><Text style={styles.completedBookLabel}>چیرۆکی ئەمڕۆت</Text><Text style={styles.completedBookTitle}>{story.titleKu}</Text></View>
            <View style={styles.completedBookCheck}><Check size={18} color={styles.completionBadgeText.color}/></View>
          </View>
          <View style={styles.completionActions}>
            {targetLetter&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={story.journeyLetterId ? 'گەڕانەوە بۆ باغ و ڕوواندنی گوڵ' : `بەردەوام بە لە وانەی پیتی ${targetLetter.glyph}`} onPress={continueLesson} style={styles.completionPrimary}><View style={styles.completionActionIcon}><Shapes size={23} color="#ffffff"/></View><Text style={styles.completionPrimaryText}>{story.journeyLetterId?'با گوڵەکەم بڕوێنم':'بەردەوام بە لە وانەکە'}</Text><ArrowLeft size={20} color="#ffffff"/></TouchableOpacity>}
            {!story.journeyLetterId && <BackButton fullWidth onPress={()=>setRoute('stories')}>گەڕانەوە بۆ چیرۆکەکان</BackButton>}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (showQuiz && story.quiz) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.quizCard}>
          <Text style={styles.quizHeader}>تاقیکردنەوەی تێگەیشتن</Text>
          <Text style={styles.quizQuestion}>{story.quiz.questionKu}</Text>

          <View style={styles.quizOptionsList}>
            {story.quiz.options.map((opt) => {
              const isSelected = quizSelectedOption === opt.id;
              const isOptionCorrect = isSelected && quizSuccess === true;
              const isOptionWrong = isSelected && quizSuccess === false;

              return (
                <TouchableOpacity
                  key={opt.id}
                  disabled={quizSelectedOption !== null}
                  onPress={() => handleQuizAnswer(opt.id, opt.isCorrect)}
                  activeOpacity={0.8}
                  style={[
                    styles.quizOptionBtn,
                    isOptionCorrect
                      ? styles.quizOptCorrect
                      : isOptionWrong
                      ? styles.quizOptWrong
                      : styles.quizOptNormal,
                  ]}
                >
                  <Text style={styles.quizOptEmoji}>{opt.imageEmoji}</Text>
                  <Text style={styles.quizOptText}>{opt.textKu}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.readerScreen}><ScrollView contentContainerStyle={[styles.container, tablet && { maxWidth: pageMax, width: '100%', alignSelf: 'center' }]}>
      {targetLetter && <BackButton accessibilityLabel={`گەڕانەوە بۆ وانەی پیتی ${targetLetter.glyph}`} onPress={()=>{stopNarration();setSelectedLetter(targetLetter);setRoute('letter-detail');}} style={{ marginBottom: 12 }}>{`وانەی پیتی «${targetLetter.glyph}»`}</BackButton>}
      {/* Mode Selector & Header */}
      <HelpHint text={exerciseHelp.story} disabled={familyRecording} />
      <Text style={styles.storyTitle}>{story.titleKu}</Text>
      <View style={styles.headerRow}>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            disabled={familyRecording}
            onPress={() => {
              soundService.playPop();
              setReadMode('read_to_me');
            }}
            style={[styles.modeTab, readMode === 'read_to_me' && styles.modeTabActive]}
          >
            <Volume2 size={19} color={readMode==='read_to_me'?styles.modeTabTextActive.color:styles.modeTabText.color}/>
            <Text style={[styles.modeTabText, readMode === 'read_to_me' && styles.modeTabTextActive]}>
              بۆم بخوێنەوە
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={familyRecording}
            onPress={() => {
              soundService.playPop();
              setReadMode('i_read');
            }}
            style={[styles.modeTab, readMode === 'i_read' && styles.modeTabActive]}
          >
            <BookOpen size={19} color={readMode==='i_read'?styles.modeTabTextActive.color:styles.modeTabText.color}/>
            <Text style={[styles.modeTabText, readMode === 'i_read' && styles.modeTabTextActive]}>
              خۆم دەخوێنمەوە
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageCountText}>
          لاپەڕە {pageIndex + 1} / {story.pages.length}
        </Text>
      </View>

      <StoryVoiceRecorder key={`${currentProfile.id}:${story.id}`} storyId={story.id} profileId={currentProfile.id}
        paused={learningPaused} narrationPlaying={isPlaying} onBegin={() => { stopNarration(); setReadMode('i_read'); }} onRecordingChange={setFamilyRecording} />

    {split ? <View style={styles.readerSplit}>
      <View style={{ width: artSize }}>
      {/* Story Illustration Card */}
      <View style={[styles.storyArtworkFrame, split && { maxWidth: artSize }]}>
        {currentPage.illustrationImage !== undefined
          ? <ResponsiveStoryImage source={currentPage.illustrationImage} label={story.titleKu} />
          : <Text style={styles.illustrationEmoji}>{story.coverEmoji}</Text>}
      </View>
      {currentPage.additionalImages?.map((source, index) => <ResponsiveStoryImage key={index} source={source} label={`${story.titleKu}، وێنەی ${index + 2}`} />)}


      </View>
      <View style={styles.readerText}>
      {readMode==='i_read' && !readableText(currentPage.textKu,currentProfile) && <Text style={styles.finishedSub}>وشە یان پیتی نوێ تێدایە؛ دەتوانیت بە یارمەتی بخوێنیتەوە یان گوێی لێ بگریت.</Text>}
      {/* Synchronized Word by Word Karaoke Text */}
      <View style={[styles.readingCard, split && styles.readingCardSplit]}>
        <Text testID="story-paragraph" accessibilityLabel={currentPage.textKu} style={[styles.storyParagraph, split && styles.storyParagraphSplit]}>
          {currentPage.textKu.split(/(\s+)/).map((part, index, parts) => /\s/.test(part)
            ? part
            : <InlineText key={index} style={[activeWord && parts.slice(0,index).join('').length >= activeWord.start && parts.slice(0,index).join('').length < activeWord.end ? highlight : undefined]} onPress={() => handleWordTap(part)}>{androidLetterHighlightRuns(part, targetLetter?.glyph).map((run, runIndex) => run.target ? <InlineText key={runIndex} style={styles.targetGlyph}>{Platform.OS === 'android' ? run.displayText : run.text}</InlineText> : Platform.OS === 'android' ? run.displayText : run.text)}</InlineText>)}
        </Text>
      </View>

      </View>
    </View> : <>
      {readMode==='i_read' && !readableText(currentPage.textKu,currentProfile) && <Text style={styles.finishedSub}>وشە یان پیتی نوێ تێدایە؛ دەتوانیت بە یارمەتی بخوێنیتەوە یان گوێی لێ بگریت.</Text>}
      {/* Story Illustration Card */}
      <View style={styles.storyArtworkFrame}>
        {currentPage.illustrationImage !== undefined
          ? <ResponsiveStoryImage source={currentPage.illustrationImage} label={story.titleKu} />
          : <Text style={styles.illustrationEmoji}>{story.coverEmoji}</Text>}
      </View>
      {currentPage.additionalImages?.map((source, index) => <ResponsiveStoryImage key={index} source={source} label={`${story.titleKu}، وێنەی ${index + 2}`} />)}



      {/* Synchronized Word by Word Karaoke Text */}
      <View style={styles.readingCard}>
        <Text testID="story-paragraph" accessibilityLabel={currentPage.textKu} style={styles.storyParagraph}>
          {currentPage.textKu.split(/(\s+)/).map((part, index, parts) => /\s/.test(part)
            ? part
            : <InlineText key={index} style={[activeWord && parts.slice(0,index).join('').length >= activeWord.start && parts.slice(0,index).join('').length < activeWord.end ? highlight : undefined]} onPress={() => handleWordTap(part)}>{androidLetterHighlightRuns(part, targetLetter?.glyph).map((run, runIndex) => run.target ? <InlineText key={runIndex} style={styles.targetGlyph}>{Platform.OS === 'android' ? run.displayText : run.text}</InlineText> : Platform.OS === 'android' ? run.displayText : run.text)}</InlineText>)}
        </Text>
      </View>

    </>}
    </ScrollView>
      {/* Navigation & Audio Controls */}
      <View style={[styles.controlsRow, tablet && { maxWidth: pageMax }]}>
        <TouchableOpacity
          onPress={() => {
            if (pageIndex > 0) {
              soundService.playPop();
              setPageIndex(pageIndex - 1);
            }
          }}
          disabled={pageIndex === 0}
          style={[styles.navBtn, pageIndex === 0 && styles.navBtnDisabled]}
        >
          <ChevronRight size={18} color={tone('#334155')} />
          <Text style={styles.navBtnText}>پێشوو</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isPlaying?'وەستاندنی چیرۆک':'گوێگرتن لە چیرۆک'}
          disabled={familyRecording}
          onPress={handleTogglePlay}
          style={styles.playBtn}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <Pause size={18} color="#ffffff" />
          ) : (
            <Play size={18} color="#ffffff" />
          )}
          <Text style={styles.playBtnText}>{isPlaying ? 'وەستان' : 'دەنگ'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={familyRecording && pageIndex === story.pages.length - 1}
          onPress={() => {
            soundService.playPop();
            if (pageIndex < story.pages.length - 1) {
              setPageIndex(pageIndex + 1);
            } else {
              finishReading();
            }
          }}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>
            {pageIndex < story.pages.length - 1 ? 'دواتر' : story.quiz ? 'تاقیکردنەوە' : 'تەواو بکەم'}
          </Text>
          <ChevronLeft size={18} color={tone('#334155')} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  completionPage:{flexGrow:1,alignItems:'center',justifyContent:'center',padding:18,paddingBottom:28},
  completionSheet:{width:'100%',maxWidth:560,backgroundColor:'#ffffff',borderRadius:30,borderWidth:1,borderColor:'#dce9e1',padding:18,alignItems:'center',gap:12},
  celebrationArt:{width:190,height:116,alignItems:'center',justifyContent:'center'},
  trophyHalo:{width:110,height:110,borderRadius:55,backgroundColor:'#e3f5ec',alignItems:'center',justifyContent:'center'},
  trophyMedal:{width:88,height:88,borderRadius:44,backgroundColor:'#fff8e3',alignItems:'center',justifyContent:'center',borderWidth:5,borderColor:'#ffffff'},
  sparkRight:{position:'absolute',right:2,top:23},sparkLeft:{position:'absolute',left:4,top:67},
  successSeal:{position:'absolute',bottom:0,right:43,width:30,height:30,borderRadius:16,backgroundColor:'#23875f',borderWidth:3,borderColor:'#ffffff',alignItems:'center',justifyContent:'center'},
  completionBadge:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#e3f5ec',borderRadius:12,paddingHorizontal:10,paddingVertical:5},
  completionBadgeText:{fontSize:12,color:'#176445',fontFamily:'IBMPlexSansArabic_600SemiBold'},
  completionTitle:{fontSize:24,lineHeight:38,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a',textAlign:'center'},
  completionMessage:{fontSize:14,lineHeight:26,color:'#657d79',textAlign:'center'},
  completedBook:{width:'100%',flexDirection:'row',alignItems:'center',gap:10,padding:12,backgroundColor:'#f4f9f6',borderRadius:20},
  completedBookIcon:{width:44,height:48,borderRadius:16,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},
  completedBookCopy:{flex:1,minWidth:0,gap:3},completedBookLabel:{fontSize:11,color:'#657d79'},completedBookTitle:{fontSize:17,lineHeight:28,fontFamily:'IBMPlexSansArabic_600SemiBold',color:'#243b3a'},
  completedBookCheck:{width:28,height:28,borderRadius:16,backgroundColor:'#e3f5ec',alignItems:'center',justifyContent:'center'},
  completionStars:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,paddingVertical:2},
  completionActions:{width:'100%',gap:8,marginTop:2},
  completionPrimary:{width:'100%',minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:12,borderRadius:20,backgroundColor:'#23875f',borderBottomWidth:4,borderBottomColor:'#176445'},
  completionActionIcon:{width:34,height:34,borderRadius:11,backgroundColor:'rgba(255,255,255,0.14)',alignItems:'center',justifyContent:'center'},
  completionPrimaryText:{flex:1,flexShrink:1,color:'#ffffff',fontSize:16,lineHeight:27,textAlign:'center',fontFamily:'IBMPlexSansArabic_700Bold'},
  completionSecondary:{width:'100%',minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,padding:12,borderRadius:20,backgroundColor:'#ffffff',borderWidth:1.5,borderColor:'#dce9e1'},
  completionSecondaryText:{flexShrink:1,color:'#176445',fontSize:15,lineHeight:25,textAlign:'center',fontFamily:'IBMPlexSansArabic_600SemiBold'},
  readerScreen:{flex:1},
  storyTitle:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:24,color:'#1e293b',textAlign:'center',marginBottom:10},
  readerSplit:{flexDirection:'row',gap:24,alignItems:'stretch',justifyContent:'center'},readerText:{flex:1,minWidth:0,justifyContent:'center'},
  readingCardSplit:{maxWidth:undefined,padding:28},
  storyParagraphSplit:{fontSize:34,lineHeight:62},
  backToLesson:{minHeight:44,flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:4,marginBottom:12},
  backText:{fontSize:14,color:'#657d79',fontFamily:'IBMPlexSansArabic_600SemiBold'},
  targetGlyph: { color: '#ea580c' },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fffdfa',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyBtn: {
    width: 220,
  },
  headerRow: {
    flexDirection: 'column',
    gap:10,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeTabs: {
    flexDirection: 'row',
    width:'100%',maxWidth:620,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex:1,minWidth:0,minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    flexShrink:1,
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#0f172a',
  },
  pageCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  storyArtworkFrame: {
    width: '100%', maxWidth: 620, alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#dce9e1',
    overflow:'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  storyImage: { width: '100%', aspectRatio: 1, borderRadius: 24 },
  sourceCredit: { fontSize: 13, color: '#64748b', textAlign: 'right', marginBottom: 12 },
  illustrationEmoji: {
    paddingVertical:44,
    fontSize: 86,
  },
  readingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#dce9e1',
    padding: 20,
    marginBottom: 16,
    width:'100%',maxWidth:620,alignSelf:'center',
  },
  storyParagraph: { color: '#1e293b', fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 26, lineHeight: 46, textAlign: 'right', writingDirection: 'rtl', width: '100%' },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  wordTouchable: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
  },
  wordHighlighted: {
    backgroundColor: '#fef08a',
  },
  karaokeWordText: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    writingDirection: 'rtl',
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: 34,
  },
  karaokeWordTextHighlighted: {
    color: '#b45309',
    fontWeight: '900',
  },
  controlsRow: {
    width:'100%',maxWidth:840,alignSelf:'center',padding:12,backgroundColor:'#f4f9f6',borderTopWidth:1,borderTopColor:'#dce9e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    flex:1,minWidth:0,minHeight:62,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 16,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    flexShrink:1,textAlign:'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  playBtn: {
    flex:1.2,minWidth:0,minHeight:62,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,
    backgroundColor: '#23875f',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    borderColor: '#fed7aa',
    alignItems: 'center',
  },
  quizHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'center',
    marginBottom: 20,
  },
  quizOptionsList: {
    width: '100%',
    gap: 12,
  },
  quizOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
  },
  quizOptNormal: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  quizOptCorrect: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  quizOptWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  quizOptEmoji: {
    fontSize: 28,
  },
  quizOptText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffdfa',
  },
  finishedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  finishedSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsBox: {
    marginBottom: 28,
  },
  actionBtn: {
    width: '100%',
    maxWidth: 280,
  },
});
