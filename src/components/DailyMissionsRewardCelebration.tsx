import { TactileButton as TouchableOpacity } from './TactileButton';
import { rtlProps, rtlLayout } from '../theme/rtl';
import { useThemeStyles } from '../theme/useAppearance';
import { REWARDS, kurdishDigits } from '../services/rewards';
import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { PapulaMascot } from './PapulaMascot';
import { useAppStore } from '../store/useAppStore';
import { soundService } from '../services/soundService';

interface CelebrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyMissionsRewardCelebration: React.FC<CelebrationProps> = ({
  isOpen,
  onClose,
}) => {
  const styles = useThemeStyles(baseStyles);
  const { claimAllMissionsBonusReward, hasClaimedAllMissionsBonusToday } = useAppStore();

  const handleClaim = () => {
    soundService.playGrandCelebration();
    claimAllMissionsBonusReward(REWARDS.allMissionsBonus);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal transparent animationType="slide" visible={isOpen} onRequestClose={onClose}>
      <View {...rtlProps} style={[styles.backdrop, rtlLayout]}>
        <View style={styles.card}>
          <PapulaMascot size={150} mood="surprised" />
          <Text style={styles.title}>پیرۆزە! هەموو ئەرکەکانت تەواو کرد!</Text>
          <Text style={styles.desc}>
            تۆ ئەمڕۆ پاڵەوانێکی زۆر زیرەک بوویت. {kurdishDigits(REWARDS.allMissionsBonus)} ئەستێرەی زێڕین وەربگرە وەک خەڵات!
          </Text>

          <View style={styles.starBox}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.starNum}>+{REWARDS.allMissionsBonus}</Text>
          </View>

          <TouchableOpacity
            onPress={handleClaim}
            style={styles.claimButton}
            activeOpacity={0.85}
          >
            <Text style={styles.claimButtonText}>
              {hasClaimedAllMissionsBonusToday ? 'داخستن' : 'وەرگرتنی خەڵات 🎁'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const baseStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  trophy: {
    fontSize: 54,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  starBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 20,
  },
  starIcon: {
    fontSize: 32,
  },
  starNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#b45309',
  },
  claimButton: {
    width: '100%',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
});
