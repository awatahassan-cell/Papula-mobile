import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LetterCard } from '../../components/LetterCard';
import { lettersRepo } from '../../services/repositories';
import { soundService } from '../../services/soundService';
import { LetterItem } from '../../services/types';
import { useAppStore } from '../../store/useAppStore';

export const AlphabetGridScreen: React.FC = () => {
  const { currentProfile, setSelectedLetter, setRoute, getLetterBestStars, strings } = useAppStore();
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'mastered' | 'practice'>('all');

  useEffect(() => {
    async function loadLetters() {
      const data = await lettersRepo.getAllLetters();
      setLetters(data);
    }
    loadLetters();
  }, []);

  const handleLetterSelect = (letter: LetterItem) => {
    setSelectedLetter(letter);
    setRoute('letter-detail');
  };

  const filteredLetters = letters.filter((l) => {
    const isMastered = currentProfile.masteredLetterIds.includes(l.id);
    if (filter === 'mastered') return isMastered;
    if (filter === 'practice') return !isMastered;
    return true;
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Title & Stats */}
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{strings.alphabet.screenTitle}</Text>
          <Text style={styles.subtitle}>
            پیتێک هەڵبژێرە بۆ بیستنی دەنگەکەی و فێربوونی شێوازی نووسینی
          </Text>
        </View>

        {/* Filter controls */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setFilter('all');
            }}
            activeOpacity={0.8}
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === 'all' && styles.filterBtnTextActive,
              ]}
            >
              هەموو ({letters.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setFilter('mastered');
            }}
            activeOpacity={0.8}
            style={[styles.filterBtn, filter === 'mastered' && styles.filterBtnActive]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === 'mastered' && styles.filterBtnTextActive,
              ]}
            >
              فێربووم ({currentProfile.masteredLetterIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setFilter('practice');
            }}
            activeOpacity={0.8}
            style={[styles.filterBtn, filter === 'practice' && styles.filterBtnActive]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === 'practice' && styles.filterBtnTextActive,
              ]}
            >
              مەشق ({letters.length - currentProfile.masteredLetterIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Keep the full collection in the author's original teaching order. */}
      <View style={styles.grid}>
        {filteredLetters.map((letter, idx) => {
          const isMastered = currentProfile.masteredLetterIds.includes(letter.id);
          const isInProgress = currentProfile.inProgressLetterIds.includes(letter.id);
          const bestStars = getLetterBestStars(letter.id);
          const status = isMastered
            ? 'mastered'
            : isInProgress
            ? 'in_progress'
            : 'unlocked';

          return (
            <View key={letter.id} style={styles.gridItem}>
              <LetterCard
                letter={letter}
                status={status}
                bestStars={bestStars}
                index={idx}
                onClick={handleLetterSelect}
              />
            </View>
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
    gap: 12,
  },
  titleCol: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'right',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  filterBtnTextActive: {
    color: '#0f172a',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '31%',
    marginBottom: 2,
  },
});
