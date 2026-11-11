# HANDOFF (written 2026-11-11, Step 6 built, not released)

## Goal and exact next step

Step 6 (backup, user guide, first release) is built, reviewed and on the test link. It
is NOT released: no pull request yet, nothing live.
- Jose ran the phone test on 2026-11-11: "It works". Pull request 5 into `main` is open. The
  four federal names are confirmed (his screenshot of the USCIS page). **Next: his
  "push"**, then the two settings. Ask with buttons.
- Jose's try-this list: on the iPhone, from the Home Screen icon, Backup, "Save a
  backup", send it by WhatsApp or save to Files; load it in Safari or on a second
  phone; see the same numbers; "Undo the load"; open the guide and tap Español.
  Unproven on a real iPhone: which of the three ways to save works there (Share menu,
  download, copy as text), and whether the file picker lists the file (it has no file
  filter on purpose; the reviewer says iPhone then also offers photos).
- After the merge, Jose: Settings, Pages, branch `main`, folder root; Settings,
  Branches, default `main`. Then check
  https://jvtomax99.github.io/Citizenship-study-app-/ loads, installs, opens offline.

## Done this session (branch `claude/relaxed-mccarthy-sqi1n0`, pushed)

- `js/backup.js` + `tests/backup.test.mjs`, `js/more.js` (`#/backup`, `#/guide`),
  `data/guide.json` (Spanish `checked:false`), `store.replace/kept/undo`, Home rows,
  `sw.js` list (cache `civics128-v4`), robots "hidden from Google" line, `.nojekyll`,
  `README.md`. `main`'s three rule-file commits are merged in (CLAUDE.md settled).
- Proof: `node --test tests/*.mjs` (48 pass), `python3 tools/questions_from_pdf.py` OK,
  `node tools/shots.mjs` ALL OK (needs `python3 -m http.server 8123`; takes about 4
  minutes, run it with a long timeout).
- Review caught: undo could drop weeks of study in one tap (now asks, and swaps);
  "saved" was claimed without knowing (wording now asks to check); a crafted interview
  in a file could freeze "Continue" (now refused).
- Runway: cleared on the Terms of Use, section 4.4 (CREDITS.md). Jose is on the paid
  Standard plan.

## Still owed by Jose before the release

- Step 4 voice test (one interview by voice in the browser, one from the icon). Step 4
  is NOT checked off.
- Read the Spanish: the 20 marked 65/20 first, plus the guide.
- Show it to one of the family and friends. SPEC.md TO FILL (who, the app's name).

## Notes

- Test link: https://citizenship-study-test.vercel.app (Vercel project
  `citizenship-study-test`, team `language-services`; a push makes a preview only, so
  deploy with git source, target production). Its saved progress is separate from the
  live site's: the backup file is how to carry it over.
- `main` exists (rule files only). GitHub's default branch is still
  `claude/amazing-albattani-rqksw7`.
- Site check workflow (CLAUDE.md) lives in Lions-Roar-, not reachable from this session.
- Step 5 leftovers still open: "Study cards" from a landmark goes back to the sections
  list; a drill round left open overnight treats a returning question as a retry.
- Cleanup audit: last ran 2026-11-11; one step finished since, due after Step 6 and 4.

## Files to look at first

SPEC.md, docs/ARCHITECTURE.md, js/more.js, js/backup.js, tools/shots.mjs.
