# HANDOFF (written 2026-11-11, after Step 5 was built)

## Goal and exact next step

Build the citizenship study app (SPEC.md). Steps 1 to 5 are built; **Steps 4 and 5 both
wait on Jose** and neither is checked off.
- Step 5 (the National Mall, daily goal, forgiving streak) was built 2026-11-11, reviewed
  and put on the test link. Next: Jose looks at it on his phone. If he is happy, check
  off Step 5 in SPEC.md; then the cleanup check (docs/CLEANUP.md, "Last audit").
- Step 4 (mock interview): Jose said "test this much later". Still owed: one interview by
  voice in the browser and one from the Home Screen icon. If it fails in the installed
  app, confirm the "This phone cannot listen here" wording in `js/mock.js`.
- Then Step 6 (backup, user guide, first release to GitHub Pages).
- Not done from the Step 5 review, small: "Study cards" opened from a landmark goes back
  to the sections list, not the Mall; a drill round left open overnight treats a
  returning question as a retry.

## Done (branch `claude/relaxed-mccarthy-sqi1n0`, pushed, nothing live, no `main` yet)

- Steps 1 to 3 as before.
- Step 5: `js/progress.js`, `js/mall.js`, `tests/progress.test.mjs`, Home's Today panel and
  Mall strip, `#/drill/<part>`, eight pictures in `assets/images/landmarks/` (200 Runway
  credits, 1,270 left). Jose's choices: look B, eight landmarks, honest light, forgiving streak.
- Step 4: `js/mock.js`, `js/match.js`, `js/listen.js`, `tests/match.test.mjs`, the Home
  button, `sw.js` list. Proof: `node --test tests/*.mjs` (16 pass) and
  `node tools/shots.mjs` (needs `python3 -m http.server 8123`).
- The first cleanup audit: `docs/CLEANUP.md`. Jose chose "Clean up the low-risk ones":
  done 2026-11-11 (items 3, 5, 7 to 10, 12 to 14; item 6 skipped, it needs a
  `package.json`). The medium and high items stay: recheck items 1 and 2 (the sample
  screen, the mock styles) now that Step 4 uses them. Also fixed: button labels in dark
  mode took the link color.

## Left open, waiting on Jose

- Test link: https://citizenship-study-test.vercel.app (Vercel project
  `citizenship-study-test`, team `language-services`, deployed from this branch with the
  Vercel tools: git source, target production). It does NOT update by itself.
- Show the app to one of the family and friends.
- Read the Spanish; SPEC.md TO FILL (who, the app's name, "Not in v1").
- Confirm the four federal names at uscis.gov/citizenship/testupdates. Recheck Booker's
  seat and NY's governor in January 2027.
- Confirm his Runway plan allows the pictures on a public website (CREDITS.md).
- Small flaw: the monument's tip shows through the progress bar.

## This session's decisions (all in SPEC.md)

The app checks the answer and one tap overrules it; when unsure it asks. After the
review the checker was made strict: up to three key words must all be there, extra words
or a "not" send it to "Compare your answer". It asks often, by design.

## Files to look at first

SPEC.md, docs/ARCHITECTURE.md, js/match.js, tests/match.test.mjs, js/mock.js, tools/shots.mjs.

## Also pushed in the other two repos (same branch name, not yet in their `main`)

One CLAUDE.md commit each in Interp and CPA-study-app: the two new rules (always
buttons, all links in one block). Each needs a pull request and Jose's "push".
