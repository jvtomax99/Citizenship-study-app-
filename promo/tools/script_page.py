"""Writes promo/SCRIPT.md: the narration in English and Spanish side by side, for reading.
Run from the repo root after changing a script: python3 promo/tools/script_page.py"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
en, es = (json.load(open(os.path.join(root, "src", f"script.{l}.json"), encoding="utf8")) for l in ("en", "es"))
out = ["# The video's words, English and Spanish", "",
       "Made from `src/script.en.json` and `src/script.es.json` by `tools/script_page.py`; change the words there.",
       "Each line is spoken and shown as a subtitle. The app's button names stay in English, as in the guide.",
       "Spanish: **draft, not yet read by Jose.**", ""]
n = 0
for a, b in zip(en, es):
    head = " ".join(x for x in a["head"] if x) or a["id"].capitalize()
    out += [f"## {head}", ""]
    if b["head"][0]: out += [f"Headline in Spanish: **{b['head'][0]} {b['head'][1]}**", ""]
    out += ["| # | English | Español |", "|---|---|---|"]
    for x, y in zip(a["lines"], b["lines"]):
        n += 1; out.append(f"| {n} | {x} | {y} |")
    out.append("")
open(os.path.join(root, "SCRIPT.md"), "w", encoding="utf8").write("\n".join(out))
print(n, "lines")
