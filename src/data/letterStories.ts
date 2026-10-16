import { StoryItem } from '../services/types';
import { mockLetters } from './mockLetters';
import { alfubeNweStories } from './alfubeNweStories';

// Authored mini stories for listening together. They are not restricted to
// previously learned letters; independent reading readiness is checked separately.
type StorySeed = { title: string; emoji: string; lines: [string, string, string]; question: string; answers: [string, string, string] };
const seeds: Record<string, StorySeed> = {
  dal: { title: 'دارا و دوو دار', emoji: '🌳', lines: ['دارا دوو داری دی.', 'دوو دارەکە دوور بوون.', 'دارا دەستی بۆ دوو دارەکە ڕاوەشاند.'], question: 'دارا چەند داری دی؟', answers: ['دوو دار', 'یەک دار', 'سێ دار'] },
  ra: { title: 'باران و دار', emoji: '🌧️', lines: ['باران لەسەر دار دەبارێت.', 'دارا لە ژێر دارەکەدایە.', 'دارا سەیری باران دەکات.'], question: 'چی لەسەر دار دەبارێت؟', answers: ['باران', 'بەفر', 'گوڵ'] },
  alif: { title: 'ئارام و هەنار', emoji: '🍎', lines: ['ئارام هەنارێکی هەیە.', 'ئارام هەنارەکە دەکاتەوە.', 'ئارام و دارا هەنار دەخۆن.'], question: 'ئارام و دارا چی دەخۆن؟', answers: ['هەنار', 'مۆز', 'نان'] },
  waw_kurt: { title: 'ورچ و وێنە', emoji: '🐻', lines: ['ورچ وێنەی وشتری دی.', 'ورچ و وشتر لە وێنەکەدان.', 'ورچ وێنەکە بە هاوڕێکەی پیشان دا.'], question: 'ورچ وێنەی چی دی؟', answers: ['وشتر', 'ماسی', 'پشیلە'] },
  sar_e: { title: 'پەری و پەردە', emoji: '🪟', lines: ['پەری پەردەکە دەکاتەوە.', 'پەپوولەیەک لە دەرەوەیە.', 'پەری بە پەپوولەکە دەڵێت: وەرە!'], question: 'پەری چی دەکاتەوە؟', answers: ['پەردە', 'کتێب', 'سەبەتە'] },
  wwaw: { title: 'دوو بووکی سوور', emoji: '🧸', lines: ['دوو بووکی سوور لە ژوورەکەدان.', 'نوور دوو بووکەکە دەبینێت.', 'نوور لەگەڵ دوو بووکەکە یاری دەکات.'], question: 'بووکەکان چ ڕەنگێکن؟', answers: ['سوور', 'شین', 'زەرد'] },
  za: { title: 'زانا و زەنگ', emoji: '🔔', lines: ['زانا زەنگێکی زەردی هەیە.', 'زانا زەنگەکە لێ دەدات.', 'زەنگە زەردەکە دەنگێکی خۆشی هەیە.'], question: 'زانا چی لێ دەدات؟', answers: ['زەنگ', 'دەف', 'تۆپ'] },
  ba: { title: 'باران و بەفر', emoji: '❄️', lines: ['باران لە پشت پەنجەرەکەیە.', 'باران سەیری بەفری سپی دەکات.', 'بابە بە باران دەڵێت: با بچین بۆ بەفر!'], question: 'باران سەیری چی دەکات؟', answers: ['بەفر', 'ماسی', 'مانگ'] },
  hamza: { title: 'ئاسک و ئاو', emoji: '🦌', lines: ['ئاسکەکە هات بۆ لای ئاو.', 'ئاسکەکە ئاوی پاکی خواردەوە.', 'ئارام لە دوورەوە سەیری ئاسکەکەی کرد.'], question: 'ئاسکەکە چی خواردەوە؟', answers: ['ئاو', 'شیر', 'شەربەت'] },
  rra_heavy: { title: 'ڕۆژین و ڕێگا', emoji: '🛤️', lines: ['ڕۆژین لەسەر ڕێگایەکی ڕاستە.', 'ڕۆژین ڕوو لە باخچە دەکات.', 'ڕۆژین لە ڕێگاکە گوڵێکی بینی.'], question: 'ڕۆژین ڕوو لە کوێ دەکات؟', answers: ['باخچە', 'دەریا', 'بازاڕ'] },
  mim: { title: 'مینا و ماسی', emoji: '🐟', lines: ['مینا ماسییەکی بچووکی بینی.', 'ماسییەکە لە ئاوەکەدا مەلەی دەکرد.', 'مینا بە مامەی گوت: ماسییەکە ببینە!'], question: 'ماسییەکە لە کوێ مەلە دەکات؟', answers: ['ئاو', 'ئاسمان', 'ژوور'] },
  noon: { title: 'ناز و نان', emoji: '🥖', lines: ['ناز نانێکی گەرمی هەیە.', 'ناز نانەکە دەکات بە دوو بەش.', 'ناز نیوەی نانەکە دەدات بە نینا.'], question: 'ناز نیوەی نانەکە دەدات بە کێ؟', answers: ['نینا', 'دارا', 'مینا'] },
  e_drej: { title: 'سێوەکەی شێر', emoji: '🦁', lines: ['شێر لە ژێر دارەکەیە.', 'سێوێک لەسەر دارەکەیە.', 'شێر سەیری سێوەکە دەکات.'], question: 'چی لەسەر دارەکەیە؟', answers: ['سێو', 'مۆز', 'تۆپ'] },
  ta: { title: 'تارا و تۆپ', emoji: '⚽', lines: ['تارا تۆپێکی هەیە.', 'تارا تۆپەکە دەدات بە توانای هاوڕێی.', 'توانا تۆپەکە دەگەڕێنێتەوە بۆ تارا.'], question: 'تارا چی دەدات بە توانا؟', answers: ['تۆپ', 'کتێب', 'گوڵ'] },
  ya_kurt: { title: 'یاسەمین و یاری', emoji: '🤝', lines: ['یاسەمین یاری دەکات.', 'یاسەمین یارمەتی یارەکەی دەدات.', 'یاسەمین و یارەکەی پێکەوە یاری دەکەن.'], question: 'یاسەمین یارمەتی کێ دەدات؟', answers: ['یارەکەی', 'ماسییەکە', 'ئاسکەکە'] },
  sin: { title: 'سارا و سێو', emoji: '🍎', lines: ['سارا سێ سێوی هەیە.', 'سارا سێوە سوورەکان دەشوات.', 'سارا سێوێک دەدات بە سۆما.'], question: 'سارا چەند سێوی هەیە؟', answers: ['سێ سێو', 'یەک سێو', 'دوو سێو'] },
  shin: { title: 'شەماڵ و شێر', emoji: '🦁', lines: ['شەماڵ وێنەی شێر دەکێشێت.', 'شەماڵ شێرەکە بە شین ڕەنگ دەکات.', 'شەماڵ وێنەکە پیشانی شیلان دەدات.'], question: 'شەماڵ وێنەی چی دەکێشێت؟', answers: ['شێر', 'مار', 'کەروێشک'] },
  pa: { title: 'پەری و پەپوولە', emoji: '🦋', lines: ['پەری پەپوولەیەکی بینی.', 'پەپوولەکە لەسەر پەڕەگوڵێک نیشتەوە.', 'پەری پەپوولەکە پیشانی پوورەی دا.'], question: 'پەپوولەکە لەسەر چی نیشتەوە؟', answers: ['پەڕەگوڵ', 'تۆپ', 'کتێب'] },
  lam: { title: 'لالە و لیمۆ', emoji: '🍋', lines: ['لالە لیمۆیەکی هەیە.', 'لالە لیمۆکە دەدات بە لانا.', 'لانا لیمۆکە لەسەر مێزەکە دادەنێت.'], question: 'لالە چی دەدات بە لانا؟', answers: ['لیمۆ', 'نان', 'گوێز'] },
  lla_heavy: { title: 'گوڵ و دڵخۆشی', emoji: '🌼', lines: ['گوڵێک لە باخچەکەدا گەشایەوە.', 'گوڵەکە بۆنێکی خۆشی هەبوو.', 'دڵی هەمووان بە گوڵەکە خۆش بوو.'], question: 'چی لە باخچەکەدا گەشایەوە؟', answers: ['گوڵ', 'بەرد', 'کتێب'] },
  kaf: { title: 'کاوە و کتێب', emoji: '📖', lines: ['کاوە کتێبێکی هەیە.', 'کاوە کتێبەکە دەکاتەوە.', 'کاوە وێنەی کەروێشکێک لە کتێبەکە دەبینێت.'], question: 'کاوە چی دەکاتەوە؟', answers: ['کتێب', 'دەرگا', 'پەردە'] },
  gaf: { title: 'گەلا و گوڵ', emoji: '🌸', lines: ['گەلا گوڵێکی گەورەی بینی.', 'گەلا سەیری گەڵاکانی گوڵەکەی کرد.', 'گەلا گوتی: گوڵەکە چەند جوانە!'], question: 'گەلا چی بینی؟', answers: ['گوڵ', 'ماسی', 'شێر'] },
  o_drej: { title: 'سۆما و مۆز', emoji: '🍌', lines: ['سۆما مۆزێکی هەیە.', 'سۆما مۆزەکە دەکاتەوە.', 'سۆما نیوەی مۆزەکە دەدات بە سۆران.'], question: 'سۆما چی دەخوات؟', answers: ['مۆز', 'هەنار', 'نان'] },
  jim: { title: 'جوان و جل', emoji: '👕', lines: ['جوان جلێکی جوانی هەیە.', 'جوان جلەکە لەبەر دەکات.', 'جوان جلی خۆی پیشانی جودی دەدات.'], question: 'جوان چی لەبەر دەکات؟', answers: ['جل', 'پەردە', 'گەڵا'] },
  chim: { title: 'چیا و چۆلەکە', emoji: '🐦', lines: ['چیا چۆلەکەیەکی بینی.', 'چۆلەکەکە لەسەر چڵێک بوو.', 'چیا بە چۆلەکەکە گوت: چەند جوانیت!'], question: 'چۆلەکەکە لەسەر چی بوو؟', answers: ['چڵ', 'بەرد', 'تۆپ'] },
  kha: { title: 'خەجاڵ و خەرگۆش', emoji: '🐰', lines: ['خەجاڵ خەرگۆشێکی سپی بینی.', 'خەرگۆشەکە خەیارێکی دەخوارد.', 'خەجاڵ بە خۆشی سەیری خەرگۆشەکەی کرد.'], question: 'خەرگۆشەکە چی دەخوارد؟', answers: ['خەیار', 'گوێز', 'نان'] },
  ha_hezi: { title: 'حەسەن لە حەوشە', emoji: '🏡', lines: ['حەسەن لە حەوشەکەدایە.', 'حەسەن حەوت گوڵ دەبینێت.', 'حەسەن گوڵەکانی حەوشەکە ئاو دەدات.'], question: 'حەسەن لە کوێیە؟', answers: ['حەوشە', 'ژوور', 'بازاڕ'] },
  zha: { title: 'ژینا و ژوور', emoji: '🧸', lines: ['ژینا لە ژوورەکەیە.', 'ژینا ژمارەی بووکەکانی دەژمێرێت.', 'ژینا بووکەکان لە ژوورەکە ڕێک دەخات.'], question: 'ژینا چی دەژمێرێت؟', answers: ['بووکەکان', 'دارەکان', 'ئەستێرەکان'] },
  fa: { title: 'فەرهاد و فیل', emoji: '🐘', lines: ['فەرهاد وێنەی فیلێکی بینی.', 'فیلەکە لووتێکی درێژی هەبوو.', 'فەرهاد وێنەی فیلەکەی پیشانی فریا دا.'], question: 'فەرهاد وێنەی چی بینی؟', answers: ['فیل', 'ماسی', 'پشیلە'] },
  va: { title: 'ڤیان و ڤازە', emoji: '💐', lines: ['ڤیان ڤازەیەکی جوانی هەیە.', 'ڤیان گوڵ دەخاتە ناو ڤازەکە.', 'ڤیان ڤازەکە لەسەر مێزەکە دادەنێت.'], question: 'ڤیان چی دەخاتە ناو ڤازەکە؟', answers: ['گوڵ', 'تۆپ', 'کتێب'] },
  qaf: { title: 'قادر و قەلەم', emoji: '✏️', lines: ['قادر قەلەمێکی هەیە.', 'قادر بە قەلەمەکە قەلایەک دەکێشێت.', 'قادر قەلەمەکە دەخاتە ناو جانتاکەی.'], question: 'قادر بە چی وێنە دەکێشێت؟', answers: ['قەلەم', 'کەوچک', 'پێڵاو'] },
  ghayn: { title: 'غەزاڵ و غونچە', emoji: '🌷', lines: ['غەزاڵ غونچەیەکی بینی.', 'غونچەکە لە باخچەکەدا بوو.', 'غەزاڵ ڕۆژی دواتر بینی غونچەکە بووەتە گوڵ.'], question: 'غونچەکە بوو بە چی؟', answers: ['گوڵ', 'بەرد', 'تۆپ'] },
  ayn: { title: 'عەلی و عەینەک', emoji: '👓', lines: ['عەلی عەینەکی دۆزییەوە.', 'عەلی عەینەکەکە دەدات بە عومەر.', 'عومەر بە عەلی دەڵێت: سوپاس!'], question: 'عەلی چی دۆزییەوە؟', answers: ['عەینەک', 'کتێب', 'قەلەم'] },
  ha_hawa: { title: 'هانا و هەنار', emoji: '🍎', lines: ['هانا هەنارێکی هەیە.', 'هانا هەنارەکە دەدات بە هێمن.', 'هێمن و هانا پێکەوە هەنار دەخۆن.'], question: 'هانا و هێمن چی دەخۆن؟', answers: ['هەنار', 'سێو', 'گوێز'] },
};

