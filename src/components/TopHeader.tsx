import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ArrowRight, Settings, Volume2, VolumeX, Sparkles } from 'lucide-react-native';
import { soundService } from '../services/soundService';
import { useAppStore } from '../store/useAppStore';

export const TopHeader: React.FC = () => {
  const {
    route,
    setRoute,
    currentProfile,
    isStreakActiveToday,
    openParentGateWithCallback,
    parentSettings,
    updateParentSettings,
  } = useAppStore();

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return soundService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  const handleBack = () => {
    soundService.playPop();
    setRoute('home');
  };

  const handleOpenParentArea = () => {
    soundService.playPop();
    openParentGateWithCallback(() => {
      setRoute('parent-dashboard');
    });
  };

  const toggleSound = () => {
    const newState = !parentSettings.soundFxEnabled;
    updateParentSettings({ soundFxEnabled: newState });
    soundService.setSoundFxEnabled(newState);
    if (newState) soundService.playPop();
  };

  const showBackButton = route !== 'home' && route !== 'onboarding';

  return (
    <View style={styles.header}>
      {/* Right side (RTL Start): Back button or Avatar */}
      <View style={styles.profileGroup}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.8}>
            <ArrowRight size={18} color="#78350f" />
            <Text style={styles.backButtonText}>سەرەتا</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setRoute('stickers')}
            style={styles.avatarButton}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarEmoji}>{currentProfile.avatar}</Text>
            <View style={styles.avatarTextContainer}>
              <Text style={styles.profileName}>{currentProfile.name}</Text>
              <Text style={styles.profileSub}>ستیکەرەکان 🎁</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Center: Streak & Stars */}
      <View style={styles.countersGroup}>
        <View style={styles.starBadge}>
          <Text style={styles.counterEmoji}>⭐</Text>
          <Text style={styles.starCount}>{currentProfile.stars}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setRoute('home')}
          style={[styles.streakBadge, isStreakActiveToday ? styles.streakActive : styles.streakInactive]}
          activeOpacity={0.8}
        >
          <Text style={styles.counterEmoji}>🔥</Text>
          <Text style={[styles.streakCount, isStreakActiveToday ? styles.streakTextActive : styles.streakTextInactive]}>
            {currentProfile.streakDays} ڕۆژ
          </Text>
          {isStreakActiveToday && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>
      </View>

      {/* Left side (RTL End): Parent Settings & Sound Toggle */}
      <View style={styles.actionGroup}>
        {isSpeaking && (
          <TouchableOpacity
            onPress={() => soundService.stopSpeaking()}
            style={styles.speakingBadge}
            activeOpacity={0.8}
          >
            <Volume2 size={14} color="#78350f" />
            <Text style={styles.speakingText}>دەخوێنێتەوە...</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={toggleSound}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          {parentSettings.soundFxEnabled ? (
            <Volume2 size={20} color="#475569" />
          ) : (
            <VolumeX size={20} color="#94a3b8" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenParentArea}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Settings size={18} color="#475569" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speakingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#78350f',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  countersGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  counterEmoji: {
    fontSize: 14,
  },
  starCount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400e',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  streakActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  streakInactive: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  streakCount: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  streakTextActive: {
    color: '#065f46',
  },
  streakTextInactive: {
    color: '#c2410c',
  },
  checkIcon: {
    fontSize: 11,
    color: '#059669',
    fontWeight: 'bold',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#78350f',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  avatarTextContainer: {
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e293b',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  profileSub: {
    fontSize: 9,
    color: '#b45309',
    fontWeight: '600',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
});
