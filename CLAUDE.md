# CLAUDE.md: Citizenship study app

A study app for the U.S. citizenship (naturalization) test. The repo is
empty so far: no code, no `SPEC.md`, no hosting chosen, no `main` branch.
The rules shared by all of Jose's projects are in
`.claude/rules/general.md`; where this file differs, this file wins.

## Rules for this repo

- **First step.** No code before `SPEC.md` exists. Help Jose write it (who
  it's for, "Done when" lines, "Not in v1", "Later", Phases): research 2 or
  3 similar study apps first, then plan mode.
- **Real user.** Not written down. Ask Jose whether it is for himself or
  for someone else, and put the answer in `SPEC.md`.
- **Hosting.** Not chosen. Decide it in the plan and write it here (Jose's
  other study app is on GitHub Pages; Interp is on Vercel).
- **No `main` yet.** The first pull request creates it once Jose OKs it.
- **Public repo.** Paid raw files (fonts, models) can't be committed
  (`docs/assets.md`, section 9) unless Jose makes it private.

## Tools

- **Taste skill** (`.claude/skills/taste/`): it asks for the Playwright MCP
  server. In a cloud session use the installed Playwright instead and run
  its `references/extract.js` with `page.evaluate`.
- **Refactor.** `docs/refactor.md`, run when Jose asks for "Refactor:
  CLEANUP.md items ...".
