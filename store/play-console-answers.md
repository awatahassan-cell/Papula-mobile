# وەڵامەکانی Google Play Console (پەپوولە)

ئەم فایلە وەڵامی ئەو فۆڕمانەیە کە Play Console داوا دەکات. وەڵامەکان لەگەڵ ئەپەکە بەراورد کراون (کۆد، `app.json`، و ئەو پڕۆگرامانەی بەکار هاتوون). **پێش ناردن، تکایە جارێکی تر ڕاستییان بپشکنە.**

## ١. زانیاری سەرەکی

| شت | وەڵام |
|---|---|
| ناوی ئەپ | پەپوولە: ئەلفوبێی کوردی / Papula: Kurdish for Kids |
| پاکێج | `com.papula.kids` |
| جۆر | App (نەک Game) |
| پۆل (Category) | Education |
| بێ پارە یان پارەدار | Free (بێ پارە) |
| پەرەپێدەر | Awata Hassan |
| ئیمەیڵی پەیوەندی | support@papulakids.com |
| ماڵپەڕ | https://papulakids.com |
| سیاسەتی تایبەتمەندی | https://papulakids.com/privacy |

## ٢. App content

- **Privacy policy:** لینکی سەرەوە (دەبێت بە بێ چوونە ژوورەوە بکرێتەوە).
- **Ads:** No, my app does not contain ads.
- **App access:** All functionality is available without special access (بێ لۆگین).
- **Government app:** No.
- **Financial features:** My app doesn't provide any financial features.
- **Health:** My app does not have any health features.
- **News app:** No.
- **COVID-19 contact tracing/status:** No.
- **Advertising ID:** My app does not use advertising ID. (دەبێت وەڵامی No بێت؛ ئەپەکە هیچ ڕیکلامی نییە.)

## ٣. Content rating (IARC)

- Category: **Reference, News, or Educational** (یان Utility/Productivity ئەگەر Educational نەبوو؛ Educational باشترە).
- Violence: No. Blood: No. Sexual content/nudity: No. Language (profanity): No.
- Controlled substances (drugs, alcohol, tobacco): No. Gambling: No (هیچ پارەیەک یان خەڵاتی ڕاستەقینە نییە).
- Users can interact/share content/location: **No** (هیچ چات، ئەکاونت، یان بەشداری نییە).
- Digital purchases: **No**.
- ئەنجامی چاوەڕوانکراو: Everyone / PEGI 3 / USK 0.

## ٤. Target audience and content

- Target age groups: **5 and under** و **6-8**. (٩-١٢ دامەنێ، چونکە ئەپەکە بۆ منداڵی بچووکە؛ ئەگەر ئەمەش هەڵبژێریت، سیاسەتی Families زیاتر لەسەرت دەبێت.)
- Does the app appeal to children? **Yes.**
- بەشداری لە Designed for Families: **Yes.**
- ڕیکلام: نییە. ئەپەکە هیچ SDKیەکی ڕیکلام، شوێنپێهەڵگر (analytics) یان کۆکردنەوەی ناسنامە (identifiers) نییە.
- ناوەڕۆک: بۆ منداڵ گونجاوە، هیچ لینکی دەرەکی یان وێبڤیو نییە.
- بەشی دایک و باوک بە پرسیارێکی بیرکاری (parental gate) پارێزراوە.

## ٥. Data safety

ئەپەکە هیچ داتایەک **نانێرێتە دەرەوەی ئامێر**. بەپێی پێناسەی گووگڵ، داتایەک کە تەنها لەسەر ئامێرەکە بمێنێتەوە «کۆکراوەتەوە» (collected) ناژمێردرێت.

| پرسیار | وەڵام |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | (نیشان نادرێت ئەگەر وەڵامی سەرەوە No بێت) |
| Do you provide a way for users to request that their data is deleted? | (نیشان نادرێت؛ لە سیاسەتەکەدا ڕوون کراوەتەوە: سڕینەوەی داتای ئەپ یان ئەپەکە) |

