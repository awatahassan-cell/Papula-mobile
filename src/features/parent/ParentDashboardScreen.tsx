import { LearningReport } from '../learning/LearningReport';
import { audioCache } from '../../services/audioCache';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import {
  Shield,
  Clock,
  BookOpen,
  Award,
  Users,
  CreditCard,
  CheckCircle,
  Plus,
} from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { mockLetters } from '../../data/mockLetters';
import { runParentGateTests } from '../../services/parentGate';
import { progressRepo } from '../../services/repositories';
import { soundService } from '../../services/soundService';
import { runTracingScorerTests } from '../../services/tracingScorer';
import { WeeklyStats } from '../../services/types';
import { useAppStore } from '../../store/useAppStore';

const LIMIT_OPTIONS = [15, 30, 45, 60, 90];

export const ParentDashboardScreen: React.FC = () => {
  const {
    currentProfile,
    profiles,
    switchProfile,
    createProfile,
    parentSettings,
    updateParentSettings,
    setPaywallOpen,
    setRoute,
    strings,
  } = useAppStore();

  const [showLegacyAudio,setShowLegacyAudio]=useState(false);
  const [audioCount, setAudioCount] = useState(0);
  useEffect(() => { void audioCache.count().then(setAudioCount); }, []);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAvatar, setNewChildAvatar] = useState('🐻');
  const [testResults, setTestResults] = useState<{
    tracing: { passed: boolean; message: string }[];
    gate: { passed: boolean; message: string }[];
  } | null>(null);

  useEffect(() => {
    async function loadStats() {
      const stats = await progressRepo.getWeeklyStats(currentProfile.id);
      setWeeklyStats(stats);
    }
    loadStats();
  }, [currentProfile]);

  const handleRunTests = () => {
    soundService.playPop();
    const tracing = runTracingScorerTests();
    const gate = runParentGateTests();
    setTestResults({ tracing, gate });
    soundService.playCorrect();
  };

  const handleCreateChild = () => {
    if (!newChildName.trim()) return;
    createProfile({
      name: newChildName.trim(),
      avatar: newChildAvatar,
      ageGroup: '5-6',
    });
    setNewChildName('');
    setShowAddProfile(false);
  };

  const lettersNeedingPractice = mockLetters.filter((l) =>
    weeklyStats?.needsPracticeLetterIds.includes(l.id)
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{padding:16,backgroundColor:'#ecfdf5',borderRadius:20,marginBottom:16}}>
        <Text style={{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:18,textAlign:'right'}}>دەنگی ناو ئەپ: {soundService.getBundledAudioCount()} • کاشی نوێ: {audioCount} 🔊</Text>
        <Text style={{fontFamily:'IBMPlexSansArabic_400Regular',textAlign:'right'}}>دەنگی ElevenLabs کە جارێک گوێی لێ گیرا، دەتوانرێت دووبارە بێ ئینتەرنێت ببیسترێت. تا ٦٤ دەنگ لە سنووری بیرگەدا هەڵدەگیرێت؛ دەنگی نوێ ئینتەرنێتی پێویستە.</Text>
      </View>
      <View style={{padding:16,gap:10}}>
        <TouchableOpacity accessibilityRole="button" onPress={()=>setShowLegacyAudio(!showLegacyAudio)}><Text style={{fontFamily:'IBMPlexSansArabic_700Bold',textAlign:'right'}}>دەنگە کۆنە هەڵگیراوەکان: {soundService.getLegacyAudioCount()} 🔊</Text></TouchableOpacity>
        {showLegacyAudio && <><Text style={{textAlign:'right'}}>ئەم فایلانە ناوی دەقەکانیان نییە؛ گوێیان لێ بگرن بۆ ناسینەوە.</Text>{soundService.getLegacyCachedSoundKeys().map((key,index)=><TouchableOpacity accessibilityRole="button" key={key} onPress={()=>void soundService.playLegacyCachedSound(key)} style={{padding:12,backgroundColor:'#ecfdf5',borderRadius:12}}><Text style={{textAlign:'right'}}>دەنگی هەڵگیراوی {index+1} ▶</Text></TouchableOpacity>)}</>}
      </View>
      {/* Title */}
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.title}>{strings.parent.dashboardTitle}</Text>
            <Shield size={24} color="#d97706" />
          </View>
          <Text style={styles.subtitle}>
            چاودێری فێربوون و ڕێکخستنی کات بۆ {currentProfile.name}
          </Text>
        </View>

        <BigButton
          onPress={() => setRoute('home')}
          variant="outline"
          size="sm"
          style={styles.backHomeBtn}
        >
          گەڕانەوە بۆ ناو ئەپ
        </BigButton>
      </View>

      <LearningReport profile={currentProfile} />
      {/* Profiles Switcher */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            onPress={() => setShowAddProfile(!showAddProfile)}
            style={styles.addProfileBtn}
          >
            <Text style={styles.addProfileBtnText}>+ منداڵی نوێ</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>پرۆفایلی منداڵەکان 👥</Text>
        </View>

        {showAddProfile && (
          <View style={styles.addProfileBox}>
            <TextInput
              value={newChildName}
              onChangeText={setNewChildName}
              placeholder="ناوی منداڵ..."
              placeholderTextColor="#94a3b8"
              style={styles.nameInput}
              textAlign="right"
            />
            <View style={styles.avatarChoiceRow}>
              {['🦊', '🐻', '🦁', '🐰', '🦋', '🐬'].map((em) => (
                <TouchableOpacity
                  key={em}
                  onPress={() => setNewChildAvatar(em)}
                  style={[
                    styles.avatarChoice,
                    newChildAvatar === em && styles.avatarChoiceSelected,
                  ]}
                >
                  <Text style={styles.avatarChoiceText}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <BigButton onPress={handleCreateChild} variant="primary" size="sm">
              زیادکردن ✓
            </BigButton>
          </View>
        )}

        <View style={styles.profilesList}>
          {profiles.map((p) => {
            const isActive = p.id === currentProfile.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => switchProfile(p.id)}
                style={[
                  styles.profilePill,
                  isActive && styles.profilePillActive,
                ]}
              >
                <Text style={styles.profileAvatar}>{p.avatar}</Text>
                <Text style={[styles.profilePillName, isActive && styles.profilePillNameActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Weekly Stats */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>کۆی مەشقە تۆمارکراوەکان 📊</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {weeklyStats ? `${weeklyStats.minutesSpent} خولەک` : '...'}
            </Text>
            <Text style={styles.statLabel}>کاتی مەشقی نووسین</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {currentProfile.masteredLetterIds.length} / {mockLetters.length}
            </Text>
            <Text style={styles.statLabel}>پیتە تەواوکراوەکان</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statVal}>{currentProfile.readStoryIds.length}</Text>
            <Text style={styles.statLabel}>چیرۆکەکان</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {weeklyStats ? `${weeklyStats.accuracyAverage}%` : '...'}
            </Text>
            <Text style={styles.statLabel}>ئاستی دروستی</Text>
          </View>
        </View>
      </View>

      {/* Letters needing practice */}
      {lettersNeedingPractice.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>پیتە پێشنیارکراوەکان بۆ مەشق 🎯</Text>
          <Text style={styles.sectionSub}>
            ئەم پیتانە پێویستیان بە دووبارەکردنەوەی زیاترە:
          </Text>
          <View style={styles.practiceLettersRow}>
            {lettersNeedingPractice.map((l) => (
              <View key={l.id} style={styles.practiceLetterTag}>
                <Text style={styles.practiceLetterGlyph}>{l.glyph}</Text>
                <Text style={styles.practiceLetterName}>{l.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Time & Safety Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>کۆنتڕۆڵی کات و پاراستن ⏱️</Text>

        {/* Daily screen time limit */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>دیاریکردنی کاتی ڕۆژانە (خولەک):</Text>
          <View style={styles.limitsRow}>
            {LIMIT_OPTIONS.map((mins) => {
              const isSelected = parentSettings.dailyLimitMinutes === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  onPress={() => updateParentSettings({ dailyLimitMinutes: mins })}
                  style={[
                    styles.limitBtn,
                    isSelected && styles.limitBtnActive,
                  ]}
                >
                  <Text style={[styles.limitBtnText, isSelected && styles.limitBtnTextActive]}>
                    {mins}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bedtime Lock Toggle */}
        <View style={styles.toggleRow}>
          <Switch
            value={parentSettings.bedtimeLockEnabled}
            onValueChange={(val) => updateParentSettings({ bedtimeLockEnabled: val })}
            trackColor={{ false: '#cbd5e1', true: '#f59e0b' }}
          />
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleHeading}>قفڵی کاتی خەوتن (Bedtime Lock)</Text>
            <Text style={styles.toggleSub}>
              شەوانە ئەپەکە قفڵ دەکات بۆ ئەوەی منداڵ پشوو بدات
            </Text>
          </View>
        </View>

        {/* ElevenLabs Kurdish Voice Selector */}
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>
              دەنگی هۆشمەندی کوردی (ElevenLabs v4):
            </Text>
            <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#047857' }}>چالاکە ✅</Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {[
              { id: 'Bella', voiceId: 'hpp4J3VqNfWAUOO0d1Us', label: 'خاتوون بێلا (Bella)', desc: 'مامۆستای نەرم و دۆستانە' },
              { id: 'Jessica', voiceId: 'cgSgspJ2msm6clMCkdW9', label: 'جێسیکا (Jessica)', desc: 'دەنگی شادمان و هاوڕێیانە' },
              { id: 'Alice', voiceId: 'Xb7hH8MSUJpSbSDYk0k2', label: 'ئالیس (Alice)', desc: 'مامۆستای پەروەردەیی و ڕوون' },
              { id: 'Sarah', voiceId: 'EXAVITQu4vr4xnSDxMaL', label: 'سارە (Sarah)', desc: 'دەنگی هێمن و ئارامبەخش' },
              { id: 'George', voiceId: 'JBFqnCBsd6RMkjVDRZzb', label: 'جۆرج (George)', desc: 'گێڕەرەوەی میهرەبانی چیرۆک' },
            ].map((v) => {
              const isSelected = soundService.getVoice() === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => {
                    soundService.setVoice(v.id, v.voiceId);
                    soundService.playPop();
                    soundService.speakWord('سڵاو هاوڕێی شیرینم! بەخێربێیت بۆ پەپوولە بە دەنگی نوێی ئیلێڤن لابس.', { voice: v.id, voiceId: v.voiceId });
                  }}
                  activeOpacity={0.8}
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#38bdf8' : '#e2e8f0',
                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, color: isSelected ? '#0284c7' : '#94a3b8', fontWeight: '800' }}>
                      {isSelected ? 'هەڵبژێردراوە 🔊' : 'تاقیکردنەوە 🔊'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a' }}>{v.label}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{v.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Unit Tests Runner */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>تاقیکردنەوەکانی سیستەم 🧪</Text>
        <Text style={styles.sectionSub}>
          پشکنینی دروستی ئەلگۆریتمی نووسین و دەروازەی دایک و باوک
        </Text>

        <BigButton
          onPress={handleRunTests}
          variant="secondary"
          size="md"
          style={styles.testBtn}
        >
          دەستپێکردنی پشکنینی ناوخۆیی 🚀
        </BigButton>

        {testResults && (
          <View style={styles.testResultsBox}>
            <Text style={styles.testResultsTitle}>ئەنجامی پشکنینەکان:</Text>
            {testResults.tracing.map((t, idx) => (
              <Text key={`tr-${idx}`} style={styles.testItem}>
                {t.passed ? '✅' : '❌'} {t.message}
              </Text>
            ))}
            {testResults.gate.map((g, idx) => (
              <Text key={`gt-${idx}`} style={styles.testItem}>
                {g.passed ? '✅' : '❌'} {g.message}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Subscription Paywall card */}
      <View style={styles.paywallCard}>
        <Text style={styles.paywallTitle}>ئابوونەی پەپوولە پڵەس ⭐</Text>
        <Text style={styles.paywallSub}>
          {parentSettings.isSubscribed
            ? 'تۆ خاوەنی هەژماری تەواویت! سوپاس بۆ هاوکاریت.'
            : 'دەستڕاگەیشتن بە هەموو چیرۆکە تایبەتەکان و نوێکارییەکان.'}
        </Text>

        <BigButton
          onPress={() => setPaywallOpen(true)}
          variant="primary"
          size="md"
          style={styles.paywallBtn}
        >
          {parentSettings.isSubscribed ? 'بەڕێوەبردنی ئابوونە' : 'بینینی پلانەکان 💳'}
        </BigButton>
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
    gap: 8,
  },
  titleCol: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  backHomeBtn: {
    alignSelf: 'flex-start',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'right',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 12,
  },
  addProfileBtn: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addProfileBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  addProfileBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  nameInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  avatarChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  avatarChoice: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarChoiceSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  avatarChoiceText: {
    fontSize: 20,
  },
  profilesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  profilePillActive: {
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  profileAvatar: {
    fontSize: 16,
  },
  profilePillName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  profilePillNameActive: {
    color: '#92400e',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  practiceLettersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  practiceLetterTag: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  practiceLetterGlyph: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400e',
  },
  practiceLetterName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350f',
  },
  settingRow: {
    marginVertical: 10,
    alignItems: 'flex-end',
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  limitsRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  limitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  limitBtnActive: {
    backgroundColor: '#f59e0b',
  },
  limitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  limitBtnTextActive: {
    color: '#ffffff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  toggleTextCol: {
    alignItems: 'flex-end',
    flex: 1,
    marginRight: 10,
  },
  toggleHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e293b',
  },
  toggleSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  testBtn: {
    marginTop: 6,
  },
  testResultsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  testResultsTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f59e0b',
    marginBottom: 4,
  },
  testItem: {
    fontSize: 11,
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  paywallCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: '#fde68a',
    alignItems: 'center',
  },
  paywallTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#78350f',
    marginBottom: 4,
  },
  paywallSub: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 12,
  },
  paywallBtn: {
    width: '100%',
    maxWidth: 240,
  },
});
