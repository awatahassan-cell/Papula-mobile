import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { soundService } from '../../services/soundService';
import { AppRoute, useAppStore } from '../../store/useAppStore';

const extras: { route: AppRoute; label: string; emoji: string }[] = [
  { route: 'alphabet', label: 'هەموو پیتەکان', emoji: '🔤' },
  { route: 'writing', label: 'بنووسم', emoji: '✍️' },
  { route: 'daily-practice', label: 'مەشقی ئەمڕۆ', emoji: '🌱' },
  { route: 'stickers', label: 'ستیکەرەکانم', emoji: '🎁' },
  { route: 'badges', label: 'میدالیاکانم', emoji: '🏅' },
  { route: 'my-words', label: 'وشەکانم', emoji: '📒' },
];

export const HomeScreen: React.FC = () => {
  const { currentProfile, setRoute } = useAppStore();
  const [showMore, setShowMore] = useState(false);
  const open = (route: AppRoute) => {
    void soundService.stopSpeaking();
    soundService.playPop();
    setRoute(route);
  };
  const startLesson = () => {
    open('alphabet');
  };
  const activities = [
    { label: 'پیت فێر بم', hint: 'پیتێک هەڵبژێرە و فێری ببە', emoji: '🔤', color: '#fff0bd', action: startLesson },
    { label: 'یاری بکەم', hint: 'وشەسازی و یاریی پیتەکان', emoji: '🎮', color: '#eee5ff', action: () => open('match-game') },
    { label: 'چیرۆک ببیستم', hint: 'چیرۆکێک هەڵبژێرە', emoji: '📚', color: '#dff3ff', action: () => open('stories') },
  ];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>سڵاو {currentProfile.name} {currentProfile.avatar}</Text>
      <View style={styles.guide}>
        <Text style={styles.butterfly} accessibilityLabel="پەپوولە">🦋</Text>
        <View style={styles.guideText}>
          <Text style={styles.guideTitle}>با پێکەوە فێر بین!</Text>
          <Text style={styles.hint}>ئەمڕۆ چیت پێ خۆشە؟</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="ڕێنماییەکە ببیستە"
          style={styles.voice} onPress={() => void soundService.speakWord('سڵاو هاوڕێی شیرینم! دەست لە پیت فێر بم بدە، پاشان پیتێک هەڵبژێرە.')}>
          <Volume2 size={25} color="#78350f" />
        </TouchableOpacity>
      </View>
      {activities.map((activity) => (
        <TouchableOpacity key={activity.label} accessibilityRole="button" accessibilityLabel={activity.label}
          activeOpacity={0.85} onPress={activity.action} style={[styles.card, { backgroundColor: activity.color }]}>
          <Text style={styles.activityEmoji}>{activity.emoji}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{activity.label}</Text>
            <Text style={styles.hint}>{activity.hint}</Text>
          </View>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.welcome}>هەر کاتێک بگەڕێیتەوە، خۆشحاڵم دەکەیت 💛</Text>
      <TouchableOpacity accessibilityRole="button" onPress={()=>open('daily-practice')} style={styles.extra}>
        <Text style={styles.extraEmoji}>🌱</Text><Text style={styles.extraLabel}>مەشقی تایبەت بە من</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showMore }}
        onPress={() => setShowMore((value) => !value)} style={styles.more}>
        <Text style={styles.moreText}>{showMore ? 'کەمتر' : 'زیاتر'}</Text>
        {showMore ? <ChevronUp color="#475569" size={22} /> : <ChevronDown color="#475569" size={22} />}
      </TouchableOpacity>
      {showMore && <View style={styles.extras}>
        {extras.map((item) => <TouchableOpacity key={item.route} accessibilityRole="button"
          onPress={() => open(item.route)} style={styles.extra}>
          <Text style={styles.extraEmoji}>{item.emoji}</Text><Text style={styles.extraLabel}>{item.label}</Text>
        </TouchableOpacity>)}
      </View>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, width: '100%', maxWidth: 620, alignSelf: 'center', paddingBottom: 36 },
  greeting: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 25, color: '#1e293b', textAlign: 'right' },
  guide: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12 },
  butterfly: { fontSize: 48 },
  guideText: { flex: 1 },
  guideTitle: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 20, color: '#78350f', textAlign: 'right' },
  voice: { width: 64, height: 64, backgroundColor: '#fff0bd', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  card: { minHeight: 118, borderRadius: 28, padding: 20, flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  activityEmoji: { fontSize: 46, fontFamily: 'IBMPlexSansArabic_700Bold', color: '#78350f', minWidth: 54, textAlign: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 25, color: '#1e293b', textAlign: 'right' },
  hint: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 15, color: '#475569', textAlign: 'right' },
  arrow: { fontSize: 40, color: '#475569' },
  welcome: { fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 4 },
  more: { minHeight: 64, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10 },
  moreText: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 18, color: '#475569' },
  extras: { gap: 10 },
  extra: { minHeight: 64, padding: 16, borderRadius: 20, backgroundColor: '#f1f5f9', flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  extraEmoji: { fontSize: 26 },
  extraLabel: { fontFamily: 'IBMPlexSansArabic_600SemiBold', fontSize: 18, color: '#334155' },
});
