# CLAUDE.md: Citizenship study app

A study app for the U.S. citizenship (naturalization) civics test, 2025
version (128 questions). Plan and phases: `SPEC.md`. Map:
`docs/ARCHITECTURE.md`. Look: `DESIGN.md`.
The rules shared by all of Jose's projects are in
`.claude/rules/general.md`; where this file differs, this file wins.

## Rules for this repo

- **Real user.** Family and friends Jose is helping (who: TO FILL in
  `SPEC.md`).
- **Hosting.** GitHub Pages from `main` (Jose, 2026-11-11), at
  https://jvtomax99.github.io/Citizenship-study-app-/ once Jose turns Pages
  on. Merging to `main` is going live. The preview is the test link
  https://citizenship-study-test.vercel.app (Vercel project
  `citizenship-study-test`, team `language-services`; deploy the branch
  again after new work, git source, target production: it does not update
  by itself) plus Playwright screenshots, phone first
  (`node tools/shots.mjs`, needs `python3 -m http.server 8123`).
- **The questions are copied, never written.** `data/questions.json` is
  built from the USCIS PDF in `sources/`; `python3
  tools/questions_from_pdf.py` must say OK before any push. uscis.gov
  blocks automated downloads: ask Jose to upload files.
- **Always clickable suggestions** (Jose, 2026-11-11): every question or
  next step goes out as `AskUserQuestion` buttons, recommended first, never
  only as text.
- **Links and settings to paste go in one code block, all at once** (Jose,
  2026-11-11): one per line, never split into several blocks.
- **A new file the app loads** goes in the `FILES` list in `sw.js`, and the
  cache name there is bumped.
- **Never live 3D.** The pictures are rendered once and saved as images.
- **Default branch.** Pull requests go into `main`. GitHub's default is
  still `claude/amazing-albattani-rqksw7` until Jose switches it (Settings,
  Branches), so a fresh clone can be behind `main`: fetch `main` first.
- **Site check.** Not set up. Copy `.github/site-check.cjs` and
  `.github/workflows/site-check.yml` from Lions-Roar- and list the pages
  there.
- **Public repo.** Paid raw files (fonts, models) can't be committed
  (`docs/assets.md`, section 9) unless Jose makes it private.

## Tools

- **Taste skill** (`.claude/skills/taste/`): it asks for the Playwright MCP
  server. In a cloud session use the installed Playwright instead and run
  its `references/extract.js` with `page.evaluate`.
- **Refactor.** `docs/refactor.md`, run when Jose asks for "Refactor:
  CLEANUP.md items ...".