export const letterStories: StoryItem[] = mockLetters.map((letter, storyIndex) => {
  const seed = seeds[letter.id];
  if (!seed) throw new Error(`Missing letter story: ${letter.id}`);
  return {
    id: `letter-story-${letter.id}`, targetLetterId: letter.id,
    titleKu: seed.title, titleEn: `Letter ${letter.id}`, level: 1,
    durationMinutes: 1, isPremium: false, coverEmoji: seed.emoji,
    coverThemeColor: 'from-amber-400 to-rose-400',
    summaryKu: `چیرۆکێکی کورت بۆ پیتی «${letter.glyph}»`,
    pages: [...seed.lines, `${letter.glyph}… ${letter.glyph}…`].map((textKu, index) => ({
      pageNumber: index + 1, textKu, illustrationTheme: 'letter-story',
      illustrationSvgId: 'garden', audioDurationMs: 0, wordTimings: [],
    })),
    quiz: { questionKu: seed.question, options: seed.answers.map((_, index) => {
      const answerIndex = (index + storyIndex) % seed.answers.length;
      return {id: `${letter.id}-answer-${answerIndex}`, textKu: seed.answers[answerIndex], imageEmoji: '', isCorrect: answerIndex === 0};
    }) },
  };
});

export const getLetterStories = (letterId: string): StoryItem[] => {
  const imported = alfubeNweStories.filter(story => story.targetLetterIds?.includes(letterId));
  return (imported.length ? imported : letterStories.filter(story => story.targetLetterId === letterId))
    .map(story => ({ ...story, targetLetterId: letterId }));
};
export const getLetterStory = (letterId: string) => getLetterStories(letterId)[0];
