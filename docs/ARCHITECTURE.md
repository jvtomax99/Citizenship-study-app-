# Architecture

Short map; keep it current. Plain HTML, CSS and JavaScript: no framework, no build step,
nothing to install. GitHub Pages serves the folder as it is.

## Folders

- `sources/` The official files the data is copied from. `uscis-2025-civics-128.pdf`
  is USCIS form M-1778 (09/25), the 128 questions (a U.S. government work, free to reuse).
- `data/` What the app reads.
  - `questions.json` The 128 questions, every accepted answer, the bracketed notes, the
    65/20 marks (`star6520`), the section and part, and `kind`: `fixed`,
    `where-you-live` (23, 29, 61, 62) or `current-official` (30, 38, 39, 57), and `need`:
    how many answers the question asks for (2, 3 or 5 on seven questions; the PDF
    underlines the word). Built from the PDF, never edited by hand.
  - `es.json` Spanish help, keyed by question id: `q`, `a` (one per English answer, same
    order; parentheses mean optional words, as in English), `notes`, `glosses` (an English
    name or synonym shown beside an answer, never part of it), `checked` (true once
    Jose has read it).
  - `guide.json` The user guide: short steps in English, each with Spanish (`checked`
    turns true once Jose has read the Spanish).
  - `officials.json` Names that change with elections. null = not filled yet, "none" =
    the office doesn't exist there; each name gets `confirmed` (date someone checked it at
    the source); capitals for the 50 states and 5 territories; D.C.'s special answers.
- `tools/questions_from_pdf.py` `--write` rebuilds `questions.json` from the PDF; with no
  flag it checks `questions.json` against the PDF two ways (the parse, and every string
  verbatim in a plain-text read) plus pinned facts (the 20 stars, 410 answers), and
  checks `es.json` covers every answer and note. Needs `pdftotext` (poppler-utils).
- `index.html` The one page. `css/app.css` holds the whole look (the variables from
  `DESIGN.md`); `manifest.webmanifest` and `sw.js` make it install and work offline.
- `js/` One small file each:
  - `app.js` starts the app and picks the screen from the address (`#/`, `#/place`,
    `#/study/<section>`, `#/drill[/<section>]`, `#/mock`, `#/mall`, `#/backup`, `#/guide`).
  - `data.js` loads the three data files and works out the personal answers
    (`personalAnswers`: senators, governor, capital, representative, the four federal names)
    and the section list (`sectionRows`).
  - `store.js` what the phone remembers (one `localStorage` entry, `civics128.v1`).
  - `srs.js` the come-back-sooner schedule (pure functions; `tests/srs.test.mjs`).
  - `speak.js` read-aloud with the phone's voice. `listen.js` speech to text with the
    phone's own recognizer (not on every phone; the screen always works by typing).
  - `match.js` the officer's judgment, pure functions (`tests/match.test.mjs`): the
    interview's rules (`RULES`, `standing`, `pickQuestions`) and `judge()`, which calls a
    typed or spoken answer right, wrong or unsure by comparing words. It only reads the
    answers. When changing it, add the case to the test list first.
  - `mock.js` the mock interview's screens. The interview in progress is `mock` in the
    store; finished ones go to `mockHistory` (last 10).
  - `progress.js` pure functions (`tests/progress.test.mjs`): a landmark's light
    (`landmark`), the daily count (`addAnswer`), the forgiving streak (`streak`, `week`).
  - `mall.js` the Mall screen (`#/mall`), the landmark list (`LANDMARKS`, one per
    section key) and Home's strip. `#/drill/<section key>` drills one part.
  - `backup.js` the backup file, pure functions (`tests/backup.test.mjs`): `pack` writes
    it, `unpack` reads one and keeps only the fields it knows (a file from another phone
    is not trusted), `summary` gives the numbers shown before a load.
  - `more.js` the Backup screen (`#/backup`: Share menu, download or copy as text; load
    from a file or pasted text, compare, replace, undo) and the guide (`#/guide`, text in
    `data/guide.json`, fetched when first opened).
  - `ui.js` shared pieces (scene, top bar, question card, answers panel, eagle header,
    section rows, the Español switch).
  - `home.js`, `place.js`, `study.js`, `drill.js` the other four screens.
- `tests/` `node --test tests/*.mjs` checks the schedule, the answer checker and the backup file.
  `tools/shots.mjs` taps through the whole app at phone size (a pretend microphone
  stands in for voice), checks the "Done when" lines of Steps 3 to 6 and saves screenshots
  (start `python3 -m http.server 8123` first).
- `DESIGN.md` The look: colors, type, shape, components, motion (Jose OK'd it).
  `preview/sample-drill.html` is the sample screen it was approved from.
- `assets/fonts/` Fraunces and Nunito as web files (saved here so they work offline).
  `assets/icons/` the app icon, cut from the eagle picture.
- `assets/images/` The 3D-rendered pictures (the Mall by day and night, the eagle officer;
  `landmarks/` the eight Mall landmarks, each 720 px wide plus a 108 px `-s` square for Home). `CREDITS.md` lists every asset; `docs/design/art-prompts.md` says how they were made.
- `docs/design/` Taste studies of sites Jose picked (`duolingo.com.md`).
- `docs/` Rules (design, assets, cleanup, refactor) and this file.

## How data moves

USCIS PDF -> `tools/questions_from_pdf.py --write` -> `data/questions.json`.
Spanish and officeholders are written by hand (Claude drafts, Jose checks) and joined to
the questions by id in the app (`js/data.js`). The question wording is never changed in
code: personal answers are shown above the USCIS text, not instead of it.

Progress stays on each phone: `js/store.js` keeps the state, typed names, the 65/20
switch, one card per question (`box`, `due`, `seen`, `last`), the daily goal and
`days` (questions answered per day, last 60 days; the streak is worked out, never stored). `sw.js` saves every
file on the first visit, serves the saved copy, and fetches a fresh one in the
background, so an update appears the second time the app is opened. A new file the app
needs must be added to the `FILES` list in `sw.js`, and the cache name there bumped.

A backup is that same remembered state as one text file (`js/backup.js`). Loading one
replaces the state; what the phone held is kept under `civics128.undo` (one copy).
Putting it back swaps the two, so nothing is dropped by one tap.
The hidden install tip and the last-backup date belong to the phone and do not travel.

## Going live

GitHub Pages serves `main` as it is (`.nojekyll`, no build) at
https://jvtomax99.github.io/Citizenship-study-app-/. `index.html` asks search engines
not to list it (Jose, 2026-11-11). The Vercel test link is a separate copy with its own
saved progress.
