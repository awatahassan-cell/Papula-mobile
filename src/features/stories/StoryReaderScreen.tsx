import { StorySequence } from '../learning/StorySequence';
import { readableText } from '../../services/foundationalLearning';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Volume2,
  BookOpen,
} from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { StarRating } from '../../components/StarRating';
import { soundService } from '../../services/soundService';
import { StoryPage } from '../../services/types';
import { useAppStore } from '../../store/useAppStore';

export const StoryReaderScreen: React.FC = () => {
  const { selectedStory, setRoute, completeStory, saveWord, triggerConfetti, strings, currentProfile, recordSkillResult } = useAppStore();
  const [pageIndex, setPageIndex] = useState(0);
  const [readMode, setReadMode] = useState<'read_to_me' | 'i_read'>(selectedStory?.practiceMode==='read'?'i_read':'read_to_me');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequencing,setSequencing]=useState(false);
  const readingHelp=useRef(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizSuccess, setQuizSuccess] = useState<boolean | null>(null);
  const [storyFinished, setStoryFinished] = useState(false);

  const playbackTimerRef = useRef<any>(null);
  const narrationRef = useRef(0);
  const quizLockedRef = useRef(false);
  const quizTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const story = selectedStory;

  const stopNarration = () => {
    setIsPlaying(false);
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    narrationRef.current++;
    void soundService.stopSpeaking();
  };

  useEffect(() => {
    stopNarration();
    if (readMode === 'read_to_me' && story && !showQuiz && !storyFinished && !sequencing) {
      startKaraokeNarration(pageIndex);
    }
    return () => stopNarration();
  }, [pageIndex, readMode, showQuiz, storyFinished, sequencing]);

  useEffect(() => () => { if (quizTimerRef.current) clearTimeout(quizTimerRef.current); }, []);

  if (!story) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>هیچ چیرۆکێک هەڵنەبژێردراوە</Text>
        <BigButton onPress={() => setRoute('stories')} style={styles.emptyBtn}>
          گەڕانەوە بۆ چیرۆکەکان
        </BigButton>
      </View>
    );
  }

  const currentPage: StoryPage = story.pages[pageIndex];

  const startKaraokeNarration = (pIdx: number) => {
    stopNarration();
    setIsPlaying(true);

    const page = story.pages[pIdx];
    const token = narrationRef.current;
    void soundService.speakWord(page.textKu, { onEnd: () => {
      if (token !== narrationRef.current) return;
      setIsPlaying(false);
      if (readMode === 'read_to_me') {
        playbackTimerRef.current = setTimeout(() => {
          if (token !== narrationRef.current) return;
          if (pIdx < story.pages.length - 1) setPageIndex(pIdx + 1);
          else setShowQuiz(true);
        }, 1400);
      }
    }, onError: () => { if (token === narrationRef.current) setIsPlaying(false); }});
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopNarration();
    } else {
      startKaraokeNarration(pageIndex);
    }
  };

  const handleWordTap = (word: string) => {
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
    return (
      <View style={styles.finishedContainer}>
        <Text style={styles.finishedEmoji}>🎉 📖</Text>
        <Text style={styles.finishedTitle}>پیرۆزە! چیرۆکەکەت تەواو کرد!</Text>
        <Text style={styles.finishedSub}>
          زۆر باشە! چیرۆکەکەت خوێندەوە و لێی تێگەیشتیت.
        </Text>

        <View style={styles.starsBox}>
          <StarRating stars={3} maxStars={3} size="lg" />
        </View>

        <BigButton
          onPress={() => setRoute('stories')}
          variant="primary"
          size="lg"
          style={styles.actionBtn}
        >
          گەڕانەوە بۆ کتێبخانە 📚
        </BigButton>
      </View>
    );
  }

  if (showQuiz) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.quizCard}>
          <Text style={styles.quizHeader}>تاقیکردنەوەی تێگەیشتن 🎯</Text>
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Mode Selector & Header */}
      <View style={styles.headerRow}>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setReadMode('read_to_me');
            }}
            style={[styles.modeTab, readMode === 'read_to_me' && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, readMode === 'read_to_me' && styles.modeTabTextActive]}>
              بۆم بخوێنەوە 🔊
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setReadMode('i_read');
            }}
            style={[styles.modeTab, readMode === 'i_read' && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, readMode === 'i_read' && styles.modeTabTextActive]}>
              خۆم دەخوێنمەوە 📖
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageCountText}>
          لاپەڕە {pageIndex + 1} / {story.pages.length}
        </Text>
      </View>

      {readMode==='i_read' && !readableText(currentPage.textKu,currentProfile) && <Text style={styles.finishedSub}>وشە یان پیتی نوێ تێدایە؛ دەتوانیت بە یارمەتی بخوێنیتەوە یان گوێی لێ بگریت.</Text>}
      {/* Story Illustration Card */}
      <View style={styles.illustrationCard}>
        <Text style={styles.illustrationEmoji}>{story.coverEmoji}</Text>
      </View>

      {/* Synchronized Word by Word Karaoke Text */}
      <View style={styles.karaokeCard}>
        <Text testID="story-paragraph" accessibilityLabel={currentPage.textKu} style={styles.storyParagraph}>
          {currentPage.textKu.split(/(\s+)/).map((part, index) => /\s/.test(part)
            ? part
            : <Text key={index} onPress={() => handleWordTap(part)}>{part}</Text>)}
        </Text>
      </View>

      {/* Navigation & Audio Controls */}
      <View style={styles.controlsRow}>
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
          <ChevronRight size={18} color="#334155" />
          <Text style={styles.navBtnText}>پێشوو</Text>
        </TouchableOpacity>

        <TouchableOpacity
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
          onPress={() => {
            soundService.playPop();
            if (pageIndex < story.pages.length - 1) {
              setPageIndex(pageIndex + 1);
            } else {
              setShowQuiz(true);
            }
          }}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>
            {pageIndex < story.pages.length - 1 ? 'دواتر' : 'تاقیکردنەوە'}
          </Text>
          <ChevronLeft size={18} color="#334155" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    paddingHorizontal: 12,
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
    fontSize: 11,
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
  illustrationCard: {
    height: 180,
    backgroundColor: '#e0f2fe',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  illustrationEmoji: {
    fontSize: 72,
  },
  karaokeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fed7aa',
    padding: 20,
    marginBottom: 20,
  },
  storyParagraph: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 26, lineHeight: 46, textAlign: 'right', writingDirection: 'rtl', direction: 'rtl', width: '100%' },
  wordsWrap: {
    flexDirection: 'row-reverse',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  playBtn: {
    backgroundColor: '#f59e0b',
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
