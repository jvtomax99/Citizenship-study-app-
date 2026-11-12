"""Narration for the how-to video, from promo/src/script.<lang>.json (lang: en or es).
Voice: Kokoro-82M (Apache 2.0, runs offline). Setup:
  pip install kokoro-onnx soundfile
  download kokoro-v1.0.onnx and voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Run from the repo root: python3 promo/tools/voice.py <folder holding the two model files> <en|es> [voice]
Writes promo/public/voice/<lang>/<scene>-<n>.wav and promo/src/timing.<lang>.json (each line's
length in seconds). SAY rewrites words as they should be said aloud; the subtitles keep the
script's text. In Spanish the app's English button names are respelled so a Spanish voice
says them close to English."""
import json, os, sys
import soundfile as sf
from kokoro_onnx import Kokoro

VOICES = {"en": ("am_michael", 1.08, "en-us"), "es": ("ef_dora", 1.0, "es")}
SAY = {
    "en": {"USCIS": "U S C I S", "uscis.gov": "U S C I S dot gov", "65/20": "sixty-five twenty", "Español": "Espanyol"},
    "es": {"uscis.gov": "u ese ce i ese punto gov", "USCIS": "u ese ce i ese", "65/20": "sesenta y cinco veinte",
           "Citizenship Study": "Sítisenship Stádi", "Show answers": "Shou ánsers", "Check my answer": "Chek mai ánser",
           "Drill": "Dril", "Backup": "Bácap", "National Mall": "Náshonal Mol", "iPhone": "áifon", "Android": "ándroid",
           "Safari": "Safári", "Chrome": "Croum", "app": "ap", "internet": "internét"},
}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
models, lang = sys.argv[1], sys.argv[2]
voice, speed, code = VOICES[lang]
if len(sys.argv) > 3: voice = sys.argv[3]
k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
script = json.load(open(os.path.join(root, "src", f"script.{lang}.json"), encoding="utf8"))
out = os.path.join(root, "public", "voice", lang)
os.makedirs(out, exist_ok=True)
timing = {}
for scene in script:
    for i, line in enumerate(scene["lines"]):
        said = line
        for a, b in SAY[lang].items(): said = said.replace(a, b)
        samples, rate = k.create(said, voice=voice, speed=speed, lang=code)
        name = f"{scene['id']}-{i}.wav"
        sf.write(os.path.join(out, name), samples, rate)
        timing[name] = round(len(samples) / rate, 3)
        print(f"{name}: {timing[name]:.2f}s")
json.dump(timing, open(os.path.join(root, "src", f"timing.{lang}.json"), "w"), indent=1)
print(f"total speech {sum(timing.values()):.1f}s, voice {voice}")
