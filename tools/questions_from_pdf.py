#!/usr/bin/env python3
"""Read the USCIS 128-question PDF and turn it into question records.

Two uses:
  python3 tools/questions_from_pdf.py --write   rebuild data/questions.json from the PDF
  python3 tools/questions_from_pdf.py           check data/questions.json still matches the PDF

The check is word for word: every question, answer, note and 65/20 mark in the
JSON must equal what the PDF says. It needs pdftotext (poppler-utils).
Run from the repo root.
"""
import json
import re
import subprocess
import sys

PDF = "sources/uscis-2025-civics-128.pdf"
OUT = "data/questions.json"
ES = "data/es.json"

SECTIONS = {
    "AMERICAN GOVERNMENT": "government",
    "AMERICAN HISTORY": "history",
    "SYMBOLS AND HOLIDAYS": "symbols",
}

# Answers that depend on where the applicant lives, or on who holds an office now.
STATE_ANSWERS = {"Answers will vary."}
OFFICE_RE = re.compile(r"^Visit uscis\.gov/citizenship/testupdates for the name of the (.+)\.$")


def clean(s):
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip()


def pdf_text():
    return subprocess.run(
        ["pdftotext", "-layout", PDF, "-"], check=True, capture_output=True, text=True
    ).stdout


def parse(text):
    lines = text.splitlines()
    # The questions start at the first section heading.
    start = next(i for i, l in enumerate(lines) if l.strip() == "AMERICAN GOVERNMENT")
    section = sub = sub_title = None
    questions = []
    q = None          # question being read
    cur = None        # answer being read (continuation lines join it)
    in_question = False

    def finish():
        if q is None:
            return
        # Pull the bracketed notes out of the answers.
        answers = []
        for a in q["_answers"]:
            a = clean(a)
            note = None
            m = re.match(r"^(.*?)\s*\[(.+)\]$", a)
            if m:
                a, note = m.group(1), m.group(2)
            answers.append({"text": a, **({"note": note} if note else {})})
        q["answers"] = answers
        del q["_answers"]
        q["question"] = clean(q["question"])
        if q["question"].endswith("*"):
            q["question"] = q["question"][:-1].rstrip()
            q["star6520"] = True
        else:
            q["star6520"] = False
        kind = "fixed"
        if any(a["text"] in STATE_ANSWERS for a in answers):
            kind = "where-you-live"
        elif any(OFFICE_RE.match(a["text"]) for a in answers):
            kind = "current-official"
        q["kind"] = kind
        questions.append(q)

    for raw in lines[start:]:
        line = raw.rstrip()
        s = line.strip()
        if not s or re.search(r"\d+ of 19\s+uscis\.gov/citizenship$", s):
            continue
        if s in SECTIONS:
            section = SECTIONS[s]
            continue
        m = re.match(r"^([A-C]): (.+)$", s)
        if m and not raw.startswith("     "):
            sub, sub_title = m.group(1), m.group(2)
            continue
        m = re.match(r"^(\d+)\. (.+)$", s)
        if m and not raw.startswith("      "):
            finish()
            q = {
                "id": int(m.group(1)),
                "section": section,
                "part": sub,
                "partTitle": sub_title,
                "question": m.group(2),
                "_answers": [],
            }
            cur = None
            in_question = True
            continue
        if s.startswith("•"):
            q["_answers"].append(s[1:].strip())
            cur = len(q["_answers"]) - 1
            in_question = False
            continue
        if s.startswith("For a complete list of tribes"):
            q["listNote"] = clean(s)
            continue
        # A continuation line: of the question if no answer yet, else of the last answer.
        if in_question:
            q["question"] += " " + s
        elif cur is not None:
            q["_answers"][cur] += " " + s
        else:
            raise SystemExit(f"Unplaced line: {line!r}")
    finish()
    return questions


def check_spanish(english):
    """Spanish must cover every question, one translation per answer and per note."""
    with open(ES, encoding="utf-8") as f:
        es = json.load(f)["questions"]
    problems = []
    for q in english:
        t = es.get(str(q["id"]))
        if not t:
            problems.append(f"Spanish: question {q['id']} missing")
            continue
        if len(t["a"]) != len(q["answers"]):
            problems.append(f"Spanish: question {q['id']} has {len(t['a'])} answers, English has {len(q['answers'])}")
        want = {str(i) for i, a in enumerate(q["answers"]) if "note" in a}
        if set(t.get("notes", {})) != want:
            problems.append(f"Spanish: question {q['id']} notes on answers {sorted(t.get('notes', {}))}, English {sorted(want)}")
        if ("listNote" in q) != ("listNote" in t):
            problems.append(f"Spanish: question {q['id']} list note missing on one side")
    if len(es) != len(english):
        problems.append(f"Spanish has {len(es)} questions, English {len(english)}")
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"{len(problems)} problem(s) in {ES}.")
    done = sum(t.get("checked") is True for t in es.values())
    print(f"OK: Spanish covers all {len(english)} questions; {done} checked by Jose so far.")


def main():
    questions = parse(pdf_text())
    ids = [q["id"] for q in questions]
    assert ids == list(range(1, 129)), f"Expected questions 1 to 128, got {len(ids)}"
    stars = sum(q["star6520"] for q in questions)
    assert stars == 20, f"Expected 20 questions marked for 65/20, got {stars}"

    if "--write" in sys.argv:
        doc = {
            "source": {
                "title": "128 Civics Questions and Answers (2025 version)",
                "form": "M-1778 (09/25)",
                "publisher": "U.S. Citizenship and Immigration Services",
                "url": "https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf",
                "file": PDF,
                "rules": {
                    "asked": 20, "toPass": 12, "stopWrong": 9,
                    "asked6520": 10, "toPass6520": 6,
                },
            },
            "questions": questions,
        }
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(f"Wrote {OUT}: {len(questions)} questions, {stars} marked for 65/20.")
        return

    with open(OUT, encoding="utf-8") as f:
        saved = json.load(f)["questions"]
    problems = []
    keys = ("id", "section", "part", "partTitle", "question", "answers", "star6520", "kind", "listNote")
    for want, got in zip(questions, saved):
        for k in keys:
            if want.get(k) != got.get(k):
                problems.append(f"Question {want['id']}, {k}: PDF says {want.get(k)!r}, file says {got.get(k)!r}")
    if len(saved) != len(questions):
        problems.append(f"File has {len(saved)} questions, PDF has {len(questions)}")
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"{len(problems)} mismatch(es) with the USCIS PDF.")
    check_spanish(saved)
    print(f"OK: all {len(questions)} questions match the USCIS PDF word for word ({stars} marked for 65/20).")


if __name__ == "__main__":
    main()
