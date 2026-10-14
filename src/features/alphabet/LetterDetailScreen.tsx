import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Volume2,
  Mic,
  Square,
  Play,
  Edit3,
  Gamepad2,
  BookmarkPlus,
  CheckCircle,
} from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { soundService } from '../../services/soundService';
import { voiceRecorderService } from '../../services/voiceRecorderService';
import { useAppStore } from '../../store/useAppStore';
import { GuidedLetterLesson } from './GuidedLetterLesson';

export const LetterDetailScreen: React.FC = () => {
  const { selectedLetter, setRoute, saveWord } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [hasUserRecording, setHasUserRecording] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isConnectingLetter = selectedLetter
    ? selectedLetter.forms.initial !== selectedLetter.forms.isolated
    : false;

  const [activeFormTab, setActiveFormTab] = useState<'initial' | 'medial' | 'final' | 'isolated'>('initial');

  useEffect(() => {
    setActiveFormTab('initial');
    setShowDetails(false);
  }, [selectedLetter?.id]);

  if (!selectedLetter) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>تکایە سەرەتا پیتێک هەڵبژێرە</Text>
        <BigButton onPress={() => setRoute('alphabet')} style={styles.emptyBtn}>
          گەڕانەوە بۆ ئەلفوبێ
        </BigButton>
      </View>
    );
  }

  if (!showDetails) {
    return <GuidedLetterLesson key={selectedLetter.id} letter={selectedLetter} onDetails={() => setShowDetails(true)} />;
  }

  const handlePlayLetterSound = () => {
    soundService.speakWord(`پیتی ${selectedLetter.name}، ${selectedLetter.glyph}`, {
      letterName: selectedLetter.name,
    });
  };

  const handlePlayWordSound = (word: string) => {
    soundService.playPop();
    soundService.speakWord(word);
  };

  const handleSaveWord = (word: string) => {
    saveWord(word);
    setSavedSuccess(word);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      await voiceRecorderService.stopRecording();
      setIsRecording(false);
      setHasUserRecording(voiceRecorderService.hasRecording());
      soundService.playCorrect();
    } else {
      soundService.playPop();
      const started = await voiceRecorderService.startRecording();
      if (started) {
        setIsRecording(true);
      }
    }
  };

  const handlePlayUserVoice = () => {
    voiceRecorderService.playLastRecording();
  };

  const currentFormGlyph = !isConnectingLetter
    ? selectedLetter.glyph
    : activeFormTab === 'initial'
    ? selectedLetter.forms.initial
    : activeFormTab === 'medial'
    ? selectedLetter.forms.medial
    : activeFormTab === 'final'
    ? selectedLetter.forms.final
    : selectedLetter.forms.isolated;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Banner: Huge Glyph, Name & Audio */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          {selectedLetter.isHeavySound && (
            <View style={styles.heavyBadge}>
              <Text style={styles.heavyText}>دەنگی قورس</Text>
            </View>
          )}
          <View style={styles.nameBadge}>
            <Text style={styles.nameBadgeText}>پیتی: {selectedLetter.name}</Text>
          </View>
        </View>

        {/* Giant Glyph */}
        <TouchableOpacity
          onPress={handlePlayLetterSound}
          activeOpacity={0.8}
          style={styles.giantGlyphContainer}
        >
          <Text style={styles.giantGlyph}>{selectedLetter.glyph}</Text>
        </TouchableOpacity>

        {/* Listen Button */}
        <TouchableOpacity
          onPress={handlePlayLetterSound}
          activeOpacity={0.85}
          style={styles.listenBtn}
        >
          <Volume2 size={20} color="#ffffff" />
          <Text style={styles.listenBtnText}>گوێگرتن لە دەنگ</Text>
        </TouchableOpacity>

        {/* Voice Recorder Comparison */}
        <View style={styles.recordSection}>
          <Text style={styles.recordTitle}>دەنگی خۆت تۆمار بکە و بەراوردی بکە:</Text>
          <View style={styles.recordBtnRow}>
            <TouchableOpacity
              onPress={handleToggleRecord}
              activeOpacity={0.8}
              style={[
                styles.recBtn,
                isRecording ? styles.recBtnActive : styles.recBtnIdle,
              ]}
            >
              {isRecording ? (
                <Square size={16} color="#ef4444" />
              ) : (
                <Mic size={16} color="#475569" />
              )}
              <Text style={styles.recBtnText}>
                {isRecording ? 'وەستاندنی تۆمار' : 'تۆمارکردنی دەنگم'}
              </Text>
            </TouchableOpacity>

            {hasUserRecording && (
              <TouchableOpacity
                onPress={handlePlayUserVoice}
                activeOpacity={0.8}
                style={styles.playRecBtn}
              >
                <Play size={16} color="#059669" />
                <Text style={styles.playRecBtnText}>بیستنی دەنگم</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 4 Forms of the letter */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>شێوازەکانی پیت لە وشەدا ✍️</Text>
        <Text style={styles.sectionSubtitle}>
          پیتەکە لە سەرەتا، ناوەڕاست یان کۆتایی وشەدا دەگۆڕێت
        </Text>

        <View style={styles.formTabsRow}>
          <TouchableOpacity
            onPress={() => setActiveFormTab('initial')}
            style={[styles.formTab, activeFormTab === 'initial' && styles.formTabActive]}
          >
            <Text style={[styles.formTabText, activeFormTab === 'initial' && styles.formTabTextActive]}>
              دەستپێک
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFormTab('medial')}
            style={[styles.formTab, activeFormTab === 'medial' && styles.formTabActive]}
          >
            <Text style={[styles.formTabText, activeFormTab === 'medial' && styles.formTabTextActive]}>
              ناوەڕاست
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFormTab('final')}
            style={[styles.formTab, activeFormTab === 'final' && styles.formTabActive]}
          >
            <Text style={[styles.formTabText, activeFormTab === 'final' && styles.formTabTextActive]}>
              کۆتایی
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFormTab('isolated')}
            style={[styles.formTab, activeFormTab === 'isolated' && styles.formTabActive]}
          >
            <Text style={[styles.formTabText, activeFormTab === 'isolated' && styles.formTabTextActive]}>
              تەنیا
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGlyphDisplay}>
          <Text style={styles.formGlyphText}>{currentFormGlyph}</Text>
        </View>
      </View>

      {/* 3 Example Words */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>نموونەی وشەکان 🖼️</Text>
        <Text style={styles.sectionSubtitle}>
          گوێ لە بێژەکردنی دروستی ئەم وشانە بگرە
        </Text>

        <View style={styles.wordsList}>
          {selectedLetter.exampleWords.map((wordItem) => {
            const isSaved = savedSuccess === wordItem.word;

            return (
              <View key={wordItem.id} style={styles.wordCard}>
                <View style={styles.wordActions}>
                  <TouchableOpacity
                    onPress={() => handlePlayWordSound(wordItem.word)}
                    style={styles.wordPlayBtn}
                  >
                    <Volume2 size={18} color="#0284c7" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSaveWord(wordItem.word)}
                    style={[styles.saveWordBtn, isSaved && styles.saveWordBtnDone]}
                  >
                    {isSaved ? (
                      <CheckCircle size={14} color="#059669" />
                    ) : (
                      <BookmarkPlus size={14} color="#64748b" />
                    )}
                    <Text style={styles.saveWordBtnText}>
                      {isSaved ? 'پاشەکەوتکرا' : 'خەزنکردن'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{wordItem.word}</Text>
                  <Text style={styles.meaningText}>{wordItem.meaningKu}</Text>
                </View>

                <View style={styles.wordEmojiBox}>
                  <Text style={styles.wordEmoji}>{wordItem.imageEmoji}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <BigButton
          onPress={() => {
            soundService.playPop();
            setRoute('writing');
          }}
          variant="success"
          size="md"
          icon={<Edit3 size={18} color="#ffffff" />}
          style={styles.actionBtn}
        >
          ڕاهێنانی نووسین
        </BigButton>

        <BigButton
          onPress={() => {
            soundService.playPop();
            setRoute('match-game');
          }}
          variant="secondary"
          size="md"
          icon={<Gamepad2 size={18} color="#ffffff" />}
          style={styles.actionBtn}
        >
          یاری دەنگ
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 16,
  },
  emptyBtn: {
    width: 220,
  },
  bannerCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#fde68a',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  heavyBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  heavyText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9a3412',
  },
  nameBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  nameBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400e',
  },
  giantGlyphContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f59e0b',
    marginVertical: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  giantGlyph: {
    fontSize: 72,
    fontWeight: '900',
    color: '#1e293b',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 14,
  },
  listenBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  recordSection: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 8,
  },
  recordBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  recBtnIdle: {
    backgroundColor: '#f1f5f9',
  },
  recBtnActive: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  recBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  playRecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  playRecBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 12,
  },
  formTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 3,
    gap: 4,
    marginBottom: 12,
  },
  formTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
  },
  formTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  formTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  formTabTextActive: {
    color: '#b45309',
  },
  formGlyphDisplay: {
    height: 90,
    backgroundColor: '#fffdf5',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGlyphText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#1e293b',
  },
  wordsList: {
    gap: 10,
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  saveWordBtnDone: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  saveWordBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  wordInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  meaningText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  wordEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordEmoji: {
    fontSize: 26,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
