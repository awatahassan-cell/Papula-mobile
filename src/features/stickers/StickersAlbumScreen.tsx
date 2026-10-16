import { useThemeStyles } from '../../theme/useAppearance';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../components/RTLText';
import { Lock, Award, Gift, Home } from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { BadgesComponent } from '../../components/BadgesComponent';
import { mockStickers } from '../../data/mockStickers';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';

export const StickersAlbumScreen: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { currentProfile, setRoute, strings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'stickers' | 'badges'>('stickers');

  const handleStickerClick = (sticker: typeof mockStickers[0], isUnlocked: boolean) => {
    soundService.playPop();
    if (isUnlocked) {
      soundService.speakWord(sticker.nameKu);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>
            {activeTab === 'stickers' ? strings.home.stickersTitle : 'میدالیا و نیشانەکان'} ✨
          </Text>
          <Text style={styles.subtitle}>
            {activeTab === 'stickers'
              ? 'ئەستێرە کۆبکەرەوە بۆ کردنەوەی ستیکەری جوان و کوردی'
              : 'پیت و چیرۆکەکان تەواو بکە بۆ بەدەستهێنانی میدالیای دەستکەوتەکان'}
          </Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setActiveTab('stickers');
            }}
            style={[styles.tabBtn, activeTab === 'stickers' && styles.tabBtnActive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Gift size={16} color={activeTab === 'stickers' ? '#0f172a' : '#64748b'} />
              <Text style={[styles.tabBtnText, activeTab === 'stickers' && styles.tabBtnTextActive]}>
                ستیکەرەکان
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundService.playPop();
              setActiveTab('badges');
            }}
            style={[styles.tabBtn, activeTab === 'badges' && styles.tabBtnActive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Award size={16} color={activeTab === 'badges' ? '#0f172a' : '#64748b'} />
              <Text style={[styles.tabBtnText, activeTab === 'badges' && styles.tabBtnTextActive]}>
                نیشانەکان
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Content */}
      {activeTab === 'badges' ? (
        <BadgesComponent />
      ) : (
        <View style={styles.stickersGrid}>
          {mockStickers.map((sticker) => {
            const isUnlocked =
              currentProfile.unlockedStickerIds.includes(sticker.id) ||
              currentProfile.stars >= sticker.unlockedAtStars;

            return (
              <TouchableOpacity
                key={sticker.id}
                onPress={() => handleStickerClick(sticker, isUnlocked)}
                activeOpacity={0.8}
                style={[
                  styles.stickerCard,
                  isUnlocked ? styles.stickerCardUnlocked : styles.stickerCardLocked,
                ]}
              >
                {isUnlocked ? (
                  <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
                ) : (
                  <View style={{ height: 48, justifyContent: 'center', alignItems: 'center' }}>
                    <Lock size={28} color="#94a3b8" />
                  </View>
                )}
                <Text style={styles.stickerName}>{sticker.nameKu}</Text>
                <Text
                  style={[
                    styles.stickerStatus,
                    isUnlocked ? styles.statusUnlocked : styles.statusLocked,
                  ]}
                >
                  {isUnlocked ? 'کراوەتەوە ✨' : `${sticker.unlockedAtStars} ⭐`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <BigButton
        onPress={() => setRoute('home')}
        variant="primary"
        size="lg"
        style={styles.homeBtn}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Home size={18} color="#1e293b" />
          <Text style={{ fontWeight: '900', color: '#1e293b' }}>گەڕانەوە بۆ سەرەتا</Text>
        </View>
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
    marginBottom: 20,
    gap: 12,
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
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '900',
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stickerCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  stickerCardUnlocked: {
    backgroundColor: '#ffffff',
    borderColor: '#fde68a',
  },
  stickerCardLocked: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  stickerEmoji: {
    fontSize: 44,
    marginBottom: 6,
  },
  stickerName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  stickerStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusUnlocked: {
    color: '#059669',
  },
  statusLocked: {
    color: '#94a3b8',
  },
  homeBtn: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
});
