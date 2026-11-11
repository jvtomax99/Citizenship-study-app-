# Design: Citizenship study app

> Golden hour on the National Mall. The real view of Washington, D.C. from the Lincoln
> Memorial (Reflecting Pool, Washington Monument, Capitol dome, the flag), 3D-rendered, sits behind a warm cream page; the
> question is set in an elegant serif on a soft white card; everything you press is
> bold, rounded and has a solid lip (the Duolingo lesson, `docs/design/duolingo.com.md`).
> Dark mode is the same Mall at night, monuments floodlit.
> Jose picked this direction ("A") on 2026-11-11 and asked for more detail. Sample:
> `preview/sample-drill.html` (`?state=ask|right|wrong`). He OK'd the sample the same day ("build with it"); this file is the rule for every screen.

Every value is a CSS variable on `:root` in the sample; change it here and there
together. Phone first (390px), one column, content max 560px.

## Colors

### Page, text, lines (switch with the theme)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--page` | `#FFF8F0` | `#12152B` | Page; the scene fades into it |
| `--card` | `#FFFFFF` | `#1C2040` | Question card, answer field, outline button |
| `--ink` | `#2A2347` | `#F1EEFA` | The question, headings, strong numbers |
| `--text` | `#4A4363` | `#D5D0E6` | Body |
| `--text-soft` | `#6E6687` | `#A9A2C4` | Captions, placeholder. Never lighter |
| `--line` / `--line-strong` | `#EFE4F7` / `#D9CBE8` | `#2F3360` / `#444A82` | Borders, outline lips / dashed borders, empty stars |
| `--plum` | `#7556A8` | `#BBA5E8` | Small caps labels ("THE OFFICER ASKS", "ESPAÑOL") |
| `--es` | `#6A4FA3` | `#C7B4F2` | The Spanish line |

### Actions (each is a top-to-bottom gradient with a solid lip)

| Name | Light: top, bottom, lip | Dark: top, bottom, lip | Role |
|---|---|---|---|
| Liberty | `#17907D`, `#127567`, `#0C5348` | `#4DD1BA`, `#2FB39C`, `#1D7F6F` | Main action, mic, right answers. Statue of Liberty patina |
| Indigo | `#5F57C9`, `#3F3A9E`, `#2E2A78` | `#8E87F0`, `#6C64DB`, `#4640A0` | Speaker, officer badge, focus ring |
| Red | `#DA4558`, `#C22F43`, `#8F1F30` | `#F58C9A`, `#E96A7B`, `#B04555` | Wrong answers only |
| Gold | `#FFD66B`, `#F5B026`, `#C98A12` | same | Progress, earned stars, the 65/20 chip (text `--gold-ink` `#4A2A00`) |

`--on-accent` (text on Liberty and Red): `#FFFFFF` light, `#0D1424` dark. Soft
banners: `--liberty-soft` `#DDF4EF` / `#173A3A`, `--red-soft` `#FBE6E9` / `#3A1E2A`.
One loud action per screen; red appears only when something is wrong.

### The art (3D-rendered pictures)

Jose asked for 3D images with rich detail, true to the real Washington, D.C. (2026-11-11). The scenes are rendered once and
saved as pictures, so they cost a phone nothing: `assets/images/mall-day.webp` (light)
and `mall-night.webp` (dark), each fading into `--page` at the bottom, and the eagle
officer `eagle-officer.webp`. Style, prompts and sizes: `docs/design/art-prompts.md`.
New art must match that style line. Never live 3D (SPEC, Not in v1).

## Type

- **Fraunces** (Google Fonts, free): the question (27 / 33, 700, -0.3px), the Spanish
  line (18 / 25, italic 500), feedback titles (22 / 28, 700). Serif = "this is the
  official wording".
- **Nunito** (Google Fonts, free): everything else. Body and inputs 17 / 24, 700 (never
  under 16px in an input: iOS zooms). Buttons 15, 900, uppercase, +1px. Small 13, 800.
  Labels 12, 900, uppercase, +1.2 to 1.4px.

## Shape, space, depth

- Radius: card 28, buttons and fields 18, small buttons 14, chips and bars pill.
- Space: 4, 8, 12, 16, 20, 24. Side gutter 16.
- Depth has two layers. Things you press: a solid lip (`0 5px 0` of the lip color) plus a
  1px inner top highlight. Things that float (the card, the sheet): a long soft plum
  shadow `0 22px 44px -16px rgba(92,52,120,.38)`. No grey shadows.
- The card's border is a 1.5px gradient from white to `--line`.

## Components

- **Scene header:** the Mall picture, full width, 4:3, top of the screen, fading into
  `--page`; it drifts very slowly (scale 1 to 1.05 over 40s).
  The top bar floats on it: 44px glass close button, 14px gold progress bar (questions
  asked), glass tally pills (right, wrong).
- **Question card:** chips row; the eagle officer (44px round picture, gold ring) with
  the label and the 48px speaker button (two rings pulse out of it); the question; the
  Español pill; the Spanish line.
- **Answer field:** 58px, 2px `--line` border, 44px Liberty mic inside. Focus: indigo
  border and a 4px soft ring.
- **Road to 12:** dashed panel with 12 stars (gold when earned) and "7 of 12 right to
  pass · 1 of 9 misses". In 65/20 mode: 6 stars, 5 misses.
- **Primary button:** 56px, Liberty gradient, lip, label `--on-accent`. **Outline
  button:** 52px, `--card`, 2px `--line` border and 3px lip, label `--ink`.
- **Press:** moves down 5px, lip to 0, 80ms. `:active` plus a JS `is-pressed` class.
- **Feedback sheet:** fixed to the bottom, slides up 260ms. Soft green or soft red,
  serif title with a round ✓ or ✕, the accepted answers, one button.

## Motion

Ease `cubic-bezier(0.22,1,0.36,1)`. The scene drifts slowly; the speaker's rings pulse.
Reduced motion: everything still.

## Do and don't

- Do: one main action per screen; let the scene carry the beauty and keep the card calm.
- Don't: Duolingo's green, owl, fonts or name; photos of real people; flat clip art beside the 3D pictures; grey shadows; text under 12px;
  the serif for buttons or labels; text lighter than `--text-soft`.
