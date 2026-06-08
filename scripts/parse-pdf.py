#!/usr/bin/env python3
"""Parse the fetal-pig dissection Quizlet PDF into flashcard term/definition
pairs and extract per-card images.

Text extraction uses pdftotext bbox-layout (word level + column split by
xMin); image extraction uses PyMuPDF for xref → file + per-placement bbox.
A card is associated with an image whose top edge sits between the card's
yMin and the next card's yMin on the same page (or, for an image that
appears above the first card on a page, the last card on the previous page).

Usage:
    pdftotext -bbox-layout public/study-materials/pig-dissection.pdf out.html
    python3 scripts/parse-pdf.py out.html public/study-materials/pig-dissection.pdf src/data/decks.ts
"""
from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass, field

import defusedxml.ElementTree as ET
import pymupdf

NS = {"x": "http://www.w3.org/1999/xhtml"}

# Word in the term column has xMin < this; otherwise definition column.
DEF_COLUMN_X = 185.0
# Words within 1pt of the same yMin are the same row.
ROW_TOL = 1.0
# Page header / footer text we always drop.
HEADER_PATTERNS = [
    re.compile(r"^pig dissection 2026$", re.I),
    re.compile(r"^Study online at", re.I),
    re.compile(r"^\d+\s*/\s*\d+$"),
]
# Watermark logo size: 38pt square in the top-left corner of every page.
WATERMARK_MAX_DIM = 60.0
# Where extracted images are written, served from /study-materials/images/.
IMAGE_OUT_DIR = "public/study-materials/images"
IMAGE_URL_PREFIX = "/study-materials/images"


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

    def text(self) -> str:
        ws = sorted(self.words, key=lambda w: w.x_min)
        return " ".join(w.text for w in ws).strip()


@dataclass
class Entry:
    number: int
    page: int
    y_min: float
    term_lines: list[str] = field(default_factory=list)
    def_lines: list[str] = field(default_factory=list)
    image_url: str | None = None


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
    by_page: dict[int, list[Word]] = {}
    for w in words:
        by_page.setdefault(w.page, []).append(w)

    rows: list[Row] = []
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


def collect_entries(rows: list[Row]) -> list[Entry]:
    num_re = re.compile(r"^(\d+)\.$")
    entries: list[Entry] = []
    current: Entry | None = None
    for row in rows:
        if _is_header_row(row):
            continue
        words = sorted(row.words, key=lambda w: w.x_min)
        consumed = 0
        if words:
            m = num_re.match(words[0].text)
            if m:
                num = int(m.group(1))
                current = Entry(number=num, page=row.page, y_min=row.y_min)
                entries.append(current)
                consumed = 1
        if current is None:
            continue
        term_words = [w for w in words[consumed:] if w.x_min < DEF_COLUMN_X]
        def_words = [w for w in words if w.x_min >= DEF_COLUMN_X]
        if term_words:
            current.term_lines.append(" ".join(w.text for w in term_words))
        if def_words:
            current.def_lines.append(" ".join(w.text for w in def_words))
    return entries


def join_hyphenated(lines: list[str]) -> str:
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
    return " ".join(p.strip() for p in joined.splitlines() if p.strip())


def normalize_definition(lines: list[str]) -> str:
    joined = join_hyphenated(lines)
    return "\n".join(p.strip() for p in joined.splitlines() if p.strip())


@dataclass
class ImagePlacement:
    page: int
    xref: int
    y_min: float
    y_max: float
    file_name: str


