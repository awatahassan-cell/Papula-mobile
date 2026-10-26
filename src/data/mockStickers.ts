import { StickerItem } from '../services/types';

/** Every sticker whose star goal is reached, added to the ones already owned (never removes any). */
export const stickerIdsFor = (stars: number, owned: string[]): string[] =>
  Array.from(new Set([...owned, ...mockStickers.filter(sticker => stars >= sticker.unlockedAtStars).map(sticker => sticker.id)]));

export const mockStickers: StickerItem[] = [
  { id: 'stk-butterfly', nameKu: 'پەپوولەی ڕەنگین', emoji: '🦋', unlockedAtStars: 3, category: 'animals' },
  { id: 'stk-fox', nameKu: 'ڕێوی زرنگ', emoji: '🦊', unlockedAtStars: 6, category: 'animals' },
  { id: 'stk-bear', nameKu: 'ورچی میهرەبان', emoji: '🐻', unlockedAtStars: 10, category: 'animals' },
  { id: 'stk-deer', nameKu: 'ئاسکی چاوگەش', emoji: '🦌', unlockedAtStars: 16, category: 'animals' },
  { id: 'stk-mountain', nameKu: 'چیای بەرز', emoji: '⛰️', unlockedAtStars: 24, category: 'nature' },
  { id: 'stk-sun', nameKu: 'خۆری گەش', emoji: '☀️', unlockedAtStars: 34, category: 'nature' },
  { id: 'stk-flower', nameKu: 'گوڵەباخ', emoji: '🌹', unlockedAtStars: 46, category: 'nature' },
  { id: 'stk-newroz', nameKu: 'مەشخەڵی نەورۆز', emoji: '🔥', unlockedAtStars: 60, category: 'kurdish_culture' },
  { id: 'stk-honey', nameKu: 'هەنگوینی شاخ', emoji: '🍯', unlockedAtStars: 76, category: 'nature' },
  { id: 'stk-star', nameKu: 'ئەستێرەی زیرەکی', emoji: '⭐', unlockedAtStars: 94, category: 'space' },
  { id: 'stk-rocket', nameKu: 'فڕۆکەی خەیاڵ', emoji: '🚀', unlockedAtStars: 114, category: 'space' },
  { id: 'stk-crown', nameKu: 'تاجی پالەوان', emoji: '👑', unlockedAtStars: 135, category: 'kurdish_culture' },
];
