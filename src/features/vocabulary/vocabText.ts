/** Screen-only Kurdish text for the picture-word game (kept out of the narrated, scanned files). */
export const VOCAB_TILE = { title: 'وشە و وێنە', hint: 'ئاژەڵ، خواردن و میوە بناسەوە' };
export const VOCAB_TEXT = {
  pickCategory: 'کام وشانە بخوێنین؟',
  sentences: 'ڕستە بخوێنمەوە',
  review: 'وشەکان بیر بخەمەوە',
  reviewHint: (n: number) => `${n} وشە کاتی دووبارەکردنەوەیانە`,
  pickWord: 'ئەم وێنەیە چ وشەیەکە؟',
  pickPicture: 'ڕستەکە بخوێنەوە و وێنەکەی بدۆزەوە',
  listen: 'ببیستە',
  next: 'دواتر ←',
  finish: 'تەواو ✓',
  right: 'ئافەرین! دروستە',
  wrong: 'نزیک بوویت! دووبارە هەوڵ بدە',
  done: 'ئافەرم! یارییەکەت تەواو کرد',
  score: (right: number, total: number) => `${right} لە ${total} بە یەکەم هەوڵ`,
  again: 'دووبارە یاری بکەمەوە',
  back: 'گەڕانەوە',
  nothingDue: 'ئەمڕۆ وشەی بیرخستنەوە نییە',
};
