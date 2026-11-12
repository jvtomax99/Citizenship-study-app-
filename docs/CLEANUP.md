# Cleanup list

Last audit: 2026-11-11, after phase 3.

Report only: nothing was changed, deleted or moved. Each item says what it is, why it is
not needed, what removing it improves, and the risk of removing it (low, medium, high).
Mark an item "done" when it is cleaned up; the next audit removes done items.

How it was checked: the app has no `package.json` and no installed packages, so
`npx knip` and `npx depcheck` have nothing to scan (not run). Instead every exported
name, every CSS class, every CSS variable and every file was searched for by hand across
`index.html`, `js/`, `css/`, `sw.js`, `manifest.webmanifest`, `tools/` and `tests/`,
including names loaded at runtime (the `FILES` list in `sw.js`, image and font paths,
the `#/` addresses). `node --test tests/*.mjs` passes (8 of 8) as the code stands.

Count: 14 items. Low risk: 10. Medium: 3. High: 1.

## Items

1. **The sample screen has its own full copy of the look.** `preview/sample-drill.html`
   (162 lines, 15 KB) carries a second copy of the styles that are now in `css/app.css`,
   and it loads its fonts from Google instead of the saved files in `assets/fonts/`.
   - Why not needed: it was the screen Jose approved the look from (Phase 2). The real
     app now exists. The look is written down in three places (DESIGN.md, the sample,
     `css/app.css`), and they will drift apart.
   - What removing it improves: one place for the look; no page on the live site that
     calls Google; 15 KB less.
   - Risk: **medium.** HANDOFF.md points Phase 4 at this file as the model for the mock
     interview screen (answer field, microphone, 12 stars, right and wrong sheets).
     Remove it only after Phase 4 is built, and update DESIGN.md line 9, SPEC.md line
     147 and docs/ARCHITECTURE.md line 43, which name it.

2. **Styles for the mock interview, with no screen using them yet.** In `css/app.css`:
   `.mic` (line 75), `.road`, `.stars`, `.st` (lines 77 to 84), `.btn.danger` (line 89),
   `.sheet` and its `up` animation (lines 93 to 103), about 20 lines. No file in `js/`
   or `index.html` uses these names.
   - Why not needed: today nothing shows them. They came over from the sample screen.
   - What removing it improves: a shorter stylesheet where every rule is in use.
   - Risk: **high. Do not remove now.** Phase 4 (the mock interview) is next and DESIGN.md
     describes exactly these pieces. Check this item again after Phase 4: delete whatever
     Phase 4 did not end up using.

3. **The stylesheet is the sample plus a patch block, so several rules are written
   twice.** `css/app.css` has a "beyond the sample" half (from line 107) that corrects
   the first half instead of changing it:
   `.scene` twice (lines 34 and 35); `.who` twice (59 and 61); `.content` bottom padding
   set (39) then set to 0 (190); `.pill-link` height 36px (123) then 44px (208);
   `.es-toggle` finished at 206 and 207; the speaker's ring animation started (64 to 66)
   then paused (169 and 170); `.es .draft,.draft` (171) where `.draft` alone does the
   same; `.title` (126) repeats the font of `.q` (62).
   - Why not needed: the second value always wins, so the first is dead weight.
   - What removing it improves: one rule per thing; changing a size later means one edit,
     not a hunt for the line that overrides it.
   - Risk: **low**, if the screenshots (`node tools/shots.mjs`) are compared before and
     after, light and dark.

4. **A second eagle picture nothing shows.** `assets/images/eagle-officer-full.webp`
   (15 KB). The app, the sample screen, the manifest and `sw.js` only use
   `eagle-officer.webp`. Only CREDITS.md names the full one.
   - Why not needed: no screen shows it and it is not saved for offline use.
   - What removing it improves: one less picture published on the live site.
   - Risk: **medium.** It is the original the app icons were cut from, made with Runway
     credits, so it cannot be made again for free. Better than deleting: keep it, and
     say in CREDITS.md that it is the source picture, not an app file.

5. **Screenshots would land inside the repo.** `tools/shots.mjs` saves to
   `preview/shots` when no folder is given (line 11), and `.gitignore` does not list
   that folder.
   - Why not needed: screenshots are proof sent as files, not part of the app. One
     `git add` would commit about 20 pictures.
   - What fixing it improves: no accidental megabytes in a public repo. Add
     `preview/shots/` to `.gitignore`.
   - Risk: **low.**

6. **The screenshot tool finds Playwright by a fixed path on one machine.**
   `tools/shots.mjs` line 9 falls back to `/opt/node22/lib/node_modules/playwright`,
   and there is no `package.json` listing Playwright.
   - Why not needed: the fixed path only exists in the cloud session. CLAUDE.md asks for
     a package list so one command restores everything.
   - What fixing it improves: the proof script runs anywhere. A small `package.json`
     with Playwright as a dev package would also let `npx knip` work at the next audit.
   - Risk: **low** (the app itself needs no packages and stays that way).

