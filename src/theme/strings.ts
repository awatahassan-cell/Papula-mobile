/**
 * Kurdish Sorani UI Strings for Papula (پەپوولە)
 * Centralized string dictionary for child-friendly Kurdish learning.
 * Configurable for future dialects (e.g. Kurmanji in Latin script).
 */

export interface LocaleStrings {
  appName: string;
  appTagline: string;
  direction: 'rtl' | 'ltr';
  fontFamily: string;

  common: {
    back: string;
    continue: string;
    start: string;
    done: string;
    close: string;
    retry: string;
    skip: string;
    save: string;
    cancel: string;
    stars: string;
    streak: string;
    level: string;
    minutes: string;
    listen: string;
    recordVoice: string;
    myVoice: string;
    greatJob: string;
    superStar: string;
    tryAgain: string;
    locked: string;
    unlocked: string;
  };

  onboarding: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    childNamePrompt: string;
    namePlaceholder: string;
    chooseAvatarPrompt: string;
    agePrompt: string;
    age3_4: string;
    age5_6: string;
    age7_8: string;
    letsGo: string;
  };

  home: {
    greeting: string;
    dailyPracticeTitle: string;
    dailyPracticeSub: string;
    alphabetTitle: string;
    alphabetSub: string;
    storiesTitle: string;
    storiesSub: string;
    writingTitle: string;
    writingSub: string;
    stickersTitle: string;
    parentAreaButton: string;
    myWordsTitle: string;
  };

  alphabet: {
    screenTitle: string;
    allLetters: string;
    mastered: string;
    needsPractice: string;
    soundButtonLabel: string;
    exampleWords: string;
    formsTitle: string;
    formIsolated: string;
    formInitial: string;
    formMedial: string;
    formFinal: string;
    formInitialMedial?: string;
    formSingleOnly?: string;
    practiceWritingButton: string;
    matchGameButton: string;
  };

  matchGame: {
    screenTitle: string;
    instructions: string;
    listenPrompt: string;
    whichLetter: string;
    correctPraise: string;
    tryNext: string;
    streakBonus: string;
    playAgain: string;
  };

  writing: {
    screenTitle: string;
    modeThick: string;
    modeDotted: string;
    modeFree: string;
    demoButton: string;
    clearButton: string;
    accuracyLabel: string;
    gentleHint: string;
    praise1Star: string;
    praise2Stars: string;
    praise3Stars: string;
    switchForm: string;
    traceName: string;
  };

  stories: {
    screenTitle: string;
    readToMe: string;
    iRead: string;
    pageOf: string;
    finishTitle: string;
    finishSubtitle: string;
    quizTitle: string;
    correctAnswer: string;
    wrongAnswer: string;
    addedToMyWords: string;
    bookmarkSaved: string;
    readAgain: string;
  };

  parent: {
    gateTitle: string;
    gatePrompt: string;
    gateIncorrect: string;
    dashboardTitle: string;
    summaryTitle: string;
    timeSpent: string;
    lettersMastered: string;
    storiesRead: string;
    practiceRecommended: string;
    dailyLimitTitle: string;
    dailyLimitMinutes: string;
    bedtimeLockTitle: string;
    soundSettingsTitle: string;
    soundEffects: string;
    narrationVolume: string;
    switchProfile: string;
    addProfile: string;
    subscriptionStatus: string;
    activePlan: string;
    managePlan: string;
    languageSettings: string;
  };

  paywall: {
    title: string;
    subtitle: string;
    trialBadge: string;
    monthlyPlan: string;
    yearlyPlan: string;
    monthlyPrice: string;
    yearlyPrice: string;
    savePercentage: string;
    featuresList: string[];
    subscribeButton: string;
    restoreButton: string;
    cancelAnytime: string;
    mockNote: string;
  };
}

