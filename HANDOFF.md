# HANDOFF (written 2026-11-11, after Step 3 was built)

## Goal and exact next step

Build the citizenship study app (SPEC.md). Phases 1 (question bank) and 2 (look) are
done; **Phase 3 (the app itself) is built and tested in a phone-size browser, not yet
checked off**: Jose has to tap through it. Next step: get Jose's OK on the Step 3
screenshots, bring back the test-link question (Vercel, below), then Phase 4 (mock
interview) with its own plan first.

## Done (branch `claude/relaxed-mccarthy-sqi1n0`, pushed, nothing live, no `main` yet)

- Phases 1 and 2 as before (data files, DESIGN.md, the pictures).
- Phase 3: `index.html`, `css/app.css`, `js/` (app, data, store, srs, speak, ui, home,
  place, study, drill), `sw.js`, `manifest.webmanifest`, `assets/fonts/`, `assets/icons/`.
  Proof: `node --test tests/*.mjs` (the schedule) and `node tools/shots.mjs` (taps
  through everything, light and dark, offline too; needs `python3 -m http.server 8123`).

## Left open, waiting on Jose

- Try Step 3 on a real phone at the test link https://citizenship-study-test.vercel.app
  (Vercel project `citizenship-study-test`, team Language Services, made 2026-11-11 from
  this branch; not listed in search engines). It does NOT update by itself: after new
  work, deploy the branch again with the Vercel tools (target production). Jose's
  Deployment Storage was 7.5 of 10 GB, all from Interp's uploads (100+ in 8 days); this
  app is about 1 MB per upload. The voice and Home Screen install still need his try.
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
