# Papula offline narration

The installed Android/iOS app uses fresh ElevenLabs recordings of Papula
(`tkI70vi7ETrk5NakcLUP`, `eleven_v4`) from `assets/audio/papula-v2/`.
`src/data/offlineAudio.ts` contains static Metro imports, so these MP3s ship
inside the app. Playback needs neither an API key nor a first online listen.
The previous recordings and the other voices are excluded from playback and
from the active import graph. Existing files are retained as an archive.

The pack covers letter names, example words, word-building units, stickers,
lesson prompts, writing instructions/feedback, every current story sentence,
and words tapped in those stories. Repeated words share measured segments of
the **new** recordings. Native and browser players seek to exact segment
boundaries; stored word timings drive story highlighting. Letter sounds have
their own recordings and keep the teaching pause after “پیتی”.

Dynamic lesson prompts and writing-mastery praise use short recorded sequences
with the appropriate recorded word/letter. Missing assets report a playback
error instead of silently using a device voice or a network request.

## Generation and verification

```sh
node scripts/offline-audio-catalog.cjs
node scripts/generate-offline-audio.cjs
node scripts/generate-offline-audio.cjs --generate
npm run test:audio
npx tsc --noEmit
npx expo lint
```

The first two commands are local previews and spend no credits. Generation
uses `ELEVENLABS_API_KEY` from the process environment or `.env.local` (with
support for the existing legacy environment variable). It checks the remaining
credits before generating and persists every paid response before mapping its
timestamps. Re-running resumes this recording set without purchasing completed
batches again. After another voice retraining, use a new versioned output
directory and regenerate the whole pack rather than reusing this manifest.

The `manifest.json` records the generation date, voice, audio hashes, boundaries
and completion marker. `*.alignment.json` files retain the provider response
metadata for repairs; only statically imported MP3s enter the app bundle.

Native offline playback should also be checked in an installed build with
airplane mode enabled. A website still needs its files loaded or cached by the
browser; exporting web files alone does not install a complete offline website.

## Optional narration: syllables and handwriting tips

The syllable game (🔊 on every syllable tile and «گوێ لە بڕگەکان بگرە») and the handwriting review («ڕێنماییەکە ببیستە») play **recorded** audio only. They need no network: the MP3s ship in the app like the rest of the pack.

- `src/data/narratedExtras.ts` lists every syllable (`src/data/syllableWords.ts`) and every sentence the writing rubric can say (`RUBRIC_SENTENCES` in `src/services/writingRubric.ts`). The catalog flags them `optional` (categories `syllable`, `tip`).
- Until they are generated, the app hides the 🔊 buttons (`soundService.canSpeak` checks the bundled pack). Nothing breaks, and `npm run test:audio` does not require them.
- To record them (about 59 requests, ≈ 850 characters), run with a valid key:

  ```sh
  node scripts/generate-offline-audio.cjs             # preview: requests and characters, no credits spent
  ELEVENLABS_API_KEY=... node scripts/generate-offline-audio.cjs --generate
  npm run test:audio && npx tsc --noEmit && npx expo lint
  ```

  The generator only requests batches that are not yet in `manifest.records`; optional entries are queued last, so no earlier batch changes (`tests/optionalAudio.test.cjs` enforces this). Syllables are requested one at a time so they are read as a bare sound.
- Listen to the new syllables before shipping: a bare two-letter string can be read as a letter name or a word. Replace any that sound wrong by changing its text in `narratedExtras` (or spelling it with a vowel mark) and regenerating.
- When you change a rubric sentence or syllable, regenerate; the old recording is simply not found and the button disappears until then.
