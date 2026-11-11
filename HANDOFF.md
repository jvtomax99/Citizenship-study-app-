# HANDOFF (written 2026-11-11, after Step 4 was built)

## Goal and exact next step

Build the citizenship study app (SPEC.md). Steps 1 to 3 are built. **Step 4, the mock
interview, is built, reviewed and on the test link; it waits on Jose** doing one interview
by voice on his phone, twice: in the browser, and from the Home Screen icon. That answers
the open question: does the microphone work inside the installed app on an iPhone?
- If yes: check off Step 4 in SPEC.md.
- If not in the installed app: `js/mock.js` already says "This phone cannot listen here"
  and suggests Safari; confirm that wording with Jose, then check off Step 4.
- Then Step 5 (the National Mall, daily goal, streak): a big feature, so look at 2 or 3
  similar tools, plan mode, wait for Jose's OK.

## Done (branch `claude/relaxed-mccarthy-sqi1n0`, pushed, nothing live, no `main` yet)

- Steps 1 to 3 as before.
- Step 4: `js/mock.js`, `js/match.js`, `js/listen.js`, `tests/match.test.mjs`, the Home
  button, `sw.js` list. Proof: `node --test tests/*.mjs` (16 pass) and
  `node tools/shots.mjs` (needs `python3 -m http.server 8123`).
- The first cleanup audit: `docs/CLEANUP.md` (14 items, report only). Jose has not yet
  chosen: "Clean up the low-risk ones" (recommended), "Pick individually", "Just keep
  the report". Items 1 and 2 (the sample screen, the mock styles) can be rechecked now
  that Step 4 uses them.

## Left open, waiting on Jose

- Test link: https://citizenship-study-test.vercel.app (Vercel project
  `citizenship-study-test`, team `language-services`, deployed from this branch with the
  Vercel tools: git source, target production). It does NOT update by itself.
- Is anyone in the family 65/20 and taking the test in Spanish? The interview is English
  only for now (SPEC, Later).
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
