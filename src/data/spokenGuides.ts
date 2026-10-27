/**
 * What the app says aloud on the newer screens, because many children cannot read yet. These are optional
 * recordings (see narratedExtras): the screens use them when the audio pack has them and stay quiet otherwise.
 * Keep every sentence short and in plain words.
 */
export const SPOKEN_GUIDES = {
  garden: 'ئەمە باخچەی پەپوولەکانتە. لێرە هاوڕێکەت هەیە. شەهدی بدەرێ تا گەورە ببێت. هەر کاتێک شتێکی نوێ فێر بیت، پەپوولەیەکی نوێ دەکرێتەوە.',
  vocab: 'ئەمە یاری وشە و وێنەیە. یەکێک لە بەشەکان هەڵبژێرە: ئاژەڵ، خواردن، میوە، یان ڕستە.',
  vocabWord: 'سەیری وێنەکە بکە و وشەی دروست هەڵبژێرە.',
  vocabSentence: 'ڕستەکە ببیستە و وێنەی دروست هەڵبژێرە.',
  quests: 'ئەمە ماجەرایەکانی پەپوولەیە. ماجەرایەک هەڵبژێرە و یارمەتی پەپوولە بدە.',
  questStep: 'گوێ بگرە و وێنەی دروست هەڵبژێرە.',
  questWrong: 'نزیک بوویت. دووبارە هەوڵ بدە.',
  letterWords: 'لەم وشانەدا هەیە.',
} as const;

export interface QuestVoice { intro: string; outro: string; }
export const QUEST_VOICE: Record<string, QuestVoice> = {
  'quest-hungry': { intro: 'پەپوولە زۆر برسییەتی! یارمەتی بدە خواردنەکانی بدۆزێتەوە.', outro: 'ئافەرین! پەپوولە ئێستا تێر بوو و زۆر دڵخۆشە.' },
  'quest-animals': { intro: 'ئاژەڵەکانی باخچە خۆیان شاردووەتەوە! یارمەتی بدە بیاندۆزینەوە.', outro: 'ئافەرین! هەموو ئاژەڵەکانت دۆزییەوە.' },
  'quest-fruit': { intro: 'با میوە و سەوزەکان کۆ بکەینەوە بۆ سەبەتەکە.', outro: 'ئافەرین! سەبەتەکە پڕ بوو.' },
  'quest-big': { intro: 'ئەمە گەشتی گەورەیە! هەموو شتەکان بدۆزەوە.', outro: 'پیرۆزە! تۆ پالەوانی ماجەرایەکانی.' },
};
/** Said after a picture word to ask the child to find it: «سێو بدۆزەوە.» (this phrase is already recorded). */
export const FIND_PHRASE = 'بدۆزەوە.';
export const GUIDE_TEXTS: string[] = [...Object.values(SPOKEN_GUIDES), ...Object.values(QUEST_VOICE).flatMap(item => [item.intro, item.outro])];
