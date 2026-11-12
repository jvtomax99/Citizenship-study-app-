# HANDOFF (written 2026-11-12, the app is live)

## Goal and exact next step

The app is live at https://jvtomax99.github.io/Citizenship-study-app-/ (Steps 1 to 3
and 5 to 7 checked off). **Next: ask Jose with buttons** between the cleanup audit
(due: three steps finished since the last one), the Step 4 voice test, and reading the
Spanish.

## Still open

- Step 4 (mock interview) is NOT checked off: Jose owes one interview by voice in the
  browser and one from the Home Screen icon.
- Jose reads the Spanish: the 20 marked 65/20 first, then the guide (`data/guide.json`).
  Everything unread shows "borrador".
- Jose did not say which way his iPhone saved the backup file (Share menu, download or
  copy as text). Ask when it comes up.
- Show the app to one of the family and friends. SPEC.md TO FILL (who, the app's name).
- Recheck the Speaker, Booker's seat and New York's governor in January 2027.
- The site asks search engines not to list it (`index.html`, robots line) until Jose
  says otherwise.
- Site check workflow (CLAUDE.md) lives in Lions-Roar-, not reachable from the last
  session.
- Step 5 leftovers: "Study cards" from a landmark goes back to the sections list; a
  drill round left open overnight treats a returning question as a retry.
- This branch holds two small document changes (this file and the Step 6 checkoff) that
  are not in `main` yet: they ride along with the next pull request.

## Notes

- If GitHub does not publish after a merge: look at the repo's Actions tab. A "pages
  build and deployment" run stuck on Queued can be cancelled and re-run.
- Test link: https://citizenship-study-test.vercel.app (Vercel project
  `citizenship-study-test`, team `language-services`; deploy with git source, target
  production). Its saved progress is separate from the live site's: the backup file
  carries it over.
- Proof tools: `node --test tests/*.mjs`, `python3 tools/questions_from_pdf.py`,
  `node tools/shots.mjs` (needs `python3 -m http.server 8123`, about 4 minutes).

## Files to look at first

SPEC.md, docs/ARCHITECTURE.md, docs/CLEANUP.md, docs/cleanup-audit.md.