export const stringsSorani: LocaleStrings = {
  appName: 'پەپوولە',
  appTagline: 'فێربوونی شادمانەی زمانی کوردی',
  direction: 'rtl',
  fontFamily: 'IBMPlexSansArabic_400Regular',

  common: {
    back: 'گەڕانەوە',
    continue: 'بەردەوام بە',
    start: 'دەستپێکردن',
    done: 'تەواو',
    close: 'داخستن',
    retry: 'دووبارە بکەرەوە',
    skip: 'تێپەڕاندن',
    save: 'پاشەکەوتکردن',
    cancel: 'پەشیمانبوونەوە',
    stars: 'ئەستێرەکان',
    streak: 'ڕۆژانی لەسەریەک',
    level: 'ئاست',
    minutes: 'خولەک',
    listen: 'گوێبگرە',
    recordVoice: 'دەنگت تۆمار بکە',
    myVoice: 'دەنگی من',
    greatJob: 'دەستخۆش! زۆر نایاب بوو',
    superStar: 'تۆ زیرەکیت!',
    tryAgain: 'جارێکی تر هەوڵ بدە، تۆ دەتوانیت!',
    locked: 'داخراو',
    unlocked: 'کراوە',
  },

  onboarding: {
    welcomeTitle: 'بەخێربێیت بۆ پەپوولە! 🦋',
    welcomeSubtitle: 'با پێکەوە فێری ئەلفوبێ، نووسین و چیرۆکی کوردی ببین',
    childNamePrompt: 'ناوی تۆی زیرەک چییە؟',
    namePlaceholder: 'ناوەکەت لێرە بنووسە...',
    chooseAvatarPrompt: 'کەسایەتییە دڵخوازەکەت هەڵبژێرە:',
    agePrompt: 'تەمەنت چەند ساڵە؟',
    age3_4: '٣ - ٤ ساڵ',
    age5_6: '٥ - ٦ ساڵ',
    age7_8: '٧ - ٨ ساڵ',
    letsGo: 'دەست پێبکەین! 🚀',
  },

  home: {
    greeting: 'سڵاو هاوڕێی زیرەکم',
    dailyPracticeTitle: 'مەشقی ئەمڕۆ',
    dailyPracticeSub: '٥ خولەک یاری و فێربوون بۆ بەدەستهێنانی ئەستێرەی نوێ!',
    alphabetTitle: 'ئەلفوبێی کوردی',
    alphabetSub: 'هەموو پیتەکان لەگەڵ دەنگ و وێنە',
    storiesTitle: 'چیرۆکە ڕازاوەکان',
    storiesSub: 'چیرۆکی خۆش لەگەڵ خوێندنەوەی پیت بە پیت',
    writingTitle: 'فێربوونی ڕێنووس',
    writingSub: 'بە پەنجەکانت پیتەکان بنەخشێنە',
    stickersTitle: 'ئەلبوومی ستیکەرەکان',
    parentAreaButton: 'ناوچەی دایک و باوک',
    myWordsTitle: 'وشەکانم',
  },

  alphabet: {
    screenTitle: 'ئەلفوبێی کوردی',
    allLetters: 'هەموو پیتەکان',
    mastered: 'فێربووم',
    needsPractice: 'پێویستی بە مەشقە',
    soundButtonLabel: 'گوێگرتن لە دەنگی پیتەکە',
    exampleWords: 'نموونەی وشەکان',
    formsTitle: 'شێوازەکانی نووسینی پیتەکە',
    formIsolated: 'تەنیا',
    formInitial: 'سەرەتا',
    formMedial: 'ناوەڕاست',
    formFinal: 'کۆتایی',
    formInitialMedial: 'سەرەتا و ناوەڕاست',
    formSingleOnly: 'ئەم پیتە تەنیا یەک شێوازی هەیە',
    practiceWritingButton: 'ئەم پیتە بنووسە',
    matchGameButton: 'یاری ناسینەوەی ئەم پیتە',
  },

  matchGame: {
    screenTitle: 'یاری ناسینەوەی دەنگ و پیت 🎯',
    instructions: 'گوێ لە دەنگەکە بگرە و پیتی دروست هەڵبژێرە!',
    listenPrompt: 'کلیک بکە بۆ گوێگرتن لە دەنگەکە',
    whichLetter: 'ئەم دەنگە هی کام پیتەیە؟',
    correctPraise: 'نایاب بوو! پیتەکەت ناسییەوە 🌟',
    tryNext: 'پرسیاری دواتر',
    streakBonus: 'ئافەرم! وەڵامی دروست',
    playAgain: 'دووبارە یاری بکەرەوە',
  },

  writing: {
    screenTitle: 'ڕێنووس و نووسین بە پەنجە ✍️',
    modeThick: 'ڕێبەری ئەستوور',
    modeDotted: 'خاڵبەندی',
    modeFree: 'نووسینی ئازاد',
    demoButton: 'نیشاندانی ڕێگای نووسین',
    clearButton: 'سڕینەوە',
    accuracyLabel: 'وردی و ڕێکی نووسین',
    gentleHint: 'پەنجەت بەسەر هێڵەکاندا بخشێنە لە سەرەتاوە بەرەو کۆتایی',
    praise1Star: 'هەوڵێکی باشە! جوانتر دەتوانیت ⭐',
    praise2Stars: 'زۆر باشە! دەستەکانت خۆش بێت ⭐⭐',
    praise3Stars: 'زۆر نایاب و بێ وێنەیە! ⭐⭐⭐',
    switchForm: 'گۆڕینی شێوازی پیت',
    traceName: 'نووسینی ناوی خۆت',
  },

  stories: {
    screenTitle: 'کتێبخانەی چیرۆکەکان 📚',
    readToMe: 'بۆم بخوێنەوە 🎧',
    iRead: 'خۆم دەخوێنمەوە 📖',
    pageOf: 'لاپەڕەی',
    finishTitle: 'پیرۆزە! چیرۆکەکەت تەواو کرد 🎉',
    finishSubtitle: 'بە تەواوکردنی ئەم چیرۆکە ٣ ئەستێرەت بەدەستهێنا!',
    quizTitle: 'پرسیارێکی وشیاری:',
    correctAnswer: 'وەڵامەکەت تەواوە! بژی 👏',
    wrongAnswer: 'نزیک بوویت، جارێکی تر بیری لێ بکەرەوە!',
    addedToMyWords: 'وشەی نوێ زیادکرا بۆ وشەکانت! ✨',
    bookmarkSaved: 'لاپەڕەکە نیشان کرا',
    readAgain: 'خوێندنەوەی دووبارە',
  },

  parent: {
    gateTitle: 'دەروازەی دایک و باوک 🔒',
    gatePrompt: 'بۆ چوونە ژوورەوە وەڵامی ئەم پرسیارە بدەرەوە:',
    gateIncorrect: 'وەڵامەکە دروست نەبوو، تکایە دووبارە هەوڵ بدەرەوە.',
    dashboardTitle: 'داشبۆردی سەرپەرشتیاری خێزان',
    summaryTitle: 'پوختەی ئەم هەفتەیە',
    timeSpent: 'کاتی بەسەرچوو بە خولەک',
    lettersMastered: 'پیتە فێربووەکان',
    storiesRead: 'چیرۆکە تەواوکراوەکان',
    practiceRecommended: 'پیتەکان کە پێویستیان بە مەشقی زیاترە:',
    dailyLimitTitle: 'سنووردارکردنی کاتی ڕۆژانە',
    dailyLimitMinutes: 'خولەک لە ڕۆژێکدا',
    bedtimeLockTitle: 'قفڵی کاتی خەوتن (سەعات ٨ی شەو بەرەو ژوور)',
    soundSettingsTitle: 'ڕێکخستنی دەنگەکان',
    soundEffects: 'کاریگەرییە دەنگییەکان (Sound FX)',
    narrationVolume: 'دەنگی خوێندنەوەی پیت و چیرۆک',
    switchProfile: 'گۆڕینی هەژماری منداڵ',
    addProfile: 'زیادکردنی منداڵی نوێ',
    subscriptionStatus: 'دۆخی بەشداریکردن',
    activePlan: 'پلان: تەواوی بەشەکان کراوەن (Premium)',
    managePlan: 'بەڕێوەبردنی بەشداریکردن',
    languageSettings: 'شێوەزار: کوردی سۆرانی (پیتی ئەلفوبێ)',
  },

  paywall: {
    title: 'تایبەتمەندییە نایابەکانی پەپوولە 👑',
    subtitle: 'دەرگای فێربوون بۆ منداڵەکەت بە تەواوی بکەرەوە',
    trialBadge: '٧ ڕۆژ بە خۆڕایی تاقی بکەرەوە',
    monthlyPlan: 'پلانی مانگانە',
    yearlyPlan: 'پلانی ساڵانە (پاشەکەوت)',
    monthlyPrice: '$3.99 / مانگ',
    yearlyPrice: '$29.99 / ساڵ',
    savePercentage: '٤٠٪ پاشەکەوت بکە',
    featuresList: [
      'دەستڕاگەیشتن بە هەموو پیتەکان لەگەڵ ڕێنووسی پێشکەوتوو',
      'کتێبخانەی هەموو چیرۆکە دەنگییە نوێیەکان بە بەردەوامی',
      'یارییە فێرکارییەکان بەبێ هیچ ڕیکلامێک',
      'بەکارهێنان بەبێ ئینتەرنێت لە هەر شوێنێک بیت',
      'دروستکردنی فرە هەژمار بۆ هەموو منداڵانی خێزان',
    ],
    subscribeButton: 'دەستپێکردنی تاقیکردنەوەی خۆڕایی',
    restoreButton: 'گێڕانەوەی کڕینەکانی پێشوو',
    cancelAnytime: 'دەتوانیت هەر کاتێک بێت بەبێ کێشە بەشداریکردنەکەت بوەستێنیت.',
    mockNote: '(ئەمە نموونەی نمایشییە و هیچ پارەیەک لە قۆناغی یەکەمدا وەرناگیرێت)',
  },
};

export const defaultStrings = stringsSorani;