7. **The same Spanish switch is written in two screens.** `js/study.js` line 60 and
   `js/drill.js` line 89 have the identical line that opens and closes the Español text.
   - Why not needed: `wire()` in `js/ui.js` already handles the speaker button for every
     screen in one place; the Spanish switch belongs beside it.
   - What removing it improves: Phase 4's screen gets the switch for free instead of a
     third copy.
   - Risk: **low.**

8. **The section rows are built twice.** `js/home.js` (lines 64 to 71) and `js/study.js`
   (lines 24 to 27) each build the same list of sections with the same group headings;
   only the meter and the count differ. Also `sectionRows` lives in `js/home.js` but
   `js/study.js` imports it, so one screen depends on another screen's file.
   - Why not needed: one small function in `js/ui.js` can draw the rows, and
     `sectionRows` fits in `js/data.js` next to `idsInList`.
   - What removing it improves: Phase 5 (the Mall, tap a landmark to drill a section)
     will need this list a third time.
   - Risk: **low.**

9. **The big eagle header is written twice.** `js/home.js` (lines 37 to 43) and
   `js/drill.js` (lines 46 to 50) build the same header: 64px eagle, small caption,
   large title.
   - Why not needed: one helper in `js/ui.js` would do both.
   - What removing it improves: the Phase 4 result screen (pass or fail) will want the
     same header.
   - Risk: **low.**

10. **"Checked on a date at a site" is written three ways.** `js/data.js` line 42 and
    line 61 build the same sentence, and `js/place.js` line 47 builds a shorter one.
    - Why not needed: one helper can make the sentence.
    - What removing it improves: the wording about where a name was checked stays the
      same everywhere, which matters because people repeat these names to an officer.
    - Risk: **low.**

11. **Two ways of working out "today".** `js/srs.js` `dayNumber()` (line 11) and
    `js/data.js` `localIso()` (line 53) both turn the phone's clock into the local day,
    each with its own time-zone sum.
    - Why not needed: one "today" helper could give both forms.
    - What removing it improves: the daily goal and streak (Phase 5) will need "today"
      again; one helper means the day cannot change at two different moments.
    - Risk: **medium.** The schedule depends on it and `tests/srs.test.mjs` covers only
      the `srs.js` side. Change it together with a test.

12. **Small leftovers in the code.** None changes what the app does.
    - `js/data.js` line 102: `needsTyping` returns `rep: true`, which nothing reads.
    - `js/srs.js` line 8: `RETRY_GAP` is exported but only used inside the same file.
    - `js/home.js` line 78: the install handler is marked `async` and waits for nothing.
    - `js/place.js` line 26: the class `none` has no style in `css/app.css`.
    - `css/app.css` line 19: the variable `--sp-1` is never used.
    - `css/app.css` lines 22, 79, 110: `:not([data-theme=light])` guards a setting no
      code ever sets (there is no light and dark switch; the phone decides).
    - Why not needed: each is a name or word with no effect.
    - What removing it improves: less to read.
    - Risk: **low.** Check DESIGN.md before touching `--sp-1` and `data-theme`: if a
      theme switch is planned, keep the guard.

13. **Wording left over from before the app existed.** `docs/ARCHITECTURE.md` line 10
    says `data/` is "What the app will read"; the app reads it now. (The file does list
    `js/`, `css/` and `sw.js`, lines 27 to 38, and does not say "No app code yet": that
    line is not in this branch.) HANDOFF.md still says the cleanup check is due.
    - Why not needed: both lines describe a past state.
    - What fixing it improves: the map and the handoff match the repo.
    - Risk: **low.**

14. **A raw study file nothing reads.** `docs/design/duolingo.com.json` (402 lines,
    7 KB) is the raw data behind `docs/design/duolingo.com.md`. No code and no other
    document uses its values; DESIGN.md was rewritten since ("Golden hour on the Mall").
    - Why not needed: the readable summary beside it holds what was learned.
    - What removing it improves: a smaller docs folder.
    - Risk: **low.** Update the line in docs/ARCHITECTURE.md that names it.

## Checked and kept (not cleanup)

- `vercel.json`: used by the private test link (SPEC.md, Hosting). GitHub Pages ignores it.
- `sources/uscis-2025-civics-128.pdf`: the check script needs it before every push.
- `assets/fonts/fraunces-italic.woff2`: used for the Spanish lines; in `sw.js`.
- All four icons: named in `index.html` or `manifest.webmanifest`, and in `sw.js`.
- Every file in `js/` is imported, and every file the app loads is in the `FILES` list
  in `sw.js`. No abandoned code file was found.
- `data/questions.json`, `data/es.json`, `data/officials.json`: data, never cleanup.

## For Jose to decide (not cleanup, noticed on the way)

- GitHub Pages publishes the whole folder. Once `main` goes live, `CLAUDE.md`,
  `HANDOFF.md`, `SPEC.md`, `docs/`, `tools/`, `tests/` and `preview/` will be readable
  on the public site too (they already are in the public repo). Worth a decision in
  Phase 6, before the first release.
