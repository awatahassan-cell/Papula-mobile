// Child-facing narration for each main destination. Lessons/readers have their own guidance.
export const sectionIntroductions: Record<string, string> = {
  home: 'سڵاو! دوگمەی بەردەوام بین بدە. یاری و نووسین و چیرۆک لێرەن.',
  // Home after today's letter is done: there is no «continue» button then, so the welcome must not name one.
  homeDone: 'پیتی ئەمڕۆمان ناسی. ئێستا ڕاهێنانی زیاتر بکەین.',
  garden: 'ئەمە باخچەکەتە! هەر گەشتێک تەواو بکەیت، گوڵێک دەڕوێت. هاوڕێکەت لێرەیە، خۆراکی بدەرێ.',
  alphabet: 'ئەمە ڕێگای فێربوونە. پیتە کراوەکە هەڵبژێرە و بڕۆ.',
  stories: 'با چیرۆک بخوێنینەوە! گوێ بگرە، یان خۆت بیخوێنەوە.',
  'match-game': 'با یاری بکەین! یارییەک هەڵبژێرە.',
  writing: 'با بنووسین! نموونەکە ببینە، پاشان بە پەنجەت بینووسە.',
  'word-writing': 'با وشە بنووسین! وشەیەک هەڵبژێرە و بینووسە.',
  'daily-practice': 'کاتی مەشقە! با پیتەکان دووبارە بکەینەوە. لە هەڵە مەترسە.',
  stickers: 'ئەمە ئەلبوومەکەتە! ستیکەر و پەپوولەکانت لێرەن.',
  badges: 'ئەمە میدالیاکانتن! با ببینین.',
  'my-words': 'ئەمە وشە خۆشەویستەکانتن. گوێ بگرە و بیڵێرەوە.',
  'parent-dashboard': 'بەخێربێن دایک و باوک. لێرە پێشکەوتنی منداڵەکەتان دەبینن.',
};

/** What is said for a screen. The home welcome changes once today's letter is finished (no continue button is shown then). */
export const introductionFor = (route: string, todayDone = false): string | undefined =>
  route === 'home' && todayDone ? sectionIntroductions.homeDone : sectionIntroductions[route];
