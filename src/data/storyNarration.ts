// Performance directions are kept separate from the text children read.
// Each plan follows the events and speakers of its particular story.
export const AUDIO_TAGS = [
  'weak', 'angry', 'bored', 'menacing', 'playful', 'tired', 'excited',
  'clears throat', 'coughing', 'chuckling', 'sighing', 'sniffling', 'yawning',
  'laughing', 'sharp exhale', 'scoffing', 'humming', 'panting',
  'whispering', 'singing', 'pause', 'voice breaking',
  'sleepy drowsy voice', 'witch voice', 'drunken voice', 'keyboard typing',
  'echoing', 'knocking on door', 'bell ringing', 'phone ringing', 'dog barking',
  'crowd cheering', 'applause', 'rain falling', 'drum roll', 'heartbeat', 'engine starting',
] as const;
export type AudioTag = typeof AUDIO_TAGS[number];
export type NarrationCue = { before: string; tags: AudioTag[] };
export type PageDirection = { tags: AudioTag[]; cues?: NarrationCue[] };
export type StoryDirection = { noteKu: string; pages: PageDirection[] };
const page = (tags: AudioTag[], cues?: NarrationCue[]): PageDirection => ({ tags, cues });
const cue = (before: string, ...tags: AudioTag[]): NarrationCue => ({ before, tags });
const plan = (noteKu: string, ...pages: PageDirection[]): StoryDirection => ({ noteKu, pages });

