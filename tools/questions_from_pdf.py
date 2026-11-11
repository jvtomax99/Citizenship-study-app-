#!/usr/bin/env python3
"""Read the USCIS 128-question PDF and turn it into question records.

Two uses:
  python3 tools/questions_from_pdf.py --write   rebuild data/questions.json from the PDF
  python3 tools/questions_from_pdf.py           check data/questions.json still matches the PDF

The check is word for word: every question, answer, note and 65/20 mark in the
JSON must equal what the PDF says. Two routes so a parser bug can't pass itself:
the layout parse, and a plain-text read where every string must appear verbatim
and the answers must equal the bullets. Fixed facts (EXPECT) are pinned too. It needs pdftotext (poppler-utils).
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
# How many answers the officer wants. The PDF underlines the count word, which
# text extraction loses, so it is read from the wording instead and pinned below.
NEED_RE = re.compile(r"\b(?:Name|What are) (two|three|five)\b")
NEED_WORDS = {"two": 2, "three": 3, "five": 5}

# Fixed facts about the PDF. A parser bug can't hide behind these.
EXPECT = {
    "stars": [2, 7, 12, 20, 30, 36, 38, 39, 44, 52, 61, 66, 74, 78, 86, 94, 113, 115, 121, 126],
    "notes": [23, 29, 61, 62, 120],
    "need": {10: 2, 48: 2, 65: 3, 67: 2, 69: 2, 81: 5, 126: 3},
    "answers": 410,
    "counts": {48: 22, 81: 13, 117: 25, 126: 11},
}

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
        m = NEED_RE.search(q["question"])
        q["need"] = NEED_WORDS[m.group(1)] if m else 1
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
            indent = len(raw) - len(raw.lstrip())
            if not 6 <= indent <= 10:
                raise SystemExit(f"Line that is neither an answer nor its continuation: {line!r}")
            q["_answers"][cur] += " " + s
        else:
            raise SystemExit(f"Unplaced line: {line!r}")
    finish()
    return questions


def check_expectations(questions):
    problems = []
    def want(cond, msg):
        if not cond:
            problems.append(msg)
    want([q["id"] for q in questions] == list(range(1, 129)), "Question ids are not 1 to 128")
    want([q["id"] for q in questions if q["star6520"]] == EXPECT["stars"], "65/20 marks differ from the PDF's 20")
    want([q["id"] for q in questions if any("note" in a for a in q["answers"])] == EXPECT["notes"], "Bracketed notes moved")
    want({q["id"]: q["need"] for q in questions if q["need"] > 1} == EXPECT["need"], "Answer counts asked for (need) differ")
    want(sum(len(q["answers"]) for q in questions) == EXPECT["answers"], "Total answers is not 410")
    for i, n in EXPECT["counts"].items():
        want(len(questions[i - 1]["answers"]) == n, f"Question {i} should have {n} answers")
    for q in questions:
        for a in q["answers"]:
            want("[" not in a["text"] and "]" not in a["text"], f"Question {q['id']}: bracket left in an answer")
            want(len(a["text"]) < 200, f"Question {q['id']}: an answer is suspiciously long")
    return problems


def check_raw_text(questions):
    """Second route: plain pdftotext (no layout). Every question, answer and note
    must appear in it verbatim, and the number of answers must equal the bullets."""
    raw = subprocess.run(["pdftotext", PDF, "-"], check=True, capture_output=True, text=True).stdout
    flat = clean(raw)
    problems = []
    for q in questions:
        for t in [q["question"]] + [a["text"] for a in q["answers"]] + [a["note"] for a in q["answers"] if "note" in a]:
            if t not in flat:
                problems.append(f"Question {q['id']}: not found verbatim in the PDF: {t!r}")
    bullets = raw.count("\u2022")
    if bullets != sum(len(q["answers"]) for q in questions):
        problems.append(f"PDF has {bullets} bullets, file has {sum(len(q['answers']) for q in questions)} answers")
    return problems


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
        if any(not a.strip() for a in t["a"]) or not t["q"].strip():
            problems.append(f"Spanish: question {q['id']} has an empty line")
        bad = [g for g in t.get("glosses", {}) if not g.isdigit() or int(g) >= len(t["a"])]
        if bad:
            problems.append(f"Spanish: question {q['id']} glosses point at no answer: {bad}")
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
    stars = sum(q["star6520"] for q in questions)
    problems = check_expectations(questions) + check_raw_text(questions)
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"{len(problems)} problem(s) reading the PDF.")

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
    keys = ("id", "section", "part", "partTitle", "question", "answers", "star6520", "kind", "need", "listNote")
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
