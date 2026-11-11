# promo: the how-to video, written in code

A [Remotion](https://www.remotion.dev) 4 project, copied from the CPA app's `promo/` (itself set up
like the Interpreter Hub's). It is not part of the app: nothing in `index.html` loads this folder.
The finished videos are `media/how-to-use-en.mp4` and `media/how-to-use-es.mp4` (posters beside
them), played on the guide screen (`#/guide`, `VIDEO` in `js/more.js`).

Vertical 1080 x 1920 at 30 fps, a little over 2 minutes, once per language. Thirteen scenes: the
hook (128 questions, 20 asked, 12 to pass), the title, adding the app to the Home Screen (iPhone,
Android, the icon), the state, Study cards, Drill, the Mock interview, the 65/20 list, the daily
goal and the Mall, Backup, and the close (not made by USCIS).

## Making it again

From the repo root, with `python3 -m http.server 8123` running:

```
node promo/tools/capture.cjs                          # screenshots of the real app -> promo/public/shots/, promo/src/layout.json
python3 promo/tools/voice.py <model folder> en        # narration -> promo/public/voice/en/, promo/src/timing.en.json
python3 promo/tools/voice.py <model folder> es
python3 promo/tools/sfx.py 160                        # sound effects and the music bed
python3 promo/tools/script_page.py                    # SCRIPT.md, the words side by side
cd promo
npm install
npm run studio                                        # preview, scrub the timeline
npm run render:en && sh tools/finish.sh en            # -> out/, then levelled and compressed -> ../media/
npm run render:es && sh tools/finish.sh es
```

- **Words:** `src/script.en.json` and `src/script.es.json` (the same scenes and line count in
  both). Each line is spoken and shown as a subtitle; `head` is the scene's two-line headline.
  After changing a line, run `voice.py` again: scene lengths follow the narration. Other words
  drawn on screen are in `T` in `src/HowTo.tsx` and `WORDS` in `src/Mocks.tsx`.
- **Timing:** the pictures follow the voice by how far through a line it is (`fr` in
  `src/HowTo.tsx`), so one set of scenes fits both languages.
- **Look:** the CPA video's kit (`src/Fx.tsx`, `src/Phone.tsx`) in this app's colors and fonts:
  the Mall at night blurred behind, gold and Liberty-teal highlight boxes, Fraunces headlines,
  Nunito subtitles lit word by word, the phone in 3D with a floor reflection, cards lifted out of
  the screen, and the eagle officer who hops on taps.
- **Screenshots:** `tools/capture.cjs` seeds a made-up learner (New Jersey, 73 of 128 known, four
  landmarks lit, five days in a row) and measures where the buttons are, so a layout change in
  the app moves the taps and highlights with it. Run it again after a visible change to the app.
  A button it cannot find stops it with the button's name.
- **Browser steps:** `src/Mocks.tsx` draws simplified Safari and Chrome screens (not screenshots
  of iOS or Android), with their menu words in each language.
- **Voice:** Kokoro-82M (Apache 2.0), offline. English `am_michael` at 1.08x; Spanish `ef_dora`
  (the other Spanish voices are `em_alex` and `em_santa`: pass one as a third argument).
  `pip install kokoro-onnx soundfile`, then download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 into one folder.
  `SAY` in `voice.py` respells what the voice would say wrong: "USCIS", "65/20", and in Spanish the
  app's English button names.
- **Sound:** `tools/sfx.py` synthesizes the effects and, through `tools/music.py`, an original
  lo-fi bed. Nothing is sampled or licensed.
- **Test pictures:** in `promo/`, `COMP=HowToEs node tools/stills.mjs 120 900 2400` (frame numbers)
  writes half-size PNGs to `out/stills/`.

In a cloud session, point Remotion at the preinstalled Chromium:

```
export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

Licences: Remotion (`node_modules/remotion/LICENSE.md`) is free for individuals, non-profits and
companies of up to three people; other for-profit companies need a company licence. Kokoro's
weights are Apache 2.0. The fonts and pictures are the app's own (`CREDITS.md`).
