# HANDOFF (written 2026-11-11)

## Goal and exact next step

Build the citizenship study app (SPEC.md). Phases 1 (question bank) and 2 (look) are
done. **Next: Phase 3**, the app itself: app shell, state picker, Study cards with
read-aloud, Drill with spaced repetition and "I guessed", Home Screen install and
offline. It is a big feature: plan mode first (what, how, assumptions), wait for
Jose's OK, then build. Turn `preview/sample-drill.html` into the real screens; it
already holds the tokens and components in `DESIGN.md`.

## Done (branch `claude/relaxed-mccarthy-sqi1n0`, all pushed, nothing live, no `main` yet)

- `data/questions.json`: the 128 USCIS questions, built and checked word for word by
  `python3 tools/questions_from_pdf.py` (must say OK before any push).
- `data/es.json`: Spanish drafts, reviewed once by a second pass; every entry still
  `checked:false` until Jose reads it.
- `data/officials.json`: capitals; NJ and NY senators and governors confirmed
  2026-11-11 at the official sites.
- `DESIGN.md`, `preview/sample-drill.html`, `assets/images/` (the real D.C. view by day
  and night, the eagle officer), `CREDITS.md`, `docs/design/`.

## Left open, waiting on Jose

- Read the Spanish (a side-by-side page was sent to him; rebuild it from the two data
  files if he asks). Start with the 20 marked 65/20.
- SPEC.md TO FILL: who the family and friends are, the app's name, "Not in v1" OK.
- Confirm the four federal names at uscis.gov/citizenship/testupdates (the site blocks
  automated reads; Jose opens it). Recheck Booker's seat and NY's governor in January 2027.
- Confirm his Runway plan allows the pictures on a public website (CREDITS.md).
- Small flaw: the monument's tip shows through the progress bar on the sample.

## This session's decisions (all in SPEC.md or CLAUDE.md)

Family and friends; English plus Spanish help; GitHub Pages; $0 in new purchases
(Runway credits he has are fine, 120 used); NJ and NY first; look = the real
Washington, D.C. view, 3D-rendered pictures, never live 3D; friendly cartoon eagle kept
(a realistic one looked stern); always buttons; all links in one block.

## Files to look at first

SPEC.md, DESIGN.md, docs/ARCHITECTURE.md, preview/sample-drill.html,
docs/design/art-prompts.md.

## Also pushed in the other two repos (same branch name, not yet in their `main`)

One CLAUDE.md commit each in Interp and CPA-study-app: the two new rules (always
buttons, all links in one block). Each needs a pull request and Jose's "push".
