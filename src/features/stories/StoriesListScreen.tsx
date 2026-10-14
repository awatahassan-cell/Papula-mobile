import { readingPracticeStories } from '../../services/foundationalLearning';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { BookOpen, Clock, Lock, CheckCircle } from 'lucide-react-native';
import { storiesRepo } from '../../services/repositories';
import { soundService } from '../../services/soundService';
import { StoryItem } from '../../services/types';
import { useAppStore } from '../../store/useAppStore';
import { PERSONAL_STORY_TEMPLATES, templateWords, personalStories } from '../../services/learningEngine';
import { WordBuilder } from '../learning/WordBuilder';
import { learningStyles as kidStyles } from '../learning/learningStyles';

export const StoriesListScreen: React.FC = () => {
  const { setSelectedStory, setRoute, setPaywallOpen, parentSettings, currentProfile, strings } = useAppStore();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [wordLesson, setWordLesson] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const all = await storiesRepo.getAllStories();
      setStories(all);
    }
    load();
  }, []);

  const handleStoryClick = (story: StoryItem) => {
    soundService.playPop();
    if (story.isPremium && !parentSettings.isSubscribed) {
      setPaywallOpen(true);
      return;
    }
    setSelectedStory(story);
    setRoute('story-reader');
  };

  if (wordLesson) return <WordBuilder key={wordLesson} initialWords={templateWords(wordLesson)} onExit={() => setWordLesson(null)} onComplete={() => setWordLesson(null)} />;
  const readyStories = personalStories(currentProfile);
  const readingStories = readingPracticeStories(currentProfile);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.stories.screenTitle} 📚</Text>
        <Text style={styles.subtitle}>
          چیرۆکی هەمەڕەنگ بە خوێندنەوەی پیت بە پیت و دەنگی شیرین
        </Text>
      </View>

      <View style={styles.grid}>
        <Text style={kidStyles.title}>چیرۆک بە وشەکانی تۆ 🌱</Text>
        <Text style={kidStyles.text}>ئەم سێ وشەیە دروست بکە؛ پاشان چیرۆکەکە دەکرێتەوە.</Text>
        {PERSONAL_STORY_TEMPLATES.map(template => {
          const ready = readyStories.find(item => item.id === template.id);
          const words = templateWords(template.id);
          return <View key={template.id} style={kidStyles.card}>
            <Text style={kidStyles.title}>{template.emoji} {template.title}</Text>
            <Text style={kidStyles.text}>{words.map(word => `${currentProfile.learnedWordIds?.includes(word.id) ? '✓ ' : ''}${word.word}`).join(' • ')}</Text>
            <TouchableOpacity accessibilityRole="button" style={kidStyles.button} onPress={() => ready ? handleStoryClick(ready) : setWordLesson(template.id)}>
              <Text style={kidStyles.buttonText}>{ready ? 'چیرۆکەکە بخوێنەوە 📖' : 'وشەکانی چیرۆکەکە فێر ببە 🔤'}</Text>
            </TouchableOpacity>
          </View>;
        })}
        <Text style={kidStyles.title}>خۆم دەخوێنمەوە 🌱</Text>
        <Text style={kidStyles.text}>ڕستەی کورت بە پیت و وشە ناسراوەکانی تۆ</Text>
        {!readingStories.length && <Text style={kidStyles.text}>پیت و وشەکان مەشق بکە؛ ڕستەی گونجاو لێرە زیاد دەبێت. دەتوانیت ئێستا گوێ لە چیرۆکەکان بگریت.</Text>}
        {readingStories.map(story=><TouchableOpacity accessibilityRole="button" key={story.id} style={kidStyles.card} onPress={()=>handleStoryClick(story)}><Text style={kidStyles.title}>{story.coverEmoji} {story.titleKu}</Text><Text style={kidStyles.text}>خۆم بخوێنمەوە ←</Text></TouchableOpacity>)}
        <Text style={kidStyles.title}>کتێبخانەی گوێگرتن 📚</Text>
        {stories.map((story) => {
          const isCompleted = currentProfile.readStoryIds.includes(story.id);
          const isLocked = story.isPremium && !parentSettings.isSubscribed;

          return (
            <TouchableOpacity
              key={story.id}
              onPress={() => handleStoryClick(story)}
              activeOpacity={0.85}
              style={styles.storyCard}
            >
              {/* Cover Banner */}
              <View style={styles.coverBanner}>
                <View style={styles.coverMetaRow}>
                  <View style={styles.durationBadge}>
                    <Clock size={12} color="#ffffff" />
                    <Text style={styles.durationText}>{story.durationMinutes} خولەک</Text>
                  </View>

                  {isLocked ? (
                    <View style={styles.lockBadge}>
                      <Lock size={12} color="#ffffff" />
                      <Text style={styles.lockBadgeText}>تایبەت</Text>
                    </View>
                  ) : isCompleted ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle size={12} color="#ffffff" />
                      <Text style={styles.completedBadgeText}>تەواوکراو</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.coverEmoji}>{story.coverEmoji}</Text>

                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>ئاستی {story.level}</Text>
                </View>
              </View>

              {/* Story Body */}
              <View style={styles.cardBody}>
                <Text style={styles.storyTitle}>{story.titleKu}</Text>
                <Text style={styles.storySummary} numberOfLines={2}>
                  {story.summaryKu}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <BookOpen size={14} color="#64748b" />
                    <Text style={styles.pagesCount}>{story.pages.length} لاپەڕە</Text>
                  </View>
                  <Text style={styles.readLink}>دەستپێکردن ←</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  header: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  grid: {
    gap: 16,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  coverBanner: {
    height: 140,
    backgroundColor: '#38bdf8',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  lockBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lockBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  completedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  coverEmoji: {
    fontSize: 48,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: 16,
    alignItems: 'flex-end',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  storySummary: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pagesCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  readLink: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0284c7',
  },
});