export const storyNarration: Record<string, StoryDirection> = {
  'alfube-nwe-3': plan('ناسینی دار؛ خوێندنەوەی ڕوون و هێواش، وەستان پێش دووبارەکردنەوە.', page([], [cue('دار، دار، دار', 'pause')])),
  'alfube-nwe-4': plan('ناسینی ناوی دارا؛ بانگکردنێکی دۆستانە و دووبارەکردنەوەی ڕوون.', page([], [cue('دارا، دارا، دارا', 'pause', 'playful')])),
  'alfube-nwe-5': plan('بانگکردنی دارا و نیشاندانی دار؛ جیاکردنەوەی دوو ڕیزەکە بە وەستان.', page(['playful'], [cue('دار، دار', 'pause')])),
  'alfube-nwe-6': plan('دارا دار دەبینێت؛ گێڕانەوەیەکی خۆش و دووبارەکردنەوەی هێواش.', page([], [cue('داری دی دارا.', 'pause')])),
  'alfube-nwe-7': plan('سەرنجڕاکێشان بۆ داو؛ سەرسوڕمانێکی یارییانە.', page(['playful'], [cue('داوی دارا، داو.', 'pause')])),
  'alfube-nwe-8': plan('بانگکردنی دارا بۆ دەرەوە؛ دەنگی گەرم و بانگهێشتکەر.', page(['playful'], [cue('وەرە، وەرە،', 'excited')])),
  'alfube-nwe-9': plan('بینینی دوو دار؛ ژماردنی ڕوون و جەخت لە دووری دارەکان.', page([], [cue('دوو دار،', 'pause')])),
  'alfube-nwe-10': plan('بانگهێشتنی زارا بۆ یاری؛ جووڵە و خۆشی لە بانگکردندا.', page(['playful'], [cue('زوو وەرە، زوو.', 'excited')])),
  'alfube-nwe-11': plan('بانگهێشتنی دارا بۆ دۆ؛ دەنگی میهرەبان و پەلەیەکی خۆش.', page(['playful'], [cue('دادە دۆی زۆرە.'), cue('دەی، زوو وەرە،', 'excited')])),
  'alfube-nwe-12': plan('سەرسوڕمان لە ئاوی زۆری ناو دۆ؛ گۆڕینی هەست لە ئای بۆ ئۆی.', page([], [cue('دۆی دادە ئاوی زۆرە.'), cue('ئۆی، ئۆی، دارا،', 'pause', 'sighing')])),
  'alfube-nwe-13': plan('بانگکردنی دادە بۆ دەرەوە؛ خۆشحاڵی بە هاتنی دادە.', page([], [cue('ئەوە ئازادە، دۆی دەوێ.', 'playful'), cue('ئێ، ئێ، دارا،', 'excited')])),
  'alfube-nwe-14': plan('بینینی سەگی تووڕە؛ ئاگاداری و سەرنج، بە گێڕانەوەی ڕوون.', page([], [cue('ئۆی، زەردە دەوەڕێ.', 'pause'), cue('زەردە دڕە.')])),
  'alfube-nwe-15': plan('دۆ ڕژاوە؛ بانگکردن بە سەرسوڕمان، پاشان هەناسەی بێزاری لە دووبارەبوونەوە.', page([], [cue('ـ ئۆی،', 'pause', 'sighing')])),
  'alfube-nwe-16': plan('گفتوگۆ لەسەر زریزەی ئازاد؛ پرسیاری یارییانە و دڵنیابوون لە وەڵام.', page(['playful'], [cue('ـ وەرە، وەرە، دارا،', 'pause', 'excited'), cue('ـ ئەی، ئەی،', 'pause')])),
  'alfube-nwe-17': plan('بانگکردنی زارا بۆ بینینی داری درێژ؛ سەرسوڕمان بە گەشەی دار.', page(['excited'], [cue('دەی زارا، زوو وەرە،', 'pause', 'playful')])),
  'alfube-nwe-18': plan('ئاودانی دارەکان؛ گێڕانەوەیەکی هێمن و دڵخۆشی بە گەشەیان.', page([], [cue('ئەو دوو دارە زوو دەڕوێن،', 'pause', 'playful')])),
  'alfube-nwe-19': plan('منداڵەکە بە خۆشی باسی چاندنی دار دەکات؛ دایک بە نەرمی داوای گەڕانەوە دەکات.', page(['excited'], [cue('ـ ئۆی، نازی،', 'pause')])),
  'alfube-nwe-20': plan('چاندنی دار و بانگی دایک؛ گۆڕینی دەنگ لەنێوان منداڵی خەریک و دایکی بانگکەر.', page(['playful'], [cue('ـ وەرە نازی،', 'pause'), cue('ـ وا دێم دایە،', 'pause', 'excited')])),
  'alfube-nwe-21': plan('خۆشەویستی بۆ مەڕە زەردەکە؛ بانگکردنی یارییانە و بەڵێنی ئاودان.', page(['playful'], [cue('ئەم مەڕە زەردە،'), cue('وا دەڕۆم ئاوی دەدەم،', 'pause')])),
  'alfube-nwe-22': plan('مێوژفرۆش و منداڵ؛ بانگی بازاڕ، داوای منداڵ و وەڵامی گەرم.', page(['playful'], [cue('ـ مام ژۆراب،', 'pause', 'excited'), cue('ـ زوو وەرە زەینەب،', 'pause')])),
  'alfube-nwe-23': plan('دیارییەکی نوێ بۆ زەینەب؛ بانگی خۆش و خۆشحاڵی لە سوپاسکردندا.', page([], [cue('ـ مامە بەبەی بۆ ناردووم؟', 'pause'), cue('بژی دایە،', 'excited')])),
  'alfube-nwe-24': plan('خۆشی بە باران و گەشەی دار؛ پاشان سەرنج بۆ چوونی مام ژۆراب.', page(['excited'], [cue('ئەمرۆ ئاو زۆر دەبێت،', 'pause'), cue('بنواڕە مام ژۆراب،', 'pause', 'playful')])),
  'alfube-nwe-25': plan('بینینی تەیارە و دۆزینەوەی لە ناو داران؛ بانگهێشت بۆ یاری و کێبڕکێ.', page(['excited'], [cue('تەیارەی واتان دیوە؟', 'pause', 'playful'), cue('ئازاد تۆ دەتوانی', 'pause', 'playful')])),
  'alfube-nwe-26': plan('دەستگرتن لە ئازاردانی تەیر؛ سەرنجڕاکێشان، سەرسوڕمان، پاشان ئاگادارکردنەوەی جدی.', page([], [cue('ـ ئای، ئای، ئازاد،', 'pause'), cue('ـ وەس بە دارا،', 'pause')])),
  'alfube-nwe-27': plan('داوای سێ سێو؛ ژماردنی ڕوون و کۆتایییەکی یارییانە.', page(['playful'], [cue('ـ ڕاوەستە نەسرین،', 'pause'), cue('ئەوە سێوێ،'), cue('ـ بەسە، بەسە،', 'pause', 'playful')])),
  'alfube-nwe-28': plan('سڵاوی بەیانیی کچ و باوک؛ ئارەزووی چوون و وەڵامێکی میهرەبان.', page([], [cue('ـ بابە ئەوە دەڕۆی؟', 'pause', 'playful'), cue('ـ نەسرین، ئێستا', 'pause')])),
  'alfube-nwe-29': plan('پیشاندانی شیری مەڕ و یاریی شاردنەوە؛ لە ناساندنەوە بۆ بانگهێشت بۆ دۆزینەوە.', page([], [cue('وەرن دانیشن،', 'pause', 'playful'), cue('دەیدەم بەوەی بیدۆزێتەوە.', 'excited')])),
  'alfube-nwe-30': plan('شەڕی مریشکەکان؛ سەرسوڕمان، بیرکردنەوە لە چارەسەر و هێمنکردنەوە.', page([], [cue('با تۆزێک نیسک', 'pause'), cue('ڕاوەستن،')])),
  'alfube-nwe-31': plan('یاریی توتکەسوور و کەو؛ خۆشی، نیگەرانی لە ئازاردان و داوای وەستان.', page(['playful'], [cue('نەکەی ئازاری'), cue('ئای، وا کەوی من', 'pause', 'excited'), cue('کش، کش،', 'pause')])),
  'alfube-nwe-32': plan('تۆپی منداڵان؛ دەنگی میهرەبانی باوک، داوای منداڵ و شادیی یاریی پێکەوە.', page(['playful'], [cue('ـ ئەی تۆپ بە من نادەی،', 'pause'), cue('ـ بژی بابە،', 'pause', 'excited')])),
  'alfube-nwe-33': plan('نزیککردنەوەی پشەی سپی؛ میاو بە شێوەی یاری و دڵنیایی بۆ پشەکە.', page(['playful'], [cue('وەرە پشەوە،', 'pause'), cue('تۆ پشەی منی، نەترسی.', 'pause')])),
  'alfube-nwe-34': plan('سێ سەگ کەروێشک ڕاودەنێن؛ سەرسوڕمان، دەنگی نزم بۆ سەیرکردن و بانگی هاوڕێ.', page([], [cue('دەنگ مەکە، با بێن.', 'whispering'), cue('ـ پرشنگ، پرشنگ،', 'pause', 'excited')])),
  'alfube-nwe-35': plan('بانگکردنی کارە سپی؛ ناز، دڵنیایی و پەلە بۆ گرتنی پێش ڕۆیشتن.', page(['playful'], [cue('گیات دەدەمێ'), cue('دایە گیان،', 'pause', 'excited'), cue('کارە سپی، مەڕۆ،', 'pause')])),
  'alfube-nwe-36': plan('سەیرکردنی پۆلی مەل؛ شادیی دۆزینەوە و وەڵامی هێمنی هاوڕێ.', page(['excited'], [cue('ـ نەوزاد ڕەنگە', 'pause')])),
  'alfube-nwe-37': plan('ئاهەنگ و بلوێر؛ خوێندنەوەی ئاوازدار و هاندان بۆ موزیکژەن.', page(['singing'], [cue('بژی ئازاد،', 'pause', 'excited')])),
  'alfube-nwe-38': plan('هێلکەکان و ترسی شکاندنیان؛ خۆشی، شوخی، سەرسوڕمان و دڵنیایی.', page(['playful'], [cue('ـ دارا گیان،', 'pause'), cue('ـ وا بۆت دەهاوێژم', 'pause', 'playful'), cue('ـ هەی، هەی،', 'pause'), cue('ـ باشە نایهاوێژم،', 'pause'), cue('ـ هەر بژی دارا،', 'pause', 'excited')])),
  'alfube-nwe-39': plan('داوای ئاوازی شەمشاڵ لە کاتی چاندندا؛ بانگ و وەڵامی دۆستانە.', page(['playful'], [cue('ـ باشە شەمشاڵ', 'pause')])),
  'alfube-nwe-40': plan('دیاریی کالەک لە باوکەوە؛ گفتوگۆی گەرم و سوپاسی دڵسۆزانە.', page([], [cue('ـ بەڵێ بابە گیان،', 'pause', 'playful'), cue('ـ وەرە، ئەم کالەکەت', 'pause'), cue('ـ سوپاست دەکەم بابە،', 'pause', 'excited')])),
  'alfube-nwe-41': plan('لێدانی دەرگا و هێنانی کۆتر؛ سوپاس و پرسینی چۆنیەتی چاودێرییان.', page(['knocking on door'], [cue('ـ سوپاس، سوپاس،', 'pause', 'excited'), cue('ـ بەڵێ، بەڵێ،', 'pause')])),
  'alfube-nwe-42': plan('کێبڕکێی دەنگی کەڵەباب و قاز؛ یاری و لاساییکردنەوەی دەنگەکان.', page(['playful'], [cue('قازەکان، وەرن', 'pause', 'excited'), cue('قی، قی، قی،', 'playful'), cue('ها، ها،', 'chuckling')])),
  'alfube-nwe-43': plan('دیلانیی هاوڕێکان؛ بانگهێشتێکی شاد و ئاگاداریی نەرم لە کەوتن.', page(['playful'], [cue('ـ ئازاد، ئەی تۆ', 'pause', 'excited'), cue('ـ باشە، وا هاتم،', 'pause')])),
  'alfube-nwe-44': plan('دایک لە هەڵسوکەوتی ئازاد ناڕازییە؛ هەناسەی بێزاری، پاشان داوای لێبوردنی نەرم.', page(['sighing'], [cue('ـ لێم ببوورە،', 'pause')])),
  'alfube-nwe-45': plan('شانازیی دارا بە دەستکردەکەی؛ ستایشی دایک و سوپاسی منداڵ.', page(['excited'], [cue('ـ ئافەرین دارا،', 'pause'), cue('ـ فەرموو دایە گیان،', 'pause', 'playful'), cue('ـ ئافەرین، زۆر باشە،', 'pause'), cue('ـ سوپاس دایە،', 'pause')])),
  'alfube-nwe-46': plan('کەوەکە بەڕەڵا بووە؛ بانگی خێرا بۆ یارمەتی و ڕێنماییی ڕوون.', page(['playful'], [cue('منداڵان، ڕاکەن،', 'excited'), cue('ئازاد گیان،', 'pause'), cue('بەڵام، یاری لەگەڵدا مەکە.')])),
  'alfube-nwe-47': plan('ڕێگرتن لە بەردهاوێشتن بۆ مەل؛ ڕێنماییی دڵسۆزانە و بەڵێنی گۆڕان.', page([], [cue('برام، مرۆڤ وا ناکات،', 'pause'), cue('ـ نەمرانی، نەسرین گیان،', 'pause')])),
  'alfube-nwe-48': plan('هەڵە لە ناسینی دەنگ؛ سەرسوڕمان لە با و ڕوونکردنەوەی ئارام.', page(['playful'], [cue('ـ ناژی، ئەوە بایە', 'pause')])),
  'alfube-nwe-49': plan('نانی ساج و یارمەتیی دایک؛ گێڕانەوەی گەرم، پێکەنینی زەینەب و خۆشیی ماڵ.', page([], [cue('لەولاوە زەینەب پێ دەکەنێت،', 'pause', 'chuckling'), cue('دەڵێ، وا دایک', 'playful')])),
  'alfube-nwe-50': plan('خواردندان بە جووجەکان؛ بانگکردنی یارییانە و داوای نەرم بۆ نەنووکدان.', page(['playful'], [cue('ڕاوەستن، وا دێم', 'pause'), cue('جووجەکان، دەنووک نەدەن', 'pause')])),
  'alfube-nwe-51': plan('سەیرکردنی مام وورچ لەناو خەڵکدا؛ سەرسوڕمان و خۆشیی هاوبەش.', page(['excited'], [cue('ـ ڕاست دەکەی،', 'pause', 'playful')])),
  'alfube-nwe-52': plan('باوک و چالاک؛ سڵاوی گەرم، حەزی دۆزینەوە و پاراستنی منداڵ بە نەرمی.', page([], [cue('ـ چاکم بابە گیان،', 'pause', 'playful'), cue('ـ ئەوە بۆ کوێ', 'pause'), cue('ـ دەچم سەیری', 'pause', 'excited'), cue('ـ نەچی چالاک،', 'pause')])),
  'alfube-nwe-53': plan('بینینی شاخ و بەرخە یاریگێڕەکان؛ شادی پاشان داوای هێمنی بۆ نەترساندنیان.', page(['playful'], [cue('ـ ڕاستە وا ڕا دەکەن.', 'pause', 'excited'), cue('ئازاد، پخ پخ نەکەی،', 'pause')])),
  'alfube-nwe-54': plan('پێشوازیی نەسرین لە باوک؛ خۆشەویستی، ستایش بۆ خوێندنەوە و سوپاس.', page(['excited'], [cue('ـ خۆش بی نەسرین خان.', 'pause'), cue('ـ خەریکی خوێندنەوەم', 'pause', 'playful'), cue('ـ ئافەرین نەسرین خان،', 'pause'), cue('ـ سوپاس بابە گیان،', 'pause')])),
  'alfube-nwe-55': plan('دوورخستنەوەی گا لە گوڵەکان؛ بانگکردنی جدی، پاشان باسکردنی پاسەوانی.', page(['excited'], [cue('من وا یاری بە مزراح دەکەم،', 'pause')])),
  'alfube-nwe-56': plan('پشوودان لە لای حەوز؛ هێمنی، ماندووبوون و خۆشیی پلانێکی هاوبەش.', page([], [cue('تاکو ماندوومان بحەسێتەوە؟', 'tired'), cue('ـ بەڵێ، منیش', 'pause'), cue('هەندێک حەلواش دەبەین،', 'playful')])),
  'alfube-nwe-57': plan('بەرخە سپی و ڕەشەکان؛ لاساییکردنەوەی یارییانە، پرسیار و ژماردنی هێواش.', page(['playful'], [cue('دەزانی هەموویان چەندن؟', 'pause'), cue('ـ هەردوو نەوع', 'pause')])),
  'alfube-nwe-58': plan('عەلی شیش و پلانی ڕۆژی دواتر؛ بانگی یارییانە، پێشنیار و بیرخستنەوەی خۆش.', page(['playful'], [cue('ـ نەوزاد، وازبێنە', 'pause'), cue('ـ ئازاد، بەیانی جومعەیە،', 'pause', 'chuckling')])),
  'alfube-nwe-59': plan('قەلە لە قەراغ ئاو؛ دەنگی یارییانە، پاشان ڕێگرتن لە پەلاماری سەگ.', page(['playful'], [cue('سەگەکەی من وا پەلاماری دەدات.', 'pause'), cue('چخ، چخ، سەگەکە،', 'pause')])),
  'alfube-nwe-60': plan('غارغارێنی سواران؛ جووڵەی کێبڕکێ، ڕوونکردنەوەی قەڵغان و شادیی پێشکەوتن.', page(['excited'], [cue('قەڵغان وەک ساج وایە،', 'pause'), cue('وا سوارێک پێش هەموویان', 'pause', 'excited')])),
  'alfube-nwe-62': plan('ئاهەنگی منداڵان؛ ناساندنی شاد، ئاوازی نیشتمان و بانگهێشت بۆ چەپڵە.', page(['excited'], [cue('وا دەست دەکەین', 'pause', 'singing'), cue('منداڵان، ئێوەش', 'pause', 'excited')])),
  'alfube-nwe-63': plan('بانگهێشت بۆ یاری؛ پرسیاری جووڵەدار و ڕێنماییی دڵسۆزانە بۆ یاریی باش.', page(['playful'], [cue('کێ دەزانی', 'pause'), cue('دەی منداڵان،', 'excited'), cue('بێ ئەوەی')])),
  'alfube-nwe-64': plan('یارمەتیی دایک لە ماڵ؛ شادیی کارکردن، نەغمەی نێرگز و دڵسۆزی بۆ دایکی ماندوو.', page([], [cue('نەسرین چا لێ دەنێ', 'playful'), cue('نێرگز پیاڵە دەشواو', 'humming'), cue('دایکیان ماندووە،', 'pause')])),
  'alfube-nwe-65': plan('منداڵێک حەزی بە یاریی دارایە؛ ئارەزووی یاری، پاشان وەڵامی دڵنەواییی دایک.', page(['excited'], [cue('خۆزگە منیش', 'pause'), cue('گیانەکەم،', 'pause')])),
  'alfube-nwe-66': plan('بەروبوومی ترێ و دابەشکردن؛ گێڕانەوەی گەرم و ڕیزکردنی خواردنەکان بە ڕوونی.', page([], [cue('بەشی خزم و دراوسێش دەدەن،', 'pause', 'playful'), cue('ئەوەی مایەوە', 'pause')])),
  'alfube-nwe-67': plan('پشەی خۆشەویست گەڕاوەتەوە؛ ناز، شادیی پێشوازی، پاشان پرسیاری دڵسۆزانە.', page([], [cue('ئەندام توکنی', 'playful'), cue('بەخێر هاتی،', 'pause', 'excited'), cue('جێگات چۆڵ بوو'), cue('تۆ لەکوێ بووی،', 'pause', 'playful'), cue('بۆچی خۆت ون کرد', 'pause')])),
  'alfube-nwe-68': plan('مۆسیقا و هەڵپەڕکێی هاوبەش؛ بانگهێشتی شاد و سوپاسی گەرم بۆ مامۆستا.', page(['excited'], [cue('کچان و کوڕان', 'playful'), cue('سوپاست دەکەین', 'pause')])),
  'alfube-nwe-69': plan('کۆتایی ساڵ؛ یادەوەریی خۆش، سوپاسی مامۆستا و ماڵئاواییی پڕسۆز.', page([], [cue('تێر یاریمان کرد', 'playful'), cue('سوپاست دەکەین مامۆستا گیان،', 'pause'), cue('هەر بیرت دەکەین', 'voice breaking'), cue('خواتان لەگەڵ،', 'pause')])),

  'story-butterfly': plan('بەیانییەکی ئارام، بەخەبەرهاتن، دیداری هاوڕێکان و کۆتایییەکی دڵخۆش.',
    page([]), page(['sleepy drowsy voice'], [cue('باڵەکانی کردەوە.', 'playful')]), page(['excited']),
    page([], [cue('وەرە با پێکەوە', 'playful')]), page([]), page([])),
  'story-fox-bear': plan('گەڕانی ورچ، هەواڵی شادمانەی ڕێوی، هاوکاری و دابەشکردنی میهرەبانانە.',
    page([]), page(['playful'], [cue('من دەزانم', 'excited')]), page(['excited']), page([], [cue('نیوەی بۆ تۆ', 'pause')])),
  'story-stars-sky': plan('شەوی ئەستێرەدار؛ هێمنی، دڵنیاییی مانگ و خەوی ئاسوودە.',
    page([]), page(['whispering']), page([], [cue('مەترسە ئاسکی جوان،', 'pause')]), page(['sleepy drowsy voice'])),
  'story-rabbit-turtle': plan('شانازیی کەروێشک، ئارامیی کیسەڵ، خەوتن، بەردەوامی و سەرسوڕمانی کۆتایی.',
    page(['playful'], [cue('من خێراترین', 'excited')]), page([]),
    page(['playful'], [cue('لە ناوەڕاستی ڕێگەکەدا خەوت.', 'pause', 'sleepy drowsy voice')]), page([]),
    page([], [cue('کیسەڵەکە گەیشتبووە', 'excited')])),
  'story-rain-rainbow': plan('هێمنیی هەور، دڵۆپی نەرم، ڕووناکی و شادیی بینینی پەلکەزێڕینە.',
    page([]), page([]), page(['playful']), page([], [cue('پەلکەزێڕینەیەکی', 'excited')]), page(['excited'])),
  'story-ant-winter': plan('کۆششی مێروولە، بانگی یاریی کوللە، وەڵامی جدی و ئاسوودەییی زستان.',
    page([]), page(['playful'], [cue('وەرە یاری بکەین', 'excited')]), page([], [cue('کاتی کارکردن')]), page([]), page([])),
  'story-lion-mouse': plan('شێری خەوتوو لە خەو ڕادەچڵەکێت؛ داوای مشک، گرفتاری، ڕزگارکردن و سوپاس.',
    page(['sleepy drowsy voice']), page([]),
    page([], [cue('ڕۆژێک دێت یارمەتیت دەدەم!', 'pause')]),
    page([], [cue('هاواری کرد.', 'sharp exhale')]), page(['excited']), page([])),

  'personal-garden': plan('ناسینی دار و گوڵ، پاشان شادیی گەشەیان بە باران.', page([]), page([]), page(['playful'])),
  'personal-animals': plan('ماڵێکی هێمن و پشیلەیەکی سەیرکەر؛ کۆتایییەکی یارییانە.', page([]), page([]), page(['playful'])),
  'personal-night': plan('یاریی ڕۆژ، ئارامیی شەو و شەوباشییەکی نەرم.', page(['playful']), page([]), page(['sleepy drowsy voice'])),
  'read-دار': plan('مەشقی خوێندنەوە؛ دەنگی ڕوون و نەرم بۆ ناسینی دار.', page([])),
  'read-نان': plan('مەشقی خوێندنەوە؛ دەنگی ڕوون و نەرم بۆ ناسینی نان.', page([])),
  'read-گوڵ': plan('مەشقی خوێندنەوە؛ نەرم و دۆستانە بۆ ناسینی گوڵ.', page([])),
  'read-ماسی': plan('مەشقی خوێندنەوە؛ دەنگی ڕوون بۆ ناسینی ماسی.', page([])),
  'read-باران': plan('مەشقی خوێندنەوە؛ خۆشییەکی سووک بە باران.', page(['playful'])),
  'read-خۆر': plan('مەشقی خوێندنەوە؛ شادیی هاتنی ڕووناکی.', page(['playful'])),
  'read-مانگ': plan('مەشقی خوێندنەوە؛ هێمنیی شەو و مانگ.', page([])),
};

