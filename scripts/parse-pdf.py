#!/usr/bin/env python3
"""Parse the fetal-pig dissection Quizlet PDF into flashcard term/definition pairs.

The PDF visually lays out three columns per entry: number (~x=20), term
(~x=54), definition (~x=189+). pdftotext sometimes merges term+definition
into a single block when the term wraps; to handle that uniformly, this
script works at the word level (each word has its own bbox), groups words
into rows by y-coordinate, then splits each row into term-column and
definition-column words by xMin.

Usage:
    pdftotext -bbox-layout public/study-materials/pig-dissection.pdf out.html
    python3 scripts/parse-pdf.py out.html src/data/decks.ts
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass

import defusedxml.ElementTree as ET

NS = {"x": "http://www.w3.org/1999/xhtml"}

# A word with xMin below this is in the term column; at or above is the
# definition column. The PDF's natural definition column starts at xMin=189.035.
# We pick a threshold just below it so wide term words (e.g. "lata" at x≈154)
# stay on the term side.
DEF_COLUMN_X = 185.0
# Rows whose words share approximately the same yMin (1pt tolerance).
ROW_TOL = 1.0
# Header/footer text we always drop.
HEADER_PATTERNS = [
    re.compile(r"^pig dissection 2026$", re.I),
    re.compile(r"^Study online at", re.I),
    re.compile(r"^\d+\s*/\s*\d+$"),
]


@dataclass(frozen=True)
class Word:
    page: int
    x_min: float
    y_min: float
    text: str


@dataclass
class Row:
    page: int
    y_min: float
    words: list[Word]

    def text(self, *, term_only: bool = False, def_only: bool = False) -> str:
        ws = sorted(self.words, key=lambda w: w.x_min)
        if term_only:
            ws = [w for w in ws if w.x_min < DEF_COLUMN_X]
        elif def_only:
            ws = [w for w in ws if w.x_min >= DEF_COLUMN_X]
        return " ".join(w.text for w in ws).strip()


def _is_header_row(row: Row) -> bool:
    txt = row.text()
    return any(p.match(txt) for p in HEADER_PATTERNS)


def collect_words(xhtml_path: str) -> list[Word]:
    tree = ET.parse(xhtml_path)
    words: list[Word] = []
    for page_idx, page_el in enumerate(
        tree.getroot().iter("{http://www.w3.org/1999/xhtml}page"),
        start=1,
    ):
        for w_el in page_el.iter("{http://www.w3.org/1999/xhtml}word"):
            text = (w_el.text or "").strip()
            if not text:
                continue
            words.append(
                Word(
                    page=page_idx,
                    x_min=float(w_el.attrib["xMin"]),
                    y_min=float(w_el.attrib["yMin"]),
                    text=text,
                )
            )
    return words


def group_rows(words: list[Word]) -> list[Row]:
    """Cluster words into rows: same page + similar yMin (within ROW_TOL)."""
    rows: list[Row] = []
    by_page: dict[int, list[Word]] = {}
    for w in words:
        by_page.setdefault(w.page, []).append(w)
    for page in sorted(by_page):
        page_words = sorted(by_page[page], key=lambda w: w.y_min)
        current: Row | None = None
        for w in page_words:
            if current is None or abs(w.y_min - current.y_min) > ROW_TOL:
                current = Row(page=page, y_min=w.y_min, words=[w])
                rows.append(current)
            else:
                current.words.append(w)
    return rows


@dataclass
class Entry:
    number: int
    term_lines: list[str]
    def_lines: list[str]


def collect_entries(rows: list[Row]) -> list[Entry]:
    entries: list[Entry] = []
    current: Entry | None = None

    num_re = re.compile(r"^(\d+)\.$")

    for row in rows:
        if _is_header_row(row):
            continue
        # Identify a "number word" in this row: the leftmost word matching N.
        words = sorted(row.words, key=lambda w: w.x_min)
        num: int | None = None
        consumed_idxs: set[int] = set()
        if words:
            m = num_re.match(words[0].text)
            if m:
                num = int(m.group(1))
                consumed_idxs.add(0)
            else:
                # 3-digit and some 2-digit entries: number is glued to first
                # term word, e.g. "100." actually arrives as "100." here too,
                # but in some pages the first word is "100." with the term
                # starting in the second word. The standalone-"\d+\." form
                # already handled above.
                pass
        if num is not None:
            current = Entry(number=num, term_lines=[], def_lines=[])
            entries.append(current)
        if current is None:
            continue

        term_words = [
            w
            for i, w in enumerate(words)
            if i not in consumed_idxs and w.x_min < DEF_COLUMN_X
        ]
        def_words = [w for w in words if w.x_min >= DEF_COLUMN_X]
        if term_words:
            current.term_lines.append(" ".join(w.text for w in term_words))
        if def_words:
            current.def_lines.append(" ".join(w.text for w in def_words))

    return entries


def join_hyphenated(lines: list[str]) -> str:
    """Join lines whose previous line ends with a hyphen."""
    out: list[str] = []
    pending = ""
    for line in lines:
        s = (pending + line).strip() if pending else line.strip()
        pending = ""
        if s.endswith("-"):
            pending = s[:-1]
            continue
        out.append(s)
    if pending:
        out.append(pending)
    return "\n".join(out)


def normalize_term(lines: list[str]) -> str:
    joined = join_hyphenated(lines)
    parts = [p.strip() for p in joined.splitlines() if p.strip()]
    return " ".join(parts)


def normalize_definition(lines: list[str]) -> str:
    joined = join_hyphenated(lines)
    parts = [p.strip() for p in joined.splitlines() if p.strip()]
    return "\n".join(parts)


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "card"


def render_typescript(cards: list[tuple[int, str, str]]) -> str:
    seen_ids: set[str] = set()
    items: list[dict[str, str]] = []
    for num, term, definition in cards:
        base_id = slugify(term)[:60] or f"card-{num}"
        cid = base_id
        suffix = 2
        while cid in seen_ids:
            cid = f"{base_id}-{suffix}"
            suffix += 1
        seen_ids.add(cid)
        items.append({"id": cid, "front": term, "back": definition})

    lines: list[str] = [
        "// Generated by scripts/parse-pdf.py from public/study-materials/pig-dissection.pdf.",
        "// Edit the PDF (and re-run the script) rather than hand-editing this file.",
        "",
        "export type Card = {",
        "  id: string;",
        "  front: string;",
        "  back: string;",
        "  hint?: string;",
        "};",
        "",
        "export type Deck = {",
        "  id: string;",
        "  title: string;",
        "  description: string;",
        "  cards: Card[];",
        "};",
        "",
        "export const pigAnatomyDeck: Deck = {",
        '  id: "pig-anatomy",',
        '  title: "Fetal Pig Dissection",',
        '  description: "Terms and definitions extracted from the fetal pig dissection lab guide PDF.",',
        "  cards: [",
    ]
    for item in items:
        lines.append("    {")
        lines.append(f"      id: {json.dumps(item['id'])},")
        lines.append(f"      front: {json.dumps(item['front'])},")
        lines.append(f"      back: {json.dumps(item['back'])},")
        lines.append("    },")
    lines.append("  ],")
    lines.append("};")
    lines.append("")
    lines.append("export const decks: Deck[] = [pigAnatomyDeck];")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <bbox-xhtml> <output.ts>", file=sys.stderr)
        sys.exit(2)
    src, dst = sys.argv[1], sys.argv[2]

    words = collect_words(src)
    rows = group_rows(words)
    entries = collect_entries(rows)

    cards: list[tuple[int, str, str]] = []
    for e in entries:
        term = normalize_term(e.term_lines)
        definition = normalize_definition(e.def_lines)
        cards.append((e.number, term, definition))
    cards.sort(key=lambda c: c[0])

    expected = 200
    nums = sorted(c[0] for c in cards)
    if len(cards) != expected:
        print(
            f"Warning: parsed {len(cards)} cards, expected {expected}",
            file=sys.stderr,
        )
    missing = [i for i in range(1, expected + 1) if i not in nums]
    if missing:
        print(f"Missing card numbers: {missing}", file=sys.stderr)
    duplicates = sorted({n for n in nums if nums.count(n) > 1})
    if duplicates:
        print(f"Duplicate card numbers: {duplicates}", file=sys.stderr)
    empties = [n for n, t, d in cards if not t or not d]
    if empties:
        print(f"Cards with empty term or definition: {empties}", file=sys.stderr)

    ts = render_typescript(cards)
    with open(dst, "w") as f:
        f.write(ts)
    print(f"Wrote {len(cards)} cards to {dst}")


if __name__ == "__main__":
    main()
