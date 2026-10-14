import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, Flame, Sparkles, CheckCircle2, ArrowRight, Award } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { soundService } from '../services/soundService';
import { DailyMission } from '../services/types';

export const DailyMissionsComponent: React.FC = () => {
  const { currentProfile, dailyMissions, claimMissionReward, setRoute } = useAppStore();

  const handleAction = (mission: DailyMission) => {
    soundService.playPop();
    if (mission.completed && !mission.claimed) {
      claimMissionReward(mission.id);
    } else {
      setRoute(mission.actionRoute);
    }
  };

  const completedCount = dailyMissions.filter((m) => m.completed).length;

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={styles.streakBadge}>
            <Flame size={18} color="#ea580c" />
            <Text style={styles.streakText}>{currentProfile.streakDays} ڕۆژ</Text>
          </View>

          <View style={styles.tagBadge}>
            <Trophy size={14} color="#78350f" />
            <Text style={styles.tagText}>ئەرکەکانی ئەمڕۆ ({completedCount}/{dailyMissions.length})</Text>
          </View>
        </View>

        <Text style={styles.bannerTitle}>ڕاهێنانی هۆشمەندانەی ئەمڕۆ 🌟</Text>
        <Text style={styles.bannerSubtitle}>
          ئەرکە ئاسانەکان ئەنجام بدە بۆ کۆکردنەوەی ئەستێرەی زیاتر!
        </Text>
      </View>

      <View style={styles.list}>
        {dailyMissions.map((mission) => {
          const progressPercent = Math.min(
            100,
            Math.round((mission.currentCount / mission.targetCount) * 100)
          );

          return (
            <View key={mission.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{mission.icon}</Text>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.missionTitle}>{mission.titleKu}</Text>
                  <Text style={styles.missionDesc}>{mission.descriptionKu}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {mission.currentCount} / {mission.targetCount}
                </Text>
              </View>

              {/* Action button */}
              <TouchableOpacity
                onPress={() => handleAction(mission)}
                activeOpacity={0.8}
                style={[
                  styles.actionButton,
                  mission.claimed
                    ? styles.claimedBtn
                    : mission.completed
                    ? styles.claimableBtn
                    : styles.goBtn,
                ]}
              >
                {mission.claimed ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={16} color="#15803d" />
                    <Text style={styles.claimedBtnText}>وەرگیراوە</Text>
                  </View>
                ) : mission.completed ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={16} color="#ffffff" />
                    <Text style={styles.claimableBtnText}>وەرگرتن (+{mission.starReward} ⭐)</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.goBtnText}>دەستپێکردن</Text>
                    <ArrowRight size={14} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    alignItems: 'flex-end',
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#c2410c',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#78350f',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#78350f',
    textAlign: 'right',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 3,
    textAlign: 'right',
  },
  headerRow: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  infoCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
  },
  missionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  actionButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  goBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  goBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  claimableBtn: {
    backgroundColor: '#f59e0b',
  },
  claimableBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  claimedBtn: {
    backgroundColor: '#ecfdf5',
  },
  claimedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
});
