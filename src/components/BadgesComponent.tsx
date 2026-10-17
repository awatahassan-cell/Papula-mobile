import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { Trophy, Lock, CheckCircle2, Award } from 'lucide-react-native';
import { mockBadges } from '../data/mockBadges';
import { useAppStore } from '../store/useAppStore';

export const BadgesComponent: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { tone } = useAppearance();
  const { currentProfile } = useAppStore();

  const isBadgeUnlocked = (badgeId: string) => {
    const badge = mockBadges.find((b) => b.id === badgeId);
    if (!badge) return false;

    switch (badge.targetType) {
      case 'mastered_letters':
        return currentProfile.masteredLetterIds.length >= badge.targetCount;
      case 'read_stories':
        return currentProfile.readStoryIds.length >= badge.targetCount;
      case 'total_stars':
        return currentProfile.stars >= badge.targetCount;
      case 'streak_days':
        return currentProfile.streakDays >= badge.targetCount;
      case 'saved_words':
        return currentProfile.savedWords.length >= badge.targetCount;
      default:
        return false;
    }
  };

  const unlockedCount = mockBadges.filter((b) => isBadgeUnlocked(b.id)).length;

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerBadge}>
          <Award size={14} color={tone('#f59e0b')} />
          <Text style={styles.bannerBadgeText}>دەستکەوت و نیشانەکان</Text>
        </View>
        <Text style={[styles.title, { color: '#ffffff' }]}>کۆکراوەی میدالیا زێڕینەکانت ✨</Text>
        <Text style={[styles.subtitle, { color: '#ffffff' }]}>
          مەشق بکە، چیرۆک بخوێنەوە و پیتەکان فێربە بۆ کردنەوەی نیشانەکان!
        </Text>
        <View style={styles.progressCounter}>
          <Trophy size={16} color={tone('#d97706')} />
          <Text style={styles.progressText}>
            {unlockedCount} لە {mockBadges.length} بەدەستهاتووە
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {mockBadges.map((badge) => {
          const unlocked = isBadgeUnlocked(badge.id);

          return (
            <View
              key={badge.id}
              style={[
                styles.badgeCard,
                unlocked ? styles.badgeUnlocked : styles.badgeLocked,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  unlocked ? styles.iconWrapUnlocked : styles.iconWrapLocked,
                ]}
              >
                {unlocked ? (
                  <Text style={styles.icon}>{badge.icon}</Text>
                ) : (
                  <Lock size={22} color={tone('#94a3b8')} />
                )}
              </View>

              <Text style={styles.badgeTitle}>{badge.titleKu}</Text>
              <Text style={styles.badgeDesc}>{badge.descriptionKu}</Text>

              <View
                style={[
                  styles.statusPill,
                  unlocked ? styles.statusPillUnlocked : styles.statusPillLocked,
                ]}
              >
                {unlocked ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} color={tone('#166534')} />
                    <Text style={styles.statusPillTextUnlocked}>بەدەستهاتووە</Text>
                  </View>
                ) : (
                  <Text style={styles.statusPillTextLocked}>داخراوە</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  banner: {
    backgroundColor: '#8746df',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderBottomWidth: 5,
    borderBottomColor: '#6130aa',
    alignItems: 'center',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  bannerBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#b45309',
  },
  progressCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400e',
  },
  header: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeUnlocked: {
    backgroundColor: '#ffffff',
    borderColor: '#fed7aa',
  },
  badgeLocked: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.7,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconWrapUnlocked: {
    backgroundColor: '#fef3c7',
  },
  iconWrapLocked: {
    backgroundColor: '#e2e8f0',
  },
  icon: {
    fontSize: 26,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 14,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillUnlocked: {
    backgroundColor: '#dcfce7',
  },
  statusPillLocked: {
    backgroundColor: '#f1f5f9',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusPillTextUnlocked: {
    color: '#166534',
  },
  statusPillTextLocked: {
    color: '#94a3b8',
  },
});
