# duolingo.com: taste study (2026-11-11)

Measured with the taste skill's `extract.js` in headless Chromium, home page, desktop
1440 and phone 390. Raw numbers: `duolingo.com.json`. Inspiration only (docs/design-rules.md):
its green, its owl, its fonts (duolingo-sans, feather: proprietary) and its name never
go in this app.

## Design map

- **Color.** White page. One loud brand color, green `#58CC02`, carries every main
  action and every section heading (36px). Body text is not black: `#4B4B4B` headings,
  `#777777` secondary, `#3C3C3C` base. Blue `#1CB0F6` for the secondary action's label.
  Grey `#E5E5E5` for every border.
- **Type.** One rounded sans for nearly everything (1,591 of 1,600 text nodes), weight 700
  on 135 of 140 samples. Sizes cluster at 13, 15, 17, 19, then jump to 32, 36, 48.
  Buttons: 15px, 700, uppercase, letter-spacing 0.8px. Body 17px / 24px.
- **Shape.** One radius: 12px (every rounded thing). No soft drop shadows at all.
- **The "lip".** Buttons are 50px tall, 2px border, and a solid 2px-4px bottom edge of a
  darker shade (`box-shadow: 0 2px 0 #E5E5E5` on the outline button). It reads as a
  physical key; pressing it drops the lip.
- **Spacing.** An 8px base (64 of the samples), sections 96px apart on desktop.
- **Motion.** Transform 0.4s `cubic-bezier(0.22, 1, 0.36, 1)`; filter 0.2s on press.

## Taste DNA

1. **Trigger:** the user is a beginner, often anxious. **Decision:** everything bold,
   rounded and bright; nothing thin or grey-on-grey. **Reason:** confidence comes from
   things that look easy to press. **Evidence:** 700 weight on 96% of text; 12px
   radius everywhere; 50px buttons.
2. **Trigger:** one thing to do per screen. **Decision:** a single full-width primary
   button, a second action as an outline, nothing else competing. **Evidence:** the
   phone hero is illustration, one sentence, two buttons.
3. **Trigger:** depth without shadows. **Decision:** solid darker bottom edges instead of
   blurred shadows. **Reason:** flat, fast to draw, reads on cheap screens and in sun.
   **Evidence:** `shadows: []` across the page; the lip on every button.
4. **Rejected:** photography, gradients, thin hairline UI, small grey text. Illustration
   carries all the warmth.
