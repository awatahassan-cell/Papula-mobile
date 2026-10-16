# Unified learning experience

The application now uses one appearance. Existing `classic` and `garden` settings both resolve to the same design; stored child profiles and earned mastery are preserved.

The alphabet retains its original teaching order. One unfinished letter is available at a time. Completed lessons remain available for review. Older earned letters remain available even if earlier lessons are unfinished.

A lesson opens the next letter after all of the following are recorded:

- Listening to the letter introduction through its actual completion callback.
- Correctly recognizing a contextual letter form.
- Seeing all three distinct example words.
- Identifying the letter in all three distinct examples.
- Passing the tracing stage of writing.

Lesson completion earns two stars once and opens the next letter immediately, including on the same day. This is separate from independent handwriting mastery, which still requires successful copying and independent writing on two distinct days. Returning to a partial lesson resumes its first unfinished step.

Images no longer form the page background or a stretched sign behind headings. The mascot scales with the viewport; story illustrations occupy square containers that determine their display size. The learning path uses text, icons and flexible layout rather than a fixed bitmap.

Validation includes unit tests for progress, duplicate actions, persistence, migration and layout geometry. Browser checks cover 320, 390, 768 and 1024 CSS pixels. A browser walkthrough completed listening, form recognition, all three examples and tracing of د, then verified that ر opened and remained available with the progress saved.

## Syllables, review reminders and hard letters

- **Syllable builder** (Games → «بڕگەکان»): the child hears a whole word and puts its syllables in order. Words come from `src/data/syllableWords.ts`; every entry must join back into the word and exist in the narrated vocabulary (`tests/syllables.test.cjs`). Maximum syllables follow the age group or placement result (3–4: 2, 5–6: 3, 7–8: 4). Syllables themselves are not narrated yet; recording them needs a new offline-audio generation run.
- **Review reminder**: `dueReviewLetters` counts letters whose spaced-review date has arrived (or that were missed last time); Home shows a banner that opens daily practice.
- **Parent report**: `hardLetters` lists letters with at least 2 errors in 3 attempts, with the similar letters they are mixed up with.

## Handwriting assessment (letters, words, sentences)

A letter is no longer judged by the stroke path alone. `assessWriting` builds a six-part rubric (`src/services/writingRubric.ts`) and shows it after every attempt, with a side-by-side picture of the model, the child's writing and anything missing (dashed red):

| Criterion | What is checked |
| --- | --- |
| شێوەی پیت | Path similarity to the font model (DTW + Hausdorff, as before) |
| هێڵ و خاڵەکان | Every part and dot written, dots in the right place, no duplicate or misplaced dot. Dots are also counted directly, because free-writing alignment would otherwise stretch the body over a missing dot |
| ڕێکی دەست | Extra turning along the strokes compared with the model (tremor) |
| قەبارە | Size of the writing compared with the model, before alignment |
| ئاراستە و ڕیز | Main stroke direction (right-to-left or top-to-bottom) and body-before-dots order. Advisory: it lowers the score and shows a tip but cannot fail a letter by itself, because some font centrelines are not natural pen paths |
| پاکی نووسین | Extra ink and strokes away from the letter |

Three stars (mastery) need the shape check, every part present, no misplaced or duplicate dots, adequate size and tidiness, and an overall score of 75 or more. The thresholds and the tremor tolerance are heuristics and should be tuned with real children's handwriting.

Word and sentence writing (`/word-writing`): the child writes a word, or a two-word sentence, one letter at a time. Each letter is checked with the same rubric and must pass before the next one opens; a miss feeds the spaced-review queue. Words are offered only when all their letters are known (lesson finished or tracing passed). Tips are screen text only; they have no recorded narration.

## Appearance: day, night and three palettes

Parents choose the look in **Parent dashboard → ڕەنگەکان**:

- **Mode:** ڕۆژ (day, soft "cloud" look), شەو (night, dark starry look) or خۆکار (night from 19:00 to 06:00, evaluated whenever a screen renders).
- **Palette:** three colour families, each with a day and a night version — هەوری بنەوشەیی (`cloud`, default), دەریا (`lagoon`) and گوڵی ئاڵ (`blossom`).

Older saved names migrate: garden/classic/lavender → cloud, sky → lagoon, rose/sunset → blossom. Unknown values fall back to cloud / auto. Child progress is never touched.

How it works: style sheets keep their original colours; `resolveAppearanceStyles` (src/theme/appearance.ts) replaces them with the chosen palette and applies the shape language — large 30 px cards with a hairline edge and a soft coloured shadow, 28 px buttons with a glow, no chunky bottom borders. The writing sheet stays light in every mode so pen colours and guides keep their contrast. In night mode pale feedback tints (correct / retry) become deep tints.

Motion (`src/components/Motion.tsx`): a slow "breathing" pulse on the main call to action, content that rises in when the home screen appears, a spring squish on every `BigButton`, and the floating mascot. All of it stops when the device asks for reduced motion.
