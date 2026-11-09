# Walking the whole app

`scripts/e2e-all-letters.cjs` plays the web build the way a small child would, letter after letter, and writes a report.

```bash
npx expo export --platform web --output-dir dist-e2e   # once, about 2 minutes
npm run e2e                                            # every letter (about 1 minute each)
npm run e2e -- --letters=3                             # a quick check
npm run e2e -- --headed --slow=300                     # watch it in a browser window
npm run e2e -- --phone=360x740                         # another screen size
```

What it does for every letter: opens the letter, answers the three rounds (it tries each answer until the right one is accepted),
passes the listening check, plants the flower, looks at the garden and counts the flowers. The app opens one letter a day, so the walk moves
its own clock forward a day per letter. At the end it visits the tabs once more (games, path, stories, garden, album).

The report is `e2e-report/report.html` (with screenshots), plus `report.md`. The exit code is 1 if a letter did not finish.

What it cannot do: hear the sound, write with a finger, or judge whether a screen is nice. Those still need a person and a phone.