بۆ دڵنیایی، ئەمانە لە ئەپەکەدا هەن و تەنها لەسەر ئامێر دەمێننەوە:
- ناوی منداڵ (کە دایک و باوک دەینووسێت) و ئاژەڵی هەڵبژێردراو، ئەستێرە، پیتە فێربووەکان و ڕێکخستنەکان. بە `AsyncStorage` لەسەر ئامێر.
- تۆمارەکانی دەنگی خوێندنەوەی چیرۆک (ئەگەر منداڵ تۆماری بکات). فایلەکان لە بیرگەی تایبەتی ئەپەکە دەمێنن و بۆ هیچ شوێنێک نانێردرێن.

## Permissions

| Permission | بۆ چی |
|---|---|
| `RECORD_AUDIO` | تۆمارکردنی دەنگی منداڵ لە کاتی «خۆم دەخوێنمەوە»، بۆ ئەوەی دوای تۆمارکردن گوێی لێ بگرێت. فایلەکە تەنها لەسەر ئامێرەکە دەمێنێتەوە. |
| `MODIFY_AUDIO_SETTINGS` | کۆنتڕۆڵی دەنگ لەکاتی لێدان و تۆماردا. |

لە Play Console، ئەگەر پرسی «Permissions declaration»ی دەنگی نەبوو، پێویست ناکات؛ مایکرۆفۆن مەترسیدار نییە بۆ فۆڕمی تایبەت.

## پێش بڵاوکردن (Checklist)

1. **ئەکاونتی پەرەپێدەر:** ئەگەر ئەکاونتی کەسی (Personal) نوێ بێت (دوای ٢٠٢٣)، دەبێت **تاقیکردنەوەی داخراو (Closed testing)** بکەیت: لانیکەم **١٢ تاقیکەر** و **١٤ ڕۆژ** بەردەوام. پاشان داوای Production بکە.
2. **بنیاتنان:** `npx eas-cli@latest build --platform android --profile production` (فایلی `.aab` دروست دەکات). `versionCode` خۆکارانە زیاد دەبێت.
3. **واژۆ (signing):** EAS خۆی کلیلەکە دەگرێت. با Play App Signing چالاک بێت.
4. **لیستی ئەپ:** دەقەکان لە `google-play-listing.html`، وێنەکان لە `store/screenshots/`.
5. **سیاسەتی تایبەتمەندی:** وێبسایتەکە بڵاو بکەرەوە (`docs/`) و لینکەکە بدە.
6. **پارەدان:** کارتی «پەپوولە پڵەس» لە بەشی دایک و باوک شاردراوەتەوە (`PAID_PLANS_ENABLED = false`)، چونکە پارەدانی ساختە لە Play سیاسەتی (Deceptive behavior) دەشکێنێت. ئەگەر دواتر پارەدانی ڕاستەقینە زیاد کرد، Play Billing بەکار بهێنە و ئەم ئاڵایە ڕاست بکە.
7. **تاقیکردنەوە لەسەر ئامێری ڕاستەقینە:** دەنگ، مایکرۆفۆن و بەشی دایک و باوک.
8. **دەنگی تۆمارنەکراو:** دوو ڕستە هێشتا تۆمار نەکراون (سەیری `app-voice-review.html` بکە). ئەمە ڕێگر نییە، بەڵام باشترە پێش بڵاوکردن تۆمار بکرێن.
9. **وێنەی ئێستا:** وێنەکان ٣٨٤ پیکسەلن؛ لە تابلێتی گەورە کەمێک نەرم دەردەکەون.

## وێنە و ئایکۆن

- ئایکۆن: `store/screenshots/icon-512.png` (٥١٢×٥١٢ PNG).
- Feature graphic: `store/screenshots/{ku,en}/feature-graphic.png` (١٠٢٤×٥٠٠).
- سکرین شۆتی مۆبایل: `store/screenshots/{ku,en}/phone-01..08.png` (١٠٨٠×١٩٢٠). Play دەبێت لانیکەم ٢ بێت و زۆرترین ٨.
- تابلێت (٧ و ١٠ ئینچ): ئارەزوومەندانەیە؛ ئەگەر ئەپەکەت بۆ تابلێتیش دەویست، وێنەی جیاواز دروست دەکەین.
