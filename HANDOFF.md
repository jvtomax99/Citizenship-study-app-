# HANDOFF (written 2026-11-12: the app is live, with the how-to videos)

## Where things stand

- Live at https://jvtomax99.github.io/Citizenship-study-app-/ (GitHub Pages from
  `main`, on since 2026-11-12). Checked by script that day: it loads, the guide plays
  both videos, it opens with the network off. Jose installed it on his iPhone the same
  day: "It works". Step 6 is checked off.
- The how-to video is done in English and Spanish (SPEC.md feature 10, phase 7, pull
  request 6). It plays on the guide screen; `promo/README.md` says how to make it again.
- The test link https://citizenship-study-test.vercel.app is a separate copy with its
  own saved progress. Deploy a branch there before asking Jose to try new work.

## Next step

Ask Jose, with buttons and a phone notification (CLAUDE.md), which of these he wants:

- Step 4 voice test: one mock interview by voice in the browser, one from the icon.
  Step 4 is not checked off, and the video shows the microphone working.
- Read the app's Spanish (`data/es.json`, the 20 marked 65/20 first, and the guide).
  Until then the Spanish shows the "borrador" mark, also inside the video's study card.
- Show the app to one of the family. SPEC.md still has TO FILL: who they are.

## Good to know

- ElevenLabs: the key is saved on the cloud environment for `api.elevenlabs.io`. It can
  record but cannot list voices or show the plan. The voices are Brian (English) and
  Matilda (Spanish), ids in `promo/tools/voice_eleven.py`. A key must start with `sk_`
  and have Text to Speech allowed; a restricted key or the key's ID is refused.
- Changing a line of the video: edit `promo/src/script.<lang>.json`, record again,
  render (about 30 minutes per language on a 4-core cloud machine), `finish.sh`.
  `promo/public/shots`, `voice`, `sfx` and `music.mp3` are not in git: make them again
  with the commands in `promo/README.md` first.
- The videos' closing card shows the live address. The videos are 10 and 12 MB, play
  from the internet and are not saved for offline use.
- Recheck in early January 2027: Senator Booker's seat, New York's governor, and the
  Speaker after January 3 (`data/officials.json`).
- Site check workflow (CLAUDE.md) is still not set up. Step 5 leftovers still open:
  "Study cards" from a landmark goes back to the sections list; a drill round left open
  overnight treats a returning question as a retry.
- Cleanup audit: last ran 2026-11-11; two phases (6 and 7) finished since. Offer
  `docs/cleanup-audit.md` after the next phase.

## Files to look at first

SPEC.md, docs/ARCHITECTURE.md, promo/README.md, js/more.js.
