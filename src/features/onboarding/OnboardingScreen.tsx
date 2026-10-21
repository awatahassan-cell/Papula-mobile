import { BackButton } from '../../components/BackButton';
import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import { useThemeStyles } from '../../theme/useAppearance';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Clock, Heart, PencilLine, ShieldCheck, Volume2 } from 'lucide-react-native';
import { PapulaMascot } from '../../components/PapulaMascot';
import { Text, TextInput } from '../../components/RTLText';
import { BigButton } from '../../components/BigButton';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';

const avatars = [
  { emoji: '🦋', label: 'پەپوولە' },
  { emoji: '🦊', label: 'ڕێوی' },
  { emoji: '🐻', label: 'ورچ' },
  { emoji: '🦁', label: 'شێر' },
  { emoji: '🐰', label: 'کەرۆشک' },
  { emoji: '🐬', label: 'دۆلفین' },
];

/** Step 1 for the parent: what the app does and how to use it well. */
const PARENT_GUIDE = [
  { Icon: Clock, text: 'ڕۆژانە ١٠ بۆ ١٥ خولەک بەسە. هەنگاو بە هەنگاو، پیتێک لە دوای پیتێک؛ پێویست ناکات پەلە بکرێت.' },
  { Icon: PencilLine, text: 'لە نووسیندا منداڵەکە بە پەنجە دەنووسێت و ئەپەکە شێوەی پیت، هێڵ و خاڵەکان، قەبارە و ڕێکی دەست هەڵدەسەنگێنێت.' },
  { Icon: Volume2, text: 'دەنگەکان بێ ئینتەرنێت کار دەکەن. با منداڵەکە گوێ بگرێت و دووبارەی بکاتەوە.' },
  { Icon: ShieldCheck, text: 'بەشی «دایک و باوک» (ئایکۆنی ڕێکخستن، بە پرسیارێکی کورت دەکرێتەوە) بۆ کاتی ڕۆژانە، قفڵی کاتی خەوتن، ڕەنگ و ڕۆژ/شەو و بینینی پێشکەوتنە.' },
  { Icon: Heart, text: 'لەگەڵی دانیشن و ئافەرینی لێ بکەن. هەڵە بەشێکە لە فێربوون.' },
] as const;

const ageGroups: ('3-4' | '5-6' | '7-8')[] = ['3-4', '5-6', '7-8'];

export const OnboardingScreen: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { createProfile, setRoute, strings } = useAppStore();
  const [step, setStep] = useState<'parent' | 'child'>('parent');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦋');
  const [selectedAge, setSelectedAge] = useState<'3-4' | '5-6' | '7-8'>('5-6');

  const handleStart = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    createProfile({
      name: trimmedName,
      avatar: selectedAvatar,
      ageGroup: selectedAge,
    });
    setRoute('home');
  };

  if (step === 'parent') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <PapulaMascot size={130} mood="happy" />
          <Text style={styles.welcomeTitle}>ڕێنمایی بۆ دایک و باوک</Text>
          <Text style={styles.welcomeSubtitle}>پەپوولە یارمەتیدەرێکی بچووکە بۆ فێربوونی پیتەکانی کوردی، بە گوێگرتن، یاری و نووسین.</Text>
          <View style={styles.guideList}>
            {PARENT_GUIDE.map(({ Icon, text }) => (
              <View key={text} style={styles.guideRow}>
                <View style={styles.guideIcon}><Icon size={22} color="#6d4ae8" strokeWidth={2.2} /></View>
                <Text style={styles.guideText}>{text}</Text>
              </View>
            ))}
          </View>
          <BigButton onPress={() => setStep('child')} variant="primary" size="lg" style={styles.submitBtn}>بەردەوام بن</BigButton>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <PapulaMascot size={150} mood="happy" />
        <Text style={styles.welcomeTitle}>{strings.onboarding.welcomeTitle}</Text>
        <Text style={styles.welcomeSubtitle}>{strings.onboarding.welcomeSubtitle}</Text>

        {/* 1. Child Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{strings.onboarding.childNamePrompt}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={strings.onboarding.namePlaceholder}
            placeholderTextColor="#94a3b8"
            style={styles.nameInput}
            textAlign="right"
          />
        </View>

        {/* 2. Choose Avatar */}
        <View style={styles.section}>
          <Text style={styles.label}>{strings.onboarding.chooseAvatarPrompt}</Text>
          <View style={styles.avatarGrid}>
            {avatars.map((av) => {
              const isSelected = selectedAvatar === av.emoji;
              return (
                <TouchableOpacity
                  key={av.emoji}
                  onPress={() => {
                    soundService.playPop();
                    setSelectedAvatar(av.emoji);
                  }}
                  activeOpacity={0.8}
                  style={[
                    styles.avatarCard,
                    isSelected ? styles.avatarSelected : styles.avatarUnselected,
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                  <Text style={styles.avatarLabel}>{av.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Choose Age Group */}
        <View style={styles.section}>
          <Text style={styles.label}>{strings.onboarding.agePrompt}</Text>
          <View style={styles.ageRow}>
            {ageGroups.map((age) => {
              const isSelected = selectedAge === age;
              return (
                <TouchableOpacity
                  key={age}
                  onPress={() => {
                    soundService.playPop();
                    setSelectedAge(age);
                  }}
                  activeOpacity={0.8}
                  style={[
                    styles.ageBtn,
                    isSelected ? styles.ageBtnSelected : styles.ageBtnUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.ageBtnText,
                      isSelected ? styles.ageTextSelected : styles.ageTextUnselected,
                    ]}
                  >
                    {age} ساڵ
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <BigButton
          onPress={handleStart}
          disabled={!name.trim()}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        >
          {strings.onboarding.letsGo}
        </BigButton>
        <BackButton onPress={() => setStep('parent')} fullWidth style={styles.backBtn}>گەڕانەوە بۆ ڕێنمایی</BackButton>
      </View>
    </ScrollView>
  );
};

const baseStyles = StyleSheet.create({
  guideList: { width: '100%', gap: 10, marginBottom: 18 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#f8f4ff', borderRadius: 20, padding: 12 },
  guideIcon: { width: 40, height: 40, borderRadius: 16, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  guideText: { flex: 1, fontSize: 14, lineHeight: 24, color: '#3b2f63' },
  backBtn: { marginTop: 10, alignSelf: 'center' },
  container: {
    flexGrow: 1,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  logoEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  avatarCard: {
    width: '31%',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarSelected: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  avatarUnselected: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  avatarEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  avatarLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  ageRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  ageBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  ageBtnSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  ageBtnUnselected: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  ageBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  ageTextSelected: {
    color: '#ffffff',
  },
  ageTextUnselected: {
    color: '#64748b',
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
  },
});
