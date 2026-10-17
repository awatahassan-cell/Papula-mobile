import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useAppearance, useThemeStyles } from '../../theme/useAppearance';
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../components/RTLText';
import { Volume2, BookOpen, Trash2 } from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';

export const MyWordsScreen: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { tone } = useAppearance();
  const { currentProfile, updateCurrentProfile, setRoute, strings } = useAppStore();

  const handlePlayWord = (word: string) => {
    soundService.playPop();
    soundService.speakWord(word);
  };

  const handleRemoveWord = (word: string) => {
    soundService.playPop();
    const updated = currentProfile.savedWords.filter((w) => w !== word);
    updateCurrentProfile({ savedWords: updated });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{currentProfile.savedWords.length} وشە</Text>
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.title}>{strings.home.myWordsTitle} 📖</Text>
          <Text style={styles.subtitle}>
            ئەو وشە خۆشانەی کە لە چیرۆک و پیتەکانەوە فێریان بوویت
          </Text>
        </View>
      </View>

      {currentProfile.savedWords.length === 0 ? (
        <View style={styles.emptyCard}>
          <BookOpen size={48} color={tone('#f59e0b')} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>هێشتا هیچ وشەیەکت پاشەکەوت نەکردووە</Text>
          <Text style={styles.emptySub}>
            کاتێک چیرۆکێک دەخوێنیتەوە، پەنجە بنێ بە وشەکاندا تاوەکو لێرە خەزن بکرێن!
          </Text>
          <BigButton
            onPress={() => setRoute('stories')}
            variant="primary"
            size="md"
            style={styles.emptyBtn}
          >
            دەستپێکردنی چیرۆکێک
          </BigButton>
        </View>
      ) : (
        <View style={styles.list}>
          {currentProfile.savedWords.map((word, idx) => (
            <View key={idx} style={styles.wordCard}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`سڕینەوەی وشەی ${word}`}
                onPress={() => handleRemoveWord(word)}
                style={styles.trashBtn}
              >
                <Trash2 size={18} color={tone('#94a3b8')} />
              </TouchableOpacity>

              <View style={styles.wordContent}>
                <Text style={styles.wordText}>{word}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`گوێگرتن لە وشەی ${word}`}
                  onPress={() => handlePlayWord(word)}
                  style={styles.speakerBtn}
                >
                  <Volume2 size={18} color={tone('#92400e')} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <BigButton
        onPress={() => setRoute('home')}
        variant="primary"
        size="lg"
        style={styles.homeBtn}
      >
        گەڕانەوە بۆ سەرەتا 🏠
      </BigButton>
    </ScrollView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fffdfa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400e',
  },
  titleCol: {
    alignItems: 'flex-start',
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
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyBtn: {
    width: 200,
  },
  list: {
    gap: 10,
    marginBottom: 24,
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
  },
  trashBtn: {
    padding: 6,
  },
  trashText: {
    fontSize: 16,
  },
  wordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  speakerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerText: {
    fontSize: 18,
  },
  homeBtn: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
});
