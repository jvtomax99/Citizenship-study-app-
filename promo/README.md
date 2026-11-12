# promo: the how-to video, written in code

A [Remotion](https://www.remotion.dev) 4 project, copied from the CPA app's `promo/` (itself set up
like the Interpreter Hub's). It is not part of the app: nothing in `index.html` loads this folder.
The finished videos are `media/how-to-use-en.mp4` and `media/how-to-use-es.mp4` (posters beside
them), played on the guide screen (`#/guide`, `VIDEO` in `js/more.js`).

Vertical 1080 x 1920 at 30 fps, once per language (English 2:14, Spanish 2:40). Thirteen scenes: the
hook (128 questions, 20 asked, 12 to pass), the title, adding the app to the Home Screen (iPhone,
Android, the icon), the state, Study cards, Drill, the Mock interview, the 65/20 list, the daily
goal and the Mall, Backup, and the close (not made by USCIS).

## Making it again

From the repo root, with `python3 -m http.server 8123` running:

```
node promo/tools/capture.cjs                          # screenshots of the real app -> promo/public/shots/, promo/src/layout.json
python3 promo/tools/voice_eleven.py en                 # narration -> promo/public/voice/en/, promo/src/timing.en.json
python3 promo/tools/voice_eleven.py es
python3 promo/tools/sfx.py 180                        # sound effects and the music bed
python3 promo/tools/script_page.py                    # SCRIPT.md, the words side by side
cd promo
npm install
npm run studio                                        # preview, scrub the timeline
npm run render:en && sh tools/finish.sh en            # -> out/, then levelled and compressed -> ../media/
npm run render:es && sh tools/finish.sh es
```

- **Words:** `src/script.en.json` and `src/script.es.json` (the same scenes and line count in
  both). Each line is spoken and shown as a subtitle; `head` is the scene's two-line headline.
  After changing a line, run `voice_eleven.py` again: scene lengths follow the narration. Other words
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
- **Voice:** ElevenLabs (Jose's pick, 2026-11-12), model `eleven_multilingual_v2`: Brian in
  English, Matilda in Spanish at 1.08x. `tools/voice_eleven.py` records every line; it needs an
  ElevenLabs API key with Text to Speech allowed (saved on the cloud environment for
  `api.elevenlabs.io`) and spends about 2,000 characters per language on each run. `SAY` in it
  respells "USCIS" and "65/20" for the voice. The first version used the free offline Kokoro
  voice; `tools/voice.py` still does that (`pip install kokoro-onnx soundfile`, model files from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0).
- **Sound:** `tools/sfx.py` synthesizes the effects and, through `tools/music.py`, an original
  lo-fi bed. Nothing is sampled or licensed.
- **Test pictures:** in `promo/`, `COMP=HowToEs node tools/stills.mjs 120 900 2400` (frame numbers)
  writes half-size PNGs to `out/stills/`.

In a cloud session, point Remotion at the preinstalled Chromium:

```
export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

Licences: Remotion (`node_modules/remotion/LICENSE.md`) is free for individuals, non-profits and
companies of up to three people; other for-profit companies need a company licence. The
narration is ElevenLabs output on Jose's account (`CREDITS.md`). The fonts and pictures are the app's own (`CREDITS.md`).