def extract_images(pdf_path: str) -> list[ImagePlacement]:
    """Extract every non-watermark image to IMAGE_OUT_DIR (deduped by xref) and
    return one ImagePlacement per visual occurrence."""
    os.makedirs(IMAGE_OUT_DIR, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    saved_files: dict[int, str] = {}
    placements: list[ImagePlacement] = []

    for page_idx, page in enumerate(doc, start=1):
        for img in page.get_images(full=True):
            xref = img[0]
            for rect in page.get_image_rects(xref):
                # Skip the corner watermark logo.
                if rect.width < WATERMARK_MAX_DIM and rect.height < WATERMARK_MAX_DIM:
                    continue
                if xref not in saved_files:
                    blob = doc.extract_image(xref)
                    ext = blob["ext"] or "png"
                    file_name = f"img-{xref}.{ext}"
                    path = os.path.join(IMAGE_OUT_DIR, file_name)
                    with open(path, "wb") as f:
                        f.write(blob["image"])
                    saved_files[xref] = file_name
                placements.append(
                    ImagePlacement(
                        page=page_idx,
                        xref=xref,
                        y_min=float(rect.y0),
                        y_max=float(rect.y1),
                        file_name=saved_files[xref],
                    )
                )
    return placements


def attach_images(entries: list[Entry], placements: list[ImagePlacement]) -> None:
    """Mutate entries in place to set image_url based on bbox proximity.

    Rule: an image belongs to the entry with the largest y_min that is still
    <= the image's y_min on the same page. If no such entry exists on that
    page, the image belongs to the last entry from any earlier page.
    """
    entries_by_page: dict[int, list[Entry]] = {}
    for e in entries:
        entries_by_page.setdefault(e.page, []).append(e)
    for page_entries in entries_by_page.values():
        page_entries.sort(key=lambda e: e.y_min)

    sorted_entries = sorted(entries, key=lambda e: (e.page, e.y_min))

    def find_entry(p: ImagePlacement) -> Entry | None:
        page_entries = entries_by_page.get(p.page, [])
        candidate = None
        for e in page_entries:
            if e.y_min <= p.y_min:
                candidate = e
            else:
                break
        if candidate is not None:
            return candidate
        # Spillover: latest entry that started before this page.
        previous = [e for e in sorted_entries if e.page < p.page]
        return previous[-1] if previous else None

    for placement in sorted(placements, key=lambda p: (p.page, p.y_min)):
        entry = find_entry(placement)
        if entry is None:
            continue
        # Each entry only gets one image. The first match (top-down in page
        # order) wins, which matches the visual: the image immediately under
        # the entry's text is its illustration.
        if entry.image_url is None:
            entry.image_url = f"{IMAGE_URL_PREFIX}/{placement.file_name}"


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "card"


def render_typescript(cards: list[Entry]) -> str:
    seen_ids: set[str] = set()
    items: list[dict] = []
    for entry in cards:
        term = normalize_term(entry.term_lines)
        definition = normalize_definition(entry.def_lines)
        base_id = slugify(term)[:60] or f"card-{entry.number}"
        cid = base_id
        suffix = 2
        while cid in seen_ids:
            cid = f"{base_id}-{suffix}"
            suffix += 1
        seen_ids.add(cid)
        items.append(
            {
                "id": cid,
                "front": term,
                "back": definition,
                "image": entry.image_url,
            }
        )

    lines: list[str] = [
        "// Generated by scripts/parse-pdf.py from public/study-materials/pig-dissection.pdf.",
        "// Edit the PDF (and re-run the script) rather than hand-editing this file.",
        "",
        "export type Card = {",
        "  id: string;",
        "  front: string;",
        "  back: string;",
        "  image?: string;",
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
        if item["image"]:
            lines.append(f"      image: {json.dumps(item['image'])},")
        lines.append("    },")
    lines.append("  ],")
    lines.append("};")
    lines.append("")
    lines.append("export const decks: Deck[] = [pigAnatomyDeck];")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if len(sys.argv) < 4:
        print(
            f"Usage: {sys.argv[0]} <bbox-xhtml> <pdf-path> <output.ts>",
            file=sys.stderr,
        )
        sys.exit(2)
    xhtml_path, pdf_path, dst = sys.argv[1], sys.argv[2], sys.argv[3]

    words = collect_words(xhtml_path)
    rows = group_rows(words)
    entries = collect_entries(rows)
    entries.sort(key=lambda e: e.number)

    placements = extract_images(pdf_path)
    attach_images(entries, placements)

    expected = 200
    nums = [e.number for e in entries]
    if len(entries) != expected:
        print(
            f"Warning: parsed {len(entries)} cards, expected {expected}",
            file=sys.stderr,
        )
    missing = [i for i in range(1, expected + 1) if i not in nums]
    if missing:
        print(f"Missing card numbers: {missing}", file=sys.stderr)
    duplicates = sorted({n for n in nums if nums.count(n) > 1})
    if duplicates:
        print(f"Duplicate card numbers: {duplicates}", file=sys.stderr)
    empties = [
        e.number for e in entries if not e.term_lines or not e.def_lines
    ]
    if empties:
        print(f"Cards with empty term or definition: {empties}", file=sys.stderr)
    with_image = sum(1 for e in entries if e.image_url)
    print(
        f"Wrote {len(entries)} cards ({with_image} with images) to {dst}",
        file=sys.stderr,
    )

    ts = render_typescript(entries)
    with open(dst, "w") as f:
        f.write(ts)


if __name__ == "__main__":
    main()
