# Architecture

Short map; keep it current. No app code yet (Phase 1 is the data).

## Folders

- `sources/` The official files the data is copied from. `uscis-2025-civics-128.pdf`
  is USCIS form M-1778 (09/25), the 128 questions (a U.S. government work, free to reuse).
- `data/` What the app will read.
  - `questions.json` The 128 questions, every accepted answer, the bracketed notes, the
    65/20 marks (`star6520`), the section and part, and `kind`: `fixed`,
    `where-you-live` (23, 29, 61, 62) or `current-official` (30, 38, 39, 57). Built from
    the PDF, never edited by hand.
  - `es.json` Spanish help, keyed by question id: `q`, `a` (one per English answer, same
    order), `notes`, `checked` (true once Jose has read it).
  - `officials.json` Names that change with elections, each with the date checked and the
    source; capitals for the 50 states and 5 territories; D.C.'s special answers.
- `tools/questions_from_pdf.py` `--write` rebuilds `questions.json` from the PDF; with no
  flag it checks `questions.json` against the PDF word for word and checks `es.json`
  covers every answer and note. Needs `pdftotext` (poppler-utils).
- `docs/` Rules (design, assets, cleanup, refactor) and this file.

## How data moves

USCIS PDF -> `tools/questions_from_pdf.py --write` -> `data/questions.json`.
Spanish and officeholders are written by hand (Claude drafts, Jose checks) and joined to
the questions by id in the app. Progress will stay in the browser on each phone.
