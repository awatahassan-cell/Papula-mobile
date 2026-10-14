import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { soundService } from '../services/soundService';

interface MascotGuideProps {
  messageKu: string;
  mood?: 'happy' | 'thinking' | 'celebrating' | 'sleepy';
  onPress?: () => void;
}

export const MascotGuide: React.FC<MascotGuideProps> = ({
  messageKu,
  mood = 'happy',
  onPress,
}) => {
  const getAvatarEmoji = () => {
    switch (mood) {
      case 'celebrating':
        return '🎉 🦋';
      case 'thinking':
        return '🤔 🦋';
      case 'sleepy':
        return '😴 🦋';
      default:
        return '🦋';
    }
  };

  const handlePress = () => {
    soundService.playPop();
    soundService.speakWord(messageKu);
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={styles.container}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>{getAvatarEmoji()}</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.messageText}>{messageKu}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubble: {
    flex: 1,
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'right',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
});
