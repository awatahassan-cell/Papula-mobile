import { useThemeStyles } from '../theme/useAppearance';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { LetterItem } from '../services/types';
import { StarRating } from './StarRating';
import { soundService } from '../services/soundService';

interface LetterCardProps {
  letter: LetterItem;
  status: 'locked' | 'unlocked' | 'in_progress' | 'mastered';
  bestStars?: number;
  onClick: (letter: LetterItem) => void;
  index?: number;
}

export const LetterCard: React.FC<LetterCardProps> = ({
  letter,
  status,
  bestStars = 0,
  onClick,
  index = 0,
}) => {
  const styles = useThemeStyles(baseStyles);
  const isMastered = status === 'mastered';
  const isInProgress = status === 'in_progress';

  const handlePress = () => {
    soundService.playLetterChime(index);
    soundService.playPop();
    onClick(letter);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.card,
        isMastered ? styles.cardMastered : isInProgress ? styles.cardInProgress : styles.cardUnlocked,
      ]}
    >
      {/* Heavy sound indicator badge */}
      {letter.isHeavySound && (
        <View style={styles.heavyBadge}>
          <Text style={styles.heavyText}>قورس</Text>
        </View>
      )}

      {/* Giant Kurdish Glyph */}
      <Text style={styles.glyphText}>{letter.glyph}</Text>

      {/* Letter name */}
      <Text style={styles.nameText}>{letter.name}</Text>

      {/* Stars earned for this letter */}
      <View style={styles.starsContainer}>
        <StarRating stars={bestStars} maxStars={3} size="sm" />
      </View>

      {/* Status indicator pill */}
      {isMastered && (
        <View style={styles.masteredPill}>
          <Text style={styles.masteredPillText}>فێربووم ✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 125,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnlocked: {
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
  },
  cardInProgress: {
    borderColor: '#93c5fd',
    backgroundColor: '#f0f9ff',
  },
  cardMastered: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  heavyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fed7aa',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  heavyText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9a3412',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  glyphText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 4,
    marginBottom: 2,
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  nameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  starsContainer: {
    marginTop: 2,
  },
  masteredPill: {
    marginTop: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  masteredPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#166534',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
});
