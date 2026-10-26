/** Screen-only Kurdish text for free play. The games are guided by pictures and by the recorded letter and word voices. */
export const FREE_PLAY_TILE = { title: 'یاریی ئازاد', hint: 'یاری بکە و فێر بە، بێ پەلە' };
export const FREE_PLAY_TEXT = {
  pairs: { title: 'کارتی جووت', hint: 'وێنە و وشەکەی بدۆزەوە', ask: 'وێنەیەک و وشەکەی بدۆزەوە' },
  catch: { title: 'پەپوولە بگرە', hint: 'پیتی دروست بگرە', ask: 'ئەم پیتە بگرە' },
  train: { title: 'شەمەندەفەری وشە', hint: 'پیتەکان بە ڕیز دابنێ', ask: 'وشەکە دروست بکە' },
  locked: (n: number) => `${n} پیتی تر فێر ببە`,
  notReady: 'وشەی زیاتر فێر ببە',
  done: 'ئافەرین! یارییەکەت تەواو کرد',
  right: 'ئافەرین!',
  again: 'دووبارە',
  next: 'دواتر ←',
  back: 'گەڕانەوە',
};
