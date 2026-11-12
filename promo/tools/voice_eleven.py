"""Narration for the how-to video with ElevenLabs voices (Jose's pick, 2026-11-12), from
promo/src/script.<lang>.json. English: Brian. Spanish: Matilda. Model eleven_multilingual_v2.
Needs an ElevenLabs API key with Text to Speech allowed: in a cloud session it is saved on the
environment for api.elevenlabs.io and added to the request for us; elsewhere set ELEVENLABS_API_KEY.
Each run spends characters on the account (about 2,400 per language).
Run from the repo root: python3 promo/tools/voice_eleven.py <en|es>
Writes promo/public/voice/<lang>/<scene>-<n>.wav and promo/src/timing.<lang>.json (each line's
length in seconds). SAY rewrites what the voice would say wrong; the subtitles keep the script's
text. The free offline voice is still there in voice.py."""
import json, os, subprocess, sys, urllib.request
import soundfile as sf

VOICES = {"en": ("Brian", "nPczCjzI2devNBz1zQrb", 1.0), "es": ("Matilda", "XrExE9yKIg1WjnnlVkGX", 1.08)}
SAY = {
    "en": {"uscis.gov": "U.S.C.I.S. dot gov", "USCIS": "U.S.C.I.S.", "65/20": "sixty-five twenty"},
    "es": {"uscis.gov": "u ese ce i ese punto gov", "USCIS": "u ese ce i ese", "65/20": "sesenta y cinco veinte"},
}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lang = sys.argv[1]
name, voice, speed = VOICES[lang]
script = json.load(open(os.path.join(root, "src", f"script.{lang}.json"), encoding="utf8"))
out = os.path.join(root, "public", "voice", lang)
os.makedirs(out, exist_ok=True)
lines = [(s["id"], i, l) for s in script for i, l in enumerate(s["lines"])]
timing, chars = {}, 0
for n, (sid, i, line) in enumerate(lines):
    said = line
    for a, b in SAY[lang].items(): said = said.replace(a, b)
    body = {"text": said, "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "speed": speed},
            # the lines before and after, so the voice keeps one tone across the video
            "previous_text": lines[n - 1][2] if n else "", "next_text": lines[n + 1][2] if n + 1 < len(lines) else ""}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    mp3 = os.path.join(out, f"{sid}-{i}.mp3"); wav = mp3[:-4] + ".wav"
    open(mp3, "wb").write(urllib.request.urlopen(req, timeout=120).read())
    # to WAV, with the silence at both ends cut so every line starts on its first word
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp3, "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.08",
        "-ar", "44100", "-ac", "1", wav], check=True)
    os.remove(mp3)
    timing[f"{sid}-{i}.wav"] = round(sf.info(wav).duration, 3); chars += len(said)
    print(f"{sid}-{i}.wav: {timing[f'{sid}-{i}.wav']:.2f}s")
json.dump(timing, open(os.path.join(root, "src", f"timing.{lang}.json"), "w"), indent=1)
print(f"total speech {sum(timing.values()):.1f}s, voice {name}, {chars} characters")
