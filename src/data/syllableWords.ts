/**
 * Hand-checked syllable splits for words in the learning vocabulary.
 * Only words that already have bundled narration are listed, so the game can
 * play the whole word offline. The syllables must join back into the word
 * (enforced by tests/syllables.test.cjs).
 */
export const SYLLABLE_WORDS: { word: string; syllables: string[] }[] = [
  { word: 'باران', syllables: ['با', 'ران'] },
  { word: 'هەنار', syllables: ['هە', 'نار'] },
  { word: 'دەرگا', syllables: ['دەر', 'گا'] },
  { word: 'پەردە', syllables: ['پەر', 'دە'] },
  { word: 'زستان', syllables: ['زس', 'تان'] },
  { word: 'وێنە', syllables: ['وێ', 'نە'] },
  { word: 'ڕێگا', syllables: ['ڕێ', 'گا'] },
  { word: 'ماسی', syllables: ['ما', 'سی'] },
  { word: 'یاری', syllables: ['یا', 'ری'] },
  { word: 'لێمۆ', syllables: ['لێ', 'مۆ'] },
  { word: 'لۆکە', syllables: ['لۆ', 'کە'] },
  { word: 'لێفە', syllables: ['لێ', 'فە'] },
  { word: 'کۆتر', syllables: ['کۆ', 'تر'] },
  { word: 'گێلاس', syllables: ['گێ', 'لاس'] },
  { word: 'شەکەر', syllables: ['شە', 'کەر'] },
  { word: 'نێرگز', syllables: ['نێر', 'گز'] },
  { word: 'نینۆک', syllables: ['نی', 'نۆک'] },
  { word: 'خەیار', syllables: ['خە', 'یار'] },
  { word: 'قەڵەم', syllables: ['قە', 'ڵەم'] },
  { word: 'غەزال', syllables: ['غە', 'زال'] },
  { word: 'عەینەک', syllables: ['عەی', 'نەک'] },
  { word: 'هەنجیر', syllables: ['هەن', 'جیر'] },
  { word: 'فڕۆکە', syllables: ['فڕۆ', 'کە'] },
  { word: 'پشیلە', syllables: ['پشی', 'لە'] },
  { word: 'خانوو', syllables: ['خا', 'نوو'] },
  { word: 'پەپوولە', syllables: ['پە', 'پوو', 'لە'] },
  { word: 'جووجەڵە', syllables: ['جوو', 'جە', 'ڵە'] },
  { word: 'حەلاوە', syllables: ['حە', 'لا', 'وە'] },
  { word: 'کەرۆشک', syllables: ['کە', 'رۆشک'] },
  { word: 'کەڵەشێر', syllables: ['کە', 'ڵە', 'شێر'] },
  { word: 'ئەستێرە', syllables: ['ئەس', 'تێ', 'رە'] },
  { word: 'یاسەمین', syllables: ['یا', 'سە', 'مین'] },
  { word: 'یارمەتی', syllables: ['یار', 'مە', 'تی'] },
  { word: 'هەنگوین', syllables: ['هەن', 'گوین'] },
  { word: 'عەرەبانە', syllables: ['عە', 'رە', 'با', 'نە'] },
];
