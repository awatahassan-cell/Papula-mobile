import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore, AppRoute } from '../store/useAppStore';
import { useAppearance } from '../theme/useAppearance';
import { GardenSection } from './GardenArtwork';
import { useResponsive } from '../theme/responsive';

const headings: Partial<Record<AppRoute, [string, string]>> = {
  onboarding: ['بەخێربێیت بۆ پەپوولە', 'با یەکتر بناسین'],
  alphabet: ['ڕێڕەوی فێربوون', 'هەنگاو بە هەنگاو، لەگەڵ هەوڵی خۆت'],
  'word-writing': ['وشە و ڕستە', 'پیت بە پیت بنووسە و پشکنینی وردت بۆ دەکرێت'],
  stories: ['کاتی چیرۆکە', 'گوێ بگرە یان پێکەوە بخوێنینەوە'],
  'daily-practice': ['با پێکەوە مەشق بکەین', 'هەنگاوێکی بچووک، فێربوونێکی نوێ'],
  stickers: ['ستیکەرەکانم', 'یادگارییەکانی گەشتی فێربوونت'],
  badges: ['میدالیاکانم', 'هەوڵ و پێشکەوتنەکانت ببینە'],
  'my-words': ['وشەکانم', 'وشە دڵخوازەکانت دووبارە بکەوە'],
  'parent-dashboard': ['دایک و باوک', 'پێشکەوتن و ڕێکخستنەکانی منداڵەکەت'],
};
export function GardenPageHeader() {
  const { route } = useAppStore();
  const { isGarden } = useAppearance();
  const { pageMax, tablet } = useResponsive();
  if (!isGarden || route === 'alphabet' || route === 'home' || route === 'story-reader' || route === 'match-game' || route === 'letter-detail' || route === 'writing' || route === 'word-writing') return null;
  const heading = headings[route];
  if (!heading) return null;
  return <View style={[styles.frame, { maxWidth: pageMax }]}><GardenSection title={heading[0]} subtitle={!tablet?undefined:heading[1]} /></View>;
}
const styles = StyleSheet.create({
  frame: { width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 2, paddingBottom: 4 },
});
