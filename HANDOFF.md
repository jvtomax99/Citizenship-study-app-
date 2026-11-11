# HANDOFF (written 2026-11-11, after Step 3 was built)

## Goal and exact next step

Build the citizenship study app (SPEC.md). Phases 1 to 3 are built; Jose tried Phase 3
on his phone at the test link and said to move on (2026-11-11). **Next: Phase 4, the
mock interview** (the officer reads questions aloud in random order; answer by voice
where the phone allows it, typing otherwise; show the accepted answers; score it; stop
at 12 right or 9 wrong; a 65/20 mode with 10 asked and 6 to pass). It is a big feature:
look at 2 or 3 similar tools, then plan mode, wait for Jose's OK, then build. The sample
screen `preview/sample-drill.html` already shows the mock interview's look (answer
field, microphone, the row of 12 stars, the right and wrong sheets).

Also due: the cleanup check. Phase 3 was checked off and `docs/CLEANUP.md` does not
exist, so offer `docs/cleanup-audit.md` with buttons (Run it now, Next session, Skip).

## Done (branch `claude/relaxed-mccarthy-sqi1n0`, pushed, nothing live, no `main` yet)

- Phases 1 and 2 as before (data files, DESIGN.md, the pictures).
- Phase 3: `index.html`, `css/app.css`, `js/` (app, data, store, srs, speak, ui, home,
  place, study, drill), `sw.js`, `manifest.webmanifest`, `assets/fonts/`, `assets/icons/`.
  Proof: `node --test tests/*.mjs` (the schedule) and `node tools/shots.mjs` (taps
  through everything, light and dark, offline too; needs `python3 -m http.server 8123`).

## Left open, waiting on Jose

- Test link: https://citizenship-study-test.vercel.app (Vercel project
  `citizenship-study-test`, team Language Services, deployed from this branch, hidden
  from search engines). It does NOT update by itself: after new work, deploy the branch
  again with the Vercel tools (git source, target production). About 1 MB per upload;
  Jose's Deployment Storage was 7.5 of 10 GB, all from Interp's uploads.
- Show the plan to one of the family and friends (the app is for them).
- Read the Spanish (shown in the app with a "borrador" mark); the 20 marked 65/20 first.
- SPEC.md TO FILL: who the family and friends are, the app's name (working name on the
  icon: "Citizenship Study", in `index.html` and `manifest.webmanifest`), "Not in v1" OK.
- Confirm the four federal names at uscis.gov/citizenship/testupdates (Jose opens it).
  Recheck Booker's seat and NY's governor in January 2027.
- Confirm his Runway plan allows the pictures on a public website (CREDITS.md).
- Small flaw: the monument's tip shows through the progress bar.

## This session's decisions (all in SPEC.md)

Drill = say it out loud, show answers, then I knew it / I guessed / I missed it.
Explanations on cards moved to "Later". Vercel test link made (Jose OK'd it after
seeing his Usage tab).
Added without being asked, small: a Home switch between all 128 and the 65/20 list.

## Files to look at first

SPEC.md, docs/ARCHITECTURE.md, DESIGN.md, js/srs.js, js/data.js, tools/shots.mjs.

## Also pushed in the other two repos (same branch name, not yet in their `main`)

One CLAUDE.md commit each in Interp and CPA-study-app: the two new rules (always
buttons, all links in one block). Each needs a pull request and Jose's "push".
