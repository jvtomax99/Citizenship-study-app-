Drafted 2026-11-11 from Jose's answers. Gaps marked TO FILL for Jose.

# SPEC: Citizenship study app

Name: Citizenship Study (Jose, 2026-11-11: the name on the icon stays).

## What it is

A free web app for studying the U.S. naturalization civics test (the 2025 test,
128 questions) on a phone. It installs to the Home Screen, works offline, and keeps
progress on the device. Same habits as Jose's other two study apps (spaced
repetition, honest readiness, a daily goal, a world that grows as you learn), with
its own look: the real view of the National Mall as 3D-rendered pictures, not live 3D.

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
   answer and note. (A short explanation per question moved to "Later": Jose, 2026-11-11.)
   - Done when: every question and answer matches the PDF word for word (a check
     script compares them), and Jose has read the Spanish.
2. **Your state's answers.** Pick your state (and D.C. or territory); the senator,
   governor and capital answers fill in. Representative: pick from the list or type
   your own. Every officeholder answer shows the date it was last checked.
   - Done when: picking a state changes those answers everywhere, and one file holds
     every officeholder with the date someone confirmed it at the source.
3. **Study cards.** Question in English, tap to see the answers, tap for Spanish.
   A speaker button reads the English question aloud (the phone's own voice). Spanish
   shows a "borrador" (draft) mark until Jose has read it. A switch on Home limits
   everything to the 20 questions of the 65/20 list.
   - Done when: a user flips through a section and hears any question read aloud.
4. **Drill with spaced repetition.** Rounds of 10. You say the answer out loud, tap
   "Show answers", then tap I knew it, I guessed or I missed it (Jose's pick,
   2026-11-11: no typing, no multiple choice; checking typed and spoken answers is the
   Mock interview's job). Missed questions come back sooner: later in the same round,
   and first in the next one. "I guessed" counts a lucky right answer as a miss.
   Knowing it waits 1, 3, 7, 14, then 30 days.
   - Done when: a missed question returns before a right one, and a guess counts as
     a miss.
5. **Mock interview.** The officer reads questions aloud in random order; you answer
   out loud (speech to text where the phone allows it, typing otherwise), see the
   accepted answers, and the app scores it. Stops at 12 right or 9 wrong, as USCIS
   does. A 65/20 mode (10 asked, 6 to pass).
   - Done when: a user finishes an interview by voice and sees pass or fail with
     each question's accepted answers.
   - Decided with Jose, 2026-11-11: the app checks the answer and one tap overrules
     it ("The app got it wrong: I was right" / "I was actually wrong"). When the app
     is not sure it shows the accepted answers and asks "I was right / I was wrong";
     it must never teach a wrong answer as right. No server, so the check compares
     words (js/match.js); it will ask often, by design.
   - In English only, including 65/20 mode (Jose, 2026-11-11: nobody in the family will
     take the 65/20 test in Spanish). A wrong
     answer goes to the drill as missed; a right one does not change the drill. The
     last 10 results are kept; Home shows the latest. "I don't know" is a miss; Check
     with nothing typed asks the person to compare (for people who only say it aloud).
   - Voice is the phone's own speech to text: it needs internet on Android Chrome and
     sends the audio to Google or Apple (the start screen says so). Whether it works
     in the installed Home Screen app on an iPhone: Jose to try (not known).
6. **The National Mall.** Eight rendered landmarks, one per official USCIS part
   (Jose, 2026-11-11: eight, not four, so the 47-question part does not hide progress):
   National Archives (Principles), the Capitol (System of Government), Supreme Court
   (Rights and Responsibilities), Washington Monument (Colonial Period), Lincoln
   Memorial (1800s), World War II Memorial (Recent History), the flag (Symbols),
   fireworks over the Mall (Holidays). Tap a landmark to drill that part or open its
   study cards.
   - Honest light (Jose, 2026-11-11): a landmark brightens with each question known,
     turns gold only when every question was known on two different days, and dims
     again if one is missed. If the family finds the dimming discouraging, the fallback
     is to keep the gold and show a "needs review" mark (`js/progress.js`).
   - Only the drill brightens a landmark; a right answer in the mock interview does not
     change the drill's memory (a miss there dims, as before).
   - Done when: mastering questions in a section visibly changes its landmark, and
     the screen loads in under 2 s on a mid-range phone.
7. **Daily goal and streak.** 10 questions a day (5 or 20 by choice); the drill's and the
   interview's answers count, study cards do not. Forgiving (Jose, 2026-11-11): one
   missed day in any seven is a rest day and keeps the days in a row. Home shows today,
   the last seven days and the streak. No reminders or notifications in v1.
   - Done when: reaching the goal shows today's progress and the streak goes up.
8. **Home Screen app and backup.** Installs, works offline, saves and loads a backup
   file.
   - Done when: the app opens offline from the Home Screen icon, and a backup moves
     progress to another phone.
   - Backup (Jose OK'd the plan, 2026-11-11): one file with everything the phone
     remembers, sent through the phone's Share menu, a download, or copied as text.
     Loading shows the file's numbers next to the phone's, then replaces. The phone
     keeps the one copy it had before; putting it back also shows both sides first
     and can itself be undone (from the review: no single tap drops progress).
     Files that are not a backup are refused.
9. **User guide.** "How to use this app" on Home: short steps in English, Spanish one
   tap away (Jose, 2026-11-11).
   - Done when: a person can read how to install, study and back up, in both languages.

10. **How-to video.** A narrated video of about 2 minutes, once in English and once in
   Spanish, in the style of the CPA app's and the Interpreter Hub's (Jose, 2026-11-11;
   moved up from "Later"). It plays on the guide screen ("Watch the guide" on Home) and
   is also a file to send by WhatsApp. Made in code from screenshots of the real app
   (`promo/`). Narrated with ElevenLabs voices (Jose, 2026-11-12).
   - Done when: the video plays on a phone in both languages and walks through install,
     the state, Study cards, Drill, the Mock interview, the 65/20 list, the goal and the
     Mall, and Backup.
   - Not in its first version: Spanish app screens (the app's buttons are English), a
     real person's voice, saving the video for offline use (it needs internet).

## Not in v1

TO FILL: Jose to confirm.

- The 2008 test (100 questions).
- Accounts, sync between phones, any server (so no AI grading of spoken answers).
- Automatic backups or backup reminders; mixing two backups together.
- Being listed on Google: the live site asks search engines to skip it until Jose
  says otherwise (2026-11-11). A custom web address.
- Languages other than English and Spanish. Fully bilingual menus.
- Live 3D. The Mall and the mascot are 3D-rendered pictures (Jose, 2026-11-11), saved as
  images so the app stays fast on older phones.
- Help filling out the N-400 or legal advice of any kind.
- Ads or payments.

## Later

- A short explanation on each study card (why the answer is the answer), in English and
  Spanish. Its own step, after Jose has read the Spanish (Jose, 2026-11-11).
- Reading and writing practice (the English test: read 1 of 3 sentences, write 1 of
  3), from the USCIS vocabulary lists.
- Practice for the N-400 interview questions themselves (the officer's questions
  about the application).
- More languages.
- A mock interview in Spanish for 65/20 applicants (not needed now: Jose, 2026-11-11).
- A printable guide.

## Open questions for Jose

- Senators and governors: only the states where the family and friends live:
  New Jersey and New York (Jose, 2026-11-11); other states type their own. Filled and
  confirmed at senate.gov, nj.gov and governor.ny.gov on 2026-11-11; Booker's seat and
  New York's governor were on the 2026 ballot, so recheck both in early January 2027.

## Budget

$0 in new purchases, no template (Jose, 2026-11-11). The video's narration uses Jose's
ElevenLabs account (his ask, 2026-11-12). Google Fonts, public-domain or
CC0 art, and pictures made with the Runway credits Jose already has (120 used so far;
CREDITS.md).

## Hosting

Test link (not the live site): https://citizenship-study-test.vercel.app, a separate
Vercel project deployed from the working branch so Jose can try a build on a real phone
(Jose, 2026-11-11). Hidden from search engines by `vercel.json`.

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
  - [x] Federal names confirmed on uscis.gov/citizenship/testupdates (Jose's screenshot
    of the page, 2026-11-11: all four match; the other accepted forms it lists are
    shown too); senators and governors filled (see Open questions). Recheck the
    Speaker after January 3, 2027.
- [x] 2. Look (Jose OK'd it on 2026-11-11): DESIGN.md per `docs/design-rules.md`, from Duolingo's feel (Jose's
  pick, 2026-11-11; no template, $0), one sample screen for Jose's OK.
  - [x] Taste study of duolingo.com (`docs/design/`), DESIGN.md draft, sample screen
    `preview/sample-drill.html` (2026-11-11).
  - [x] Jose found the first sample too simple; of three richer options he picked
    "Golden hour on the Mall" with more detail. DESIGN.md and the sample redrawn.
  - [x] Jose asked for 3D images and richer detail: the Mall (day and night) and an
    eagle officer rendered as 3D pictures, in the sample.
  - [x] Jose asked for it to look like the real Washington, D.C.: the scenes are now
    the true view from the Lincoln Memorial, day and night.
  - [x] Jose OK'd the sample: "Good, build with it".
- [x] 3. App shell, state picker, Study cards with read-aloud, Drill with spaced
  repetition and "I guessed". Home Screen install and offline. Built 2026-11-11, tapped
  through by script (`node tools/shots.mjs`), and Jose tried the test link on his phone
  and said to move on.
- [ ] 4. Mock interview with voice, the 12/9 rule and 65/20 mode (built 2026-11-11,
  reviewed, on the test link; waits on Jose finishing one by voice on his phone).
- [x] 5. The National Mall, daily goal and streak (built 2026-11-11 before Step 4 was
  checked off: Jose will test the voice interview later). Jose tried it on his phone:
  "Looks good" (2026-11-11).
- [x] 6. Backup, user guide, first release to GitHub Pages. Live since 2026-11-12 at
  https://jvtomax99.github.io/Citizenship-study-app-/
  - [x] Backup and guide built 2026-11-11, tapped through by script, reviewed by a
    separate reviewer (fixes in), on the test link.
  - [x] Jose ran the phone test list (save from the Home Screen icon, load in another
    copy, undo, the guide) on 2026-11-11: "It works". He did not say which of the
    three ways to save his iPhone used.
  - [x] Jose's "push" on pull request 5 into `main` (2026-11-11); Pages on.
  - [x] Live address checked 2026-11-12 by script at phone size: loads, the install
    file is right, 53 files saved for offline, and Home, a study card, the guide,
    Backup and the Mall open with the network off. (GitHub's publishing was stuck for
    13 hours behind a GitHub incident; a fresh start of the build fixed it.)
- [x] 7. How-to video in English and Spanish.
  - [x] English video built 2026-11-11 (`media/how-to-use-en.mp4`), on the guide screen.
  - [x] Jose OK'd the Spanish script (`promo/SCRIPT.md`) on 2026-11-12; the Spanish video
    (`media/how-to-use-es.mp4`) plays on the guide screen when Español is open.
  - [x] Voices: ElevenLabs, Brian (English) and Matilda (Spanish), picked by Jose from
    samples on 2026-11-12 (the first version used a free offline voice).
  - [x] Independent review: added "ask USCIS or your lawyer" to the 65/20 scene and
    "if a name is missing, type it in" to the state scene.
  - [x] Jose watched both: "Both good" (2026-11-12).
  - [x] Jose's "push" on pull request 6 into `main` (2026-11-12).
