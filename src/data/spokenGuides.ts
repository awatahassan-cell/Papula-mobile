/**
 * What the app says aloud on the newer screens, because many children cannot read yet. These are optional
 * recordings (see narratedExtras): the screens use them when the audio pack has them and stay quiet otherwise.
 * Keep every sentence short and in plain words.
 */
export const SPOKEN_GUIDES = {
  garden: 'ئەمە باخچەی پەپوولەکانتە. هاوڕێکەت شەهدی بدەرێ.',
  vocab: 'ئەمە یاری وشە و وێنەیە. بەشێک هەڵبژێرە.',
  vocabWord: 'سەیری وێنەکە بکە و وشەی دروست هەڵبژێرە.',
  vocabSentence: 'ڕستەکە ببیستە و وێنەی دروست هەڵبژێرە.',
  quests: 'پەپوولە یارمەتی دەوێ. یارییەک هەڵبژێرە.',
  questStep: 'گوێ بگرە و وێنەی دروست هەڵبژێرە.',
  questWrong: 'نزیک بوویت. دووبارە هەوڵ بدە.',
  letterWords: 'لەم وشانەدا هەیە. جوان گوێ بگرە و بیناسەوە.',
  todayLetter: 'پیتی ئەمڕۆمان بریتییە لە',
  morePractice: 'ڕاهێنان و یاری زیاتر بکە تاکو باشتر فێر ببیت.',
} as const;

export interface QuestVoice { intro: string; outro: string; }
export const QUEST_VOICE: Record<string, QuestVoice> = {
  'quest-hungry': { intro: 'پەپوولە برسییەتی! خواردنەکانی بدۆزەرەوە.', outro: 'ئافەرین! پەپوولە ئێستا تێر بوو و زۆر دڵخۆشە.' },
  'quest-animals': { intro: 'ئاژەڵەکان خۆیان شاردووەتەوە! بیاندۆزەرەوە.', outro: 'ئافەرین! هەموو ئاژەڵەکانت دۆزییەوە.' },
  'quest-fruit': { intro: 'با میوە و سەوزەکان کۆ بکەینەوە بۆ سەبەتەکە.', outro: 'ئافەرین! سەبەتەکە پڕ بوو.' },
  'quest-big': { intro: 'ئەمە گەشتی گەورەیە! هەموو شتەکان بدۆزەوە.', outro: 'پیرۆزە! تۆ زۆر زیرەکی.' },
};
/** Said after a picture word to ask the child to find it: «سێو بدۆزەوە.» (this phrase is already recorded). */
export const FIND_PHRASE = 'بدۆزەوە.';
export const GUIDE_TEXTS: string[] = [...Object.values(SPOKEN_GUIDES), ...Object.values(QUEST_VOICE).flatMap(item => [item.intro, item.outro])];
