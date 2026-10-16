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
