# Design: Citizenship study app

> Duolingo's feel (bold, rounded, bright, one thing per screen, buttons you want to
> press) in this app's own civic colors: Statue of Liberty patina, flag navy and red,
> and a drawn National Mall. Draft 2026-11-11, from `docs/design/duolingo.com.md`.
> Waiting for Jose's OK on the sample screen.

Every value lives in CSS variables on `:root`; change it here and there together.
Phone first (390px), one column, max content width 560px on larger screens.

## Colors

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#131A2B` | Page |
| `--surface` | `#F6F7F4` | `#1C2438` | Cards at rest, the answer field |
| `--line` | `#E3E5E8` | `#2C3550` | Every border and every button lip on outlines |
| `--ink` | `#1D2B53` | `#EEF1F8` | Headings, the question |
| `--text` | `#3C4152` | `#D3D8E4` | Body |
| `--text-soft` | `#6A7184` | `#9AA3B8` | Secondary text (4.7:1 on white; never lighter) |
| `--liberty` | `#14806F` | `#3CC4AD` | Main action, progress, right answers. Statue of Liberty patina (4.8:1 with white) |
| `--liberty-lip` | `#0E5F53` | `#239A86` | The bottom edge under `--liberty` buttons |
| `--liberty-soft` | `#DDF4EF` | `#173A3A` | Right-answer banner |
| `--red` | `#D2374B` | `#F06B7C` | Wrong answers, the 9-wrong counter. Flag red |
| `--red-lip` | `#A8283A` | `#C34A5A` | Its bottom edge |
| `--red-soft` | `#FBE6E9` | `#3A1E26` | Wrong-answer banner |
| `--navy` | `#1D2B53` | `#8FB0FF` | Secondary action labels, links, the Spanish line |
| `--on-accent` | `#FFFFFF` | `#131A2B` | Text and icons on `--liberty`, `--red` and `--navy` fills (dark text in dark mode, where the fills are light) |
| `--gold` | `#F5B700` | `#F7C744` | Streak, stars, the 65/20 chip. Never text on white |

Text on `--liberty`, `--red` and `--navy` fills is `--on-accent`, 700+. One loud color per screen: `--liberty`
for the action, `--red` only when something is wrong.

## Type

One family: **Nunito** (Google Fonts, free, rounded), weights 600, 700 and 800.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `--fs-display` | 32 / 38 | 800 | Screen title, result score |
| `--fs-question` | 24 / 31 | 800 | The question |
| `--fs-title` | 19 / 25 | 800 | Card titles |
| `--fs-body` | 17 / 24 | 600 | Body, answers. Also every input (never under 16px: iOS zooms) |
| `--fs-button` | 15 / 20 | 800, uppercase, +0.8px | Buttons |
| `--fs-small` | 13 / 18 | 700 | Chips, captions |

## Shape, space, depth

- **Radius:** `--r: 14px` on buttons, cards, fields; `--r-pill: 999px` on chips and the
  progress bar. Nothing else.
- **Space:** 8px base: `--sp-1` 4, `--sp-2` 8, `--sp-3` 12, `--sp-4` 16, `--sp-5` 24,
  `--sp-6` 32, `--sp-7` 48. Side gutter 16px on phones.
- **Depth is a lip, not a shadow.** Buttons and tappable cards get a solid bottom edge:
  `box-shadow: 0 4px 0 var(--…-lip)` on filled buttons, `0 2px 0 var(--line)` with a
  2px `--line` border on outline buttons and cards. No blurred shadows anywhere.

## Components

- **Primary button:** 52px tall, full width, `--liberty` with its lip, label
  `--fs-button` white. Disabled: `--line` fill, `--text-soft` label, no lip.
- **Secondary button:** same size, white, 2px `--line` border and lip, label `--navy`.
- **Press:** the button moves down 4px and the lip goes to 0 (80ms). Needs `:active`
  plus a JS `is-pressed` class (touch screens have no hover).
- **Question card:** the officer bubble: `--surface`, `--r`, question in
  `--fs-question` `--ink`, a round speaker button (44px) to hear it, the Spanish line
  under it in `--navy` 600, hidden until "Español" is tapped.
- **Answer field:** 56px, `--surface`, 2px `--line` border, `--fs-body`, a 44px mic
  button inside on the right. Focus: border `--navy`.
- **Progress bar:** 16px pill, track `--line`, fill `--liberty` with a 4px lighter
  highlight stripe at the top.
- **Feedback banner:** slides up from the bottom over the action area. Right:
  `--liberty-soft`, title in `--liberty` 800. Wrong: `--red-soft`, title `--red`, the
  accepted answers listed. Its button replaces the Check button.
- **Speaker button:** 44px circle, `--navy` fill, `--on-accent` icon, 3px lip `--speak-lip`
  (`#0F1836` light, `#5A78C4` dark).
- **Chips:** 26px pill, `--fs-small`, e.g. "★ On the 65/20 list" on `--gold` with `--ink` text,
  "Needs 2 answers" on `--surface`.

## Motion

- Ease `cubic-bezier(0.22, 1, 0.36, 1)`. Press 80ms, banner 260ms, progress fill 400ms.
- Reduced motion: no slides, only fades.

## Do and don't

- Do: one main action per screen; illustrations for warmth (the Mall); short sentences.
- Don't: Duolingo's green `#58CC02`, its owl, its fonts or its name; gradients;
  blurred shadows; text under 13px; grey text lighter than `--text-soft`.
