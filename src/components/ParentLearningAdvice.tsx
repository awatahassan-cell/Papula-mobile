import React from 'react';
import { View } from 'react-native';
import { ChildProfile } from '../services/types';
import { parentAdvice, personalPractice } from '../services/personalPractice';
import { useAppStore } from '../store/useAppStore';
import { useAppearance } from '../theme/useAppearance';
import { Text } from './RTLText';
import { BigButton } from './BigButton';

export function ParentLearningAdvice({ profile }: { profile: ChildProfile }) {
  const { colors } = useAppearance();
  const { setSelectedLetter, setRoute, saveCheckpoint } = useAppStore();
  const advice = parentAdvice(profile), task = personalPractice(profile)[0];
  return <View style={{ backgroundColor: colors.lavender, padding: 16, borderRadius: 20, gap: 10 }}>
    <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 18 }}>ئەم هەفتەیە چی بکەین؟</Text>
    <Text style={{ color: colors.ink }}>{advice.learned.length ? `وانە تەواوکراوەکانی ئەم هەفتەیە: ${advice.learned.map(letter => letter.glyph).join('، ')}.` : 'هێشتا وانەی تەواوکراوی تۆمارکراو لەم هەفتەیەدا نییە؛ هەر هەوڵێکی بچووک گرنگە.'}</Text>
    <Text style={{ color: colors.ink }}>{advice.focus}</Text>
    <Text style={{ color: colors.ink }}>{advice.homeActivity}</Text>
    <BigButton size="sm" onPress={() => {
      if (!task) { setRoute('alphabet'); return; }
      setSelectedLetter(task.letter); saveCheckpoint({ kind: task.kind, contentId: task.letter.id, step: task.step });
      setRoute(task.kind === 'writing' ? 'writing' : 'letter-detail');
    }}>پێکەوە ئەم مەشقە بکەین</BigButton>
  </View>;
}
