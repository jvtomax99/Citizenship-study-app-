Drafted 2026-11-11 from Jose's answers. Gaps marked TO FILL for Jose.

# SPEC: Citizenship study app

Working name TO FILL (Jose picks; the CPA app is "Above the Line").

## What it is

A free web app for studying the U.S. naturalization civics test (the 2025 test,
128 questions) on a phone. It installs to the Home Screen, works offline, and keeps
progress on the device. Same habits as Jose's other two study apps (spaced
repetition, honest readiness, a daily goal, a world that grows as you learn), with
its own look: a drawn 2D National Mall, not a 3D city or a campus.

## Who it's for

- Family and friends Jose is helping through naturalization. TO FILL: who, how many,
  which language each speaks best, and their interview dates if known.
- Picked by Jose on 2026-11-11: family and friends, English plus Spanish help (the
  test is in English; Spanish one tap away), a drawn 2D National Mall, GitHub Pages.
- What they need (assumed until Jose confirms): short sessions on an ordinary phone,
  plain English, Spanish one tap away, the questions said out loud the way the
  officer will say them, and answers that match their own state.

## The test it prepares for

From the USCIS PDF (M-1778, 09/25, in `sources/`; Jose uploaded it on 2026-11-11, as
uscis.gov refuses automated downloads). The stopping rule is from the Policy Manual,
read through a search extract:

- The 2025 civics test applies to N-400s filed on or after October 20, 2025.
  Earlier filers take the 2008 test (100 questions), which this app does not cover.
- Oral. The officer asks up to 20 of the 128 questions; 12 right passes. The officer
  stops at 12 right or 9 wrong.
- 65/20 (age 65+, permanent resident 20+ years): 20 marked questions, 10 asked,
  6 right passes, and the civics test may be taken in the language of their choice. So
  for a 65/20 applicant the Spanish answers can be the real answers, and must be right.
- Some answers vary by person (senators, representative, governor, state capital)
  or by date (President, Vice President, Speaker, Chief Justice).
- Sources: USCIS 2025 civics test page, the 128-question PDF (M-1778, 09/25), the
  Policy Manual (Vol. 12, Part E, Ch. 2), the test updates page.

## Features (v1)

1. **Question bank.** All 128 questions and every accepted answer from the USCIS PDF,
   in its sections, with the 65/20 marks, and a Spanish translation of each question,
   answer and note. A short explanation per question comes with the Study cards
   (Phase 3).
   - Done when: every question and answer matches the PDF word for word (a check
     script compares them), and Jose has read the Spanish.
2. **Your state's answers.** Pick your state (and D.C. or territory); the senator,
   governor and capital answers fill in. Representative: pick from the list or type
   your own. Every officeholder answer shows the date it was last checked.
   - Done when: picking a state changes those answers everywhere, and one file holds
     every officeholder with the date someone confirmed it at the source.
3. **Study cards.** Question in English, tap to see the answers, tap for Spanish.
   A speaker button reads the question aloud (the phone's own voice).
   - Done when: a user flips through a section and hears any question read aloud.
4. **Drill with spaced repetition.** Missed questions come back sooner. "I guessed"
   counts a lucky right answer as a miss.
   - Done when: a missed question returns before a right one, and a guess counts as
     a miss.
5. **Mock interview.** The officer reads questions aloud in random order; you answer
   out loud (speech to text where the phone allows it, typing otherwise), see the
   accepted answers, and the app scores it. Stops at 12 right or 9 wrong, as USCIS
   does. A 65/20 mode (10 asked, 6 to pass).
   - Done when: a user finishes an interview by voice and sees pass or fail with
     each question's accepted answers.
6. **The National Mall.** A drawn 2D Mall whose landmarks light up as each section
   is mastered (Capitol: system of government, Archives: rights, monuments: history,
   the flag: symbols). Tap a landmark to drill that section.
   - Done when: mastering questions in a section visibly changes its landmark, and
     the screen loads in under 2 s on a mid-range phone.
7. **Daily goal and streak.**
   - Done when: reaching the goal shows today's progress and the streak goes up.
8. **Home Screen app and backup.** Installs, works offline, saves and loads a backup
   file.
   - Done when: the app opens offline from the Home Screen icon, and a backup moves
     progress to another phone.

## Not in v1

TO FILL: Jose to confirm.

- The 2008 test (100 questions).
- Accounts, sync between phones, any server (so no AI grading of spoken answers).
- Languages other than English and Spanish. Fully bilingual menus.
- 3D. The Mall is drawn 2D so it runs on older phones.
- Help filling out the N-400 or legal advice of any kind.
- Ads or payments.

## Later

- Reading and writing practice (the English test: read 1 of 3 sentences, write 1 of
  3), from the USCIS vocabulary lists.
- Practice for the N-400 interview questions themselves (the officer's questions
  about the application).
- More languages.
- A how-to video like the CPA app's.

## Open questions for Jose

- Senators and governors: only the states where the family and friends live:
  New Jersey and New York (Jose, 2026-11-11); other states type their own. Filled and
  confirmed at senate.gov, nj.gov and governor.ny.gov on 2026-11-11; Booker's seat and
  New York's governor were on the 2026 ballot, so recheck both in early January 2027.

## Budget

$0, free assets only, no template (Jose, 2026-11-11). Google Fonts, public-domain or
CC0 art.

## Hosting

GitHub Pages from `main` (Jose's pick, 2026-11-11). Free; the repo stays public.
No server.

## Phases

Each phase is one pull request, one or two sessions.

- [ ] 1. Question bank (built 2026-11-11, waits on Jose for the last two items):
  - [x] The 128 questions from the USCIS PDF into `data/questions.json`, with how
    many answers each question asks for (`need`), and the check script.
  - [x] Spanish drafts in `data/es.json`, reviewed once by a second Claude pass.
  - [x] Officeholder file: capitals, D.C. and territory answers, the four federal
    names awaiting confirmation.
  - [ ] Jose reads the Spanish (`checked` stays false until then).
  - [ ] Federal names confirmed on uscis.gov/citizenship/testupdates; senators and
    governors filled (see Open questions).
- [ ] 2. Look: DESIGN.md per `docs/design-rules.md`, from Duolingo's feel (Jose's
  pick, 2026-11-11; no template, $0), one sample screen for Jose's OK.
- [ ] 3. App shell, state picker, Study cards with read-aloud, Drill with spaced
  repetition and "I guessed". Home Screen install and offline.
- [ ] 4. Mock interview with voice, the 12/9 rule and 65/20 mode.
- [ ] 5. The National Mall, daily goal and streak.
- [ ] 6. Backup, user guide, first release to GitHub Pages.
