# Agent runbook: recording every word on its own, and the letter-intro sentence

Audience: a coding agent (or a person) with the owner's permission and an ElevenLabs key.
Goal: after this run, in the Papula app

1. every picture word (and every other single word) plays from **its own recording** — never a 0.1–0.5 s slice of a long batch;
2. the first screen of a letter says **«پیتی (X) لەم وشانەدا هەیە. جوان گوێ بگرە و بیناسەوە.»** with the letter name as the only changing part, then reads each of the five words slowly and separately.

Today (checked 2026-11-26) the code is ready but the audio is not: `manifest.json` has 0 standalone records, ~1141 words are still slices,
and the sentence «لەم وشانەدا هەیە. جوان گوێ بگرە و بیناسەوە.» has no recording.

## Rules (read first)

- **Never ask for, print, log, commit or paste the API key.** Use `ELEVENLABS_API_KEY` in the environment or `.env.local` (git-ignored). If there is no key, stop and tell the owner; do not use `request_credential` again if the owner already declined it.
- **Spend nothing before the preview and a yes.** Run the preview, report the numbers, and wait for the owner's approval of the cost (see step 2). A run asked for by the owner in this task counts as approval only if they said so for the amount shown.
- **Do not regenerate recordings that already exist and are fine.** Re-running resumes; completed batches are not bought again.
- Keep the voice and model in the manifest (`tkI70vi7ETrk5NakcLUP`, `eleven_v4`). Do not switch voice.
- Reply to the owner in Kurdish (Sorani). Code, commits and this file stay in English.

## Step 1 — preview (free)

```sh
cd Papula-mobile
git fetch --all && git merge origin/main        # start from the latest main
node scripts/generate-offline-audio.cjs --standalone-all-words
```

Expected, roughly: `requests ≈ 1227`, `characters ≈ 15370`. If the numbers are far larger, stop and find out why (a changed catalog?).
`--standalone-all-words` makes every single word its own request. Flags that exist:

| flag | meaning |
| --- | --- |
| `--standalone-all-words` | every single word on its own (what this task needs) |
| `--standalone-words` | only the lesson example words |
| `--standalone-all` | words **and** sentences each on their own (not wanted: sentences may stay in batches) |
| `--category=letter` etc. | limit to one category |
| `--required-only` | skip optional texts |

## Step 2 — ask for the cost

Tell the owner (Kurdish): how many requests, how many characters (≈ 15.4k), and that the key is read from `.env.local`.
Check the ElevenLabs balance the script prints (it checks credits before generating). If credits are short, run in parts with `--category=` and say which are left.

## Step 3 — generate

```sh
node scripts/generate-offline-audio.cjs --standalone-all-words --generate
```

- Every paid response is saved before it is mapped; if it stops (network, credits), run the same command again — it resumes.
- Do not interrupt it with `kill -9`; let it finish the current batch.
- To rehearse the whole flow without credits, point `ELEVENLABS_API_URL` at a mock server and use a throw-away git worktree (done once before; the mock must return mp3 bytes and `/with-timestamps` alignment). Never leave mock audio in the real tree.

## Step 4 — finalize and check

```sh
node scripts/generate-offline-audio.cjs --finalize     # writes src/data/offlineAudio.ts
node -e "const m=require('./assets/audio/papula-v2/manifest.json');const v=Array.isArray(m.records)?m.records:Object.values(m.records);console.log('standalone',v.filter(r=>r.standalone).length,'of',v.length)"
npm run test:audio
npx tsc --noEmit        # two known errors in InAppUpdateModal / useAppStore are not yours
npx eslint src          # 15 pre-existing warnings
node --test tests/*.cjs
```

Pass criteria:
- the standalone count is about the number of single words (≥ 1100) and `--standalone-all-words` now prints `requests: 0`;
- `PENDING_NEW_TEXTS` / `PENDING_RERECORD` in `tests/offlineAudio.test.cjs` no longer need the texts you just recorded — remove those that are now recorded (keep the test strict);
- the sentence «لەم وشانەدا هەیە. جوان گوێ بگرە و بیناسەوە.» is in the pack (`grep -c "لەم وشانەدا هەیە" src/data/offlineAudio.ts` ≥ 1).

## Step 5 — listen before you commit (needs a person)

An agent cannot hear. Ask the owner to listen to, in the app or in the review page:
- first screen of letter «د»: "پیتی د" → the sentence → دار، دڵ، دەست، دەرگا، پەردە, each slow and separate;
- tap any word: it plays alone, with no neighbouring syllables;
- a word inside a sentence (e.g. «دار بدۆزەوە و دەستی لێ بدە.») still sounds natural.
If a word is wrong, fix its spelling/pronunciation in the catalog and re-record **only that text** (`--only`-style: delete its file entry and re-run, never `--force` the whole pack).

## Step 6 — commit and push

- Commit the new `assets/audio/papula-v2/*.mp3`, `manifest.json` and `src/data/offlineAudio.ts` together.
- Trailers: `Co-Authored-By: <model> <noreply@anthropic.com>` and the `Claude-Session:` URL given for the session.
- Push to **both** `ccr-e487bf5d-hx0gbg` and `main`, after `git fetch --all` and merging `origin/main`.
- No pull request unless the owner asks.
- Size: the pack grows (about 1,100 small files). Run `git count-objects -vH`; mention the size to the owner. The bundled audio must keep the app under the store limit.

## Step 7 — refresh the review page

```sh
node scripts/build-voice-review.cjs
```
then republish `app-voice-review-live.html` to the existing artifact (same `file_path` and `url`), so the owner sees the new «ڕێکخراو» marks.

## Known pitfalls

- Letter names are read by `speakLetter`; the word «پیتی» keeps its teaching pause. Do not turn the intro into one long sentence recording: the letter name must stay separate so it can change.
- Dynamic sentences (`src/services/dynamicSentences.ts`) are split into fixed recordings plus the changing word/letter. A new templated sentence must be added there, not recorded as a whole.
- The slice-based fallback (`derived`) still exists for words the owner did not ask to re-record; the standalone entry must win when both exist. `tests/offlineAudio.test.cjs` checks coverage.
- If a word has no recording after the run, the app skips it silently in the intro; list such words for the owner instead of hiding them.

## Report to the owner (Kurdish, short)

1. how many recordings were made and how many characters were used;
2. standalone count before → after, and tests/tsc/lint result;
3. what only a person can check (listening, step 5);
4. the commit hash on both branches.

## Found 2026-11-26: shared words were skipped

A word that is in two lists (e.g. «دار» is a picture word and a lesson prompt) is stored under the *other* category in the catalog, so the first
`--standalone-all-words` run left it as a slice of a long recording («دار» played 0–0.32 s of a 5-second writing sentence). The generator now also makes
every single-word entry standalone. `tests/offlineAudio.test.cjs` lists the words still waiting (`PENDING_STANDALONE`, 26 requests / 169 characters):
run `--standalone-all-words --generate` then `--finalize`, then empty that list.

## Pronunciation hints (2026-11-26)

A bare word is read with the voice's own guesses: «ورچ» came out «وەرچ» and «مریشک» «میریشک». `src/data/pronunciations.ts` (`SPOKEN_AS`) holds the spelling to send to the
voice for such words (currently `ورچ → وِرچ`, `مریشک → مْریشک`: first guesses, an agent cannot hear them). The catalog records the hinted spelling; the app plays the hinted recording
when it exists and the plain one otherwise. After recording, ask the owner to listen; if a word is still wrong, change the hint and record that word again.
The question «کام پیت وون بووە؟» is written with «وون» (the old «ون» was read «ڤون»).