// The final page in these mini stories is an isolated letter exercise.
// Keep it clear even when the preceding scene is lively.
const mini = (noteKu: string, first?: AudioTag, second?: AudioTag, third?: AudioTag): StoryDirection =>
  plan(noteKu, page(first ? [first] : []), page(second ? [second] : []), page(third ? [third] : []), page([]));
const miniStories: Record<string, StoryDirection> = {
  dal: mini('بینینی دار و سڵاوکردنی دارا؛ سەرسوڕمانێکی نەرم و شادیی دیدار.', 'playful', undefined, 'playful'),
  ra: mini('باران و سەیرکردنی دار لە ژێر باران؛ هێمنی و سەرنج.', undefined, undefined, undefined),
  alif: mini('کردنەوە و هاوبەشکردنی هەنار؛ گێڕانەوەی گەرم و دۆستانە.', undefined, 'playful', undefined),
  waw_kurt: mini('وێنەی وشتر و ورچ؛ دۆزینەوە، سەیرکردن و پیشاندانی بە هاوڕێ.', 'playful', undefined, 'excited'),
  sar_e: mini('کردنەوەی پەردە، بینینی پەپوولە و بانگکردنی بە خۆشی.', undefined, 'playful', 'excited'),
  wwaw: mini('ناسینی دوو بووکی سوور و یاری لەگەڵیان؛ گەرم و یارییانە.', undefined, 'playful', 'playful'),
  za: mini('زەنگی زەرد؛ ناساندن، لێدان و چێژ لە دەنگە خۆشەکە.', undefined, 'playful', 'excited'),
  ba: mini('سەیرکردنی بەفری سپی و بانگهێشتی باوک بۆ دەرەوە.', undefined, undefined, 'playful'),
  hamza: mini('ئاسک ئاوی پاک دەخواتەوە؛ سەیرکردن لە دوورەوە بە هێمنی.', undefined, undefined, 'whispering'),
  rra_heavy: mini('ڕێگای باخچە و دۆزینەوەی گوڵ؛ لە گێڕانەوەی نەرمەوە بۆ خۆشی.', undefined, 'playful', 'excited'),
  mim: mini('ماسیی بچووک و بانگکردنی مامە بۆ بینینی؛ سەرنج و خۆشی.', 'playful', undefined, 'excited'),
  noon: mini('دابەشکردنی نانی گەرم لەگەڵ نینا؛ نەرم و میهرەبان.', undefined, undefined, undefined),
  e_drej: mini('شێر لە ژێر داری سێو؛ بینین و سەیرکردن بە سەرنج.', undefined, 'playful', undefined),
  ta: mini('تۆپدانی تارا و توانا؛ جووڵە و شادیی یاریی هاوبەش.', 'playful', 'excited', 'playful'),
  ya_kurt: mini('یارمەتیی یاسەمین بۆ یارەکەی؛ شادی و میهرەبانی.', 'playful', undefined, 'excited'),
  sin: mini('سێ سێوی سوور و دابەشکردنیان؛ ژماردنی ڕوون و کۆتاییی گەرم.', undefined, 'playful', undefined),
  shin: mini('کێشانی شێرێکی شین و پیشاندانی وێنەکە؛ شادیی داهێنان.', undefined, 'playful', 'excited'),
  pa: mini('بینینی پەپوولە، نیشتنەوەی لەسەر گوڵ و بانگکردنی پوورە.', 'playful', undefined, 'excited'),
  lam: mini('هاوبەشکردنی لیمۆ و دانانی لەسەر مێز؛ گێڕانەوەی گەرم.', undefined, undefined, undefined),
  lla_heavy: mini('گەشانەوە و بۆنی گوڵ؛ هێمنی و دڵخۆشیی گشتی.', undefined, undefined, 'playful'),
  kaf: mini('کردنەوەی کتێب و دۆزینەوەی وێنەی کەروێشک؛ حەزی دۆزینەوە.', undefined, 'playful', 'excited'),
  gaf: mini('بینینی گوڵی گەورە، سەیرکردن و ستایشکردنی جوانییەکەی.', 'playful', undefined, 'excited'),
  o_drej: mini('کردنەوە و هاوبەشکردنی مۆز؛ دۆستانە و میهرەبان.', undefined, 'playful', undefined),
  jim: mini('جلێکی جوان و پیشاندانی بە جودی؛ شادی و شانازیی منداڵانە.', undefined, 'playful', 'excited'),
  chim: mini('چۆلەکە لەسەر چڵ؛ سەیرکردن بە هێمنی و ستایشی جوانی.', 'playful', undefined, undefined),
  kha: mini('خەرگۆشی سپی خەیار دەخوات؛ سەرنج و خۆشییەکی نەرم.', 'playful', undefined, undefined),
  ha_hezi: mini('حەوت گوڵی حەوشە و ئاودانیان؛ ژماردن و چاودێریی دڵسۆزانە.', undefined, 'playful', undefined),
  zha: mini('ژماردن و ڕێکخستنی بووکەکان لە ژوور؛ گێڕانەوەی دۆستانە.', undefined, 'playful', undefined),
  fa: mini('وێنەی فیل و لووتی درێژی؛ سەرسوڕمانێکی یارییانە و پیشاندانی بە هاوڕێ.', 'playful', 'playful', 'excited'),
  va: mini('دانانی گوڵ لە ڤازە؛ هێمنی و چێژ لە ڕازاندنەوە.', undefined, 'playful', undefined),
  qaf: mini('کێشانی قەلا بە قەلەم؛ سەرنج، شادیی داهێنان و ڕێکخستن.', undefined, 'playful', undefined),
  ghayn: mini('غونچە دەبێتە گوڵ؛ سەرنج، چاوەڕوانی و سەرسوڕمانی ڕۆژی دواتر.', undefined, undefined, 'excited'),
  ayn: mini('دۆزینەوەی عەینەک، گەڕاندنەوە و سوپاسی عومەر؛ گەرم و میهرەبان.', 'playful', undefined, undefined),
  ha_hawa: mini('هانا هەنار لەگەڵ هێمن دابەش دەکات؛ میهرەبانی و هاوڕێیەتی.', undefined, undefined, 'playful'),
};
for (const [letterId, direction] of Object.entries(miniStories)) {
  storyNarration[`letter-story-${letterId}`] = direction;
}

export function applyNarrationDirection(text: string, direction: PageDirection): string {
  const insertions = new Map<number, AudioTag[]>([[0, [...direction.tags]]]);
  // Playback adds measured silence
  // between these sentences rather than relying on the model to time a tag.
  for (const boundary of text.matchAll(/[.!?؟؛](?:[ \t]+|\n+)|\n+/g)) {
    const index = boundary.index! + boundary[0].length;
    if (text.slice(index).trim()) insertions.set(index, ['pause']);
  }
  for (const item of direction.cues || []) {
    const index = text.indexOf(item.before);
    if (index < 0) continue; // A changed text remains readable; coverage tests flag stale cues.
    insertions.set(index, [...(insertions.get(index) || []), ...item.tags]);
  }
  let narrated = text;
  for (const [index, tags] of [...insertions].sort((a, b) => b[0] - a[0])) {
    if (!tags.length) continue;
    narrated = narrated.slice(0, index) + [...new Set(tags)].map(tag => `[${tag}]`).join(' ') + ' ' + narrated.slice(index);
  }
  return narrated;
}

export function getStoryNarration(storyId: string, pageNumber: number, text: string): string {
  const direction = storyNarration[storyId]?.pages[pageNumber - 1];
  return direction ? applyNarrationDirection(text, direction) : text;
}
