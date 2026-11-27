"""
NIC scan reader (OCR) for the admin "Register from NIC scan" feature.

Usage (called by the ASP.NET backend, prints JSON to stdout):
    python parse_nic.py <front-image-or-pdf> [<back-image-or-pdf>]

Reads a scanned Sri Lankan National Identity Card (JPG/PNG/BMP/TIFF/WEBP or PDF) with
RapidOCR and extracts:
    nicNumber    - old (9 digits + V/X) or new (12 digits) format
    fullName     - only when printed in English
    address      - only when printed in English
    dateOfBirth  - as printed on the card (yyyy-mm-dd), if found
    gender       - as printed on the card ("Male"/"Female"), if found
    lines        - every line of text that was read (for the admin to verify)
    warnings     - fields that could not be read

Date of birth and gender are also encoded in the NIC number itself; the frontend
derives them from the number, so they are filled even when the printed text is unreadable.

Requires: pip install rapidocr onnxruntime pymupdf pillow
(RapidOCR downloads its OCR models on first use, so the first run needs internet access.)
"""
import io
import json
import re
import sys
from datetime import date

import numpy as np
from PIL import Image, ImageOps

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

# Labels printed on NIC cards; used to know where a field's value starts/ends.
LABELS = {
    "name": r"(full\s*)?name",
    "address": r"address",
    "dob": r"date\s*of\s*birth|birth\s*date|d\.?o\.?b",
    "sex": r"sex|gender",
    "other": r"place\s*of\s*birth|date\s*of\s*issue|issue\s*date|date\s*of\s*expiry|holder'?s?\s*signature|"
             r"signature|national\s*identity\s*card|identity\s*card|democratic|socialist|republic|sri\s*lanka|"
             r"department|registration\s*of\s*persons|commissioner|nic\s*no|id\s*no|^no\b",
}
LABEL_RE = {k: re.compile(rf"^\s*(?:{v})\s*[:.\-]?\s*", re.IGNORECASE) for k, v in LABELS.items()}
ANY_LABEL_RE = re.compile("|".join(f"(?:{v})" for v in LABELS.values()), re.IGNORECASE)

# Characters OCR commonly confuses with digits
DIGIT_FIX = str.maketrans({"O": "0", "o": "0", "D": "0", "Q": "0", "I": "1", "l": "1", "|": "1", "i": "1",
                           "Z": "2", "z": "2", "S": "5", "s": "5", "B": "8", "G": "6", "b": "6", "T": "7"})


# ---------------------------------------------------------------- image loading

def load_images(path: str):
    """Returns the file as a list of RGB numpy images (one per PDF page)."""
    ext = path[path.rfind("."):].lower() if "." in path else ""
    if ext == ".pdf":
        import pymupdf  # PyMuPDF
        images = []
        with pymupdf.open(path) as doc:
            for page in list(doc)[:2]:  # front/back are at most 2 pages
                pix = page.get_pixmap(dpi=300)
                images.append(np.array(Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")))
        return images
    if ext in IMAGE_EXTS:
        img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        # Small phone/scanner thumbnails OCR badly; upscale so the card is ~2000px wide
        if max(img.size) < 1600:
            scale = 1600 / max(img.size)
            img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
        return [np.array(img)]
    raise ValueError(f"Unsupported file type: {ext or 'unknown'}")


# ---------------------------------------------------------------- OCR

_engine = None


def ocr_lines(image) -> list:
    """OCR an image and return its text grouped into visual lines, top to bottom."""
    global _engine
    if _engine is None:
        from rapidocr import RapidOCR
        _engine = RapidOCR()

    result = _engine(image)
    boxes = getattr(result, "boxes", None)
    txts = getattr(result, "txts", None)
    if boxes is None or txts is None:
        return []

    items = []
    for box, txt in zip(boxes, txts):
        ys = [p[1] for p in box]
        xs = [p[0] for p in box]
        items.append({"text": str(txt).strip(), "top": min(ys), "bottom": max(ys), "left": min(xs)})
    items = [i for i in items if i["text"]]
    items.sort(key=lambda i: (i["top"] + i["bottom"]) / 2)

    # Boxes whose vertical centre falls inside the current row's band belong to the same line
    rows = []
    for item in items:
        centre = (item["top"] + item["bottom"]) / 2
        if rows and rows[-1]["top"] <= centre <= rows[-1]["bottom"]:
            rows[-1]["items"].append(item)
        else:
            rows.append({"top": item["top"], "bottom": item["bottom"], "items": [item]})
    return [" ".join(i["text"] for i in sorted(r["items"], key=lambda i: i["left"])) for r in rows]


def rotate(image, quarter_turns: int):
    return np.ascontiguousarray(np.rot90(image, quarter_turns))


# ---------------------------------------------------------------- field parsing

def nic_dob_is_valid(nic: str) -> bool:
    """True when the birth year/day encoded in the NIC number is plausible."""
    if len(nic) == 12:
        year, days = int(nic[:4]), int(nic[4:7])
    else:
        year, days = 1900 + int(nic[:2]), int(nic[2:5])
    if days > 500:
        days -= 500
    return 1900 <= year <= date.today().year and 1 <= days <= 366


def find_nic(lines: list) -> str:
    candidates = []
    for line in lines:
        # Look at runs of digit-like characters (spaces are often inserted by OCR inside the number)
        for raw in re.findall(r"[0-9OoDQIl|iZzSsBGbT][0-9OoDQIl|iZzSsBGbT \-]{7,16}[0-9OoDQIl|iZzSsBGbTVvXx]", line):
            compact = re.sub(r"[ \-]", "", raw)
            body, tail = compact[:-1], compact[-1]
            if tail in "VvXx":
                fixed = body.translate(DIGIT_FIX) + tail.upper()
            else:
                fixed = compact.translate(DIGIT_FIX)
            # Overlapping matches: a stray letter next to the number (e.g. the "o" of "No") must not
            # shift the window; the birth-date check below picks the plausible one.
            for m in re.finditer(r"(?=(\d{12}|\d{9}[VX]))", fixed):
                nic = m.group(1)
                score = 2 if nic_dob_is_valid(nic) else 0
                if re.search(r"\bno\b|nic|number", line, re.IGNORECASE):
                    score += 1
                # Digits that needed no OCR correction are more trustworthy
                if nic in compact.upper():
                    score += 1
                candidates.append((score, nic))
    if not candidates:
        return ""
    candidates.sort(key=lambda c: -c[0])
    return candidates[0][1]


def label_of(line: str):
    for key in ("name", "address", "dob", "sex", "other"):
        if LABEL_RE[key].match(line):
            return key
    return None


def value_after_label(lines: list, index: int, key: str) -> str:
    """Text on the label's own line after the label, else the next non-label line."""
    same_line = LABEL_RE[key].sub("", lines[index], count=1).strip(" :.-")
    if same_line:
        return same_line
    for nxt in lines[index + 1:index + 3]:
        if not label_of(nxt):
            return nxt.strip()
    return ""


def clean_name(text: str) -> str:
    text = re.sub(r"[^A-Za-z.\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip(" .")
    if len(re.sub(r"[^A-Za-z]", "", text)) < 3:
        return ""
    # "H.M. KASUN PERERA" -> "H.M. Kasun Perera" (initials stay upper case)
    words = [w.upper() if "." in w or len(w) == 1 else w.capitalize() for w in text.split(" ")]
    return " ".join(words)


def find_name(lines: list) -> str:
    for i, line in enumerate(lines):
        if label_of(line) == "name":
            name = clean_name(value_after_label(lines, i, "name"))
            if name:
                return name
    return ""


def find_address(lines: list) -> str:
    for i, line in enumerate(lines):
        if label_of(line) != "address":
            continue
        parts = []
        first = LABEL_RE["address"].sub("", line, count=1).strip(" :.-")
        if first:
            parts.append(first)
        for nxt in lines[i + 1:i + 5]:
            if label_of(nxt) or ANY_LABEL_RE.search(nxt) or not re.search(r"[A-Za-z]{2}", nxt):
                break
            parts.append(nxt.strip(" ,"))
        address = ", ".join(p.strip(" ,") for p in parts if p.strip(" ,"))
        address = re.sub(r"\s+", " ", address)
        if re.search(r"[A-Za-z]{3}", address):
            return address
    return ""


DATE_PATTERNS = [
    (re.compile(r"(\d{4})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{1,2})"), ("y", "m", "d")),
    (re.compile(r"(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{4})"), ("d", "m", "y")),
]


def parse_date(text: str) -> str:
    for pattern, order in DATE_PATTERNS:
        m = pattern.search(text)
        if m:
            parts = dict(zip(order, (int(g) for g in m.groups())))
            try:
                return date(parts["y"], parts["m"], parts["d"]).isoformat()
            except ValueError:
                continue
    return ""


def find_dob(lines: list) -> str:
    for i, line in enumerate(lines):
        if label_of(line) == "dob" or LABEL_RE["dob"].search(line):
            found = parse_date(" ".join(lines[i:i + 2]))
            if found:
                return found
    return ""


def find_gender(lines: list) -> str:
    for i, line in enumerate(lines):
        if label_of(line) == "sex":
            value = value_after_label(lines, i, "sex").lower()
            if value.startswith("f"):
                return "Female"
            if value.startswith("m"):
                return "Male"
    joined = " ".join(lines).lower()
    if re.search(r"\bfemale\b", joined):
        return "Female"
    if re.search(r"\bmale\b", joined):
        return "Male"
    return ""


# ---------------------------------------------------------------- main

HEADER_RE = re.compile(r"identity\s*card|republic|sri\s*lanka", re.IGNORECASE)


def first_index(lines: list, test) -> int:
    return next((i for i, line in enumerate(lines) if test(line)), -1)


def orientation_score(lines: list) -> int:
    """How much the text looks like an upright card.

    OCR straightens individual words, so a rotated card can still be read word by word, but
    then lines merge (sideways) or come out bottom-to-top (upside down). Score labels found at
    the start of a line, a valid NIC number, and the fields appearing in their printed order.
    """
    score = sum(1 for line in lines if label_of(line))
    nic = find_nic(lines)
    if nic:
        score += 3
    name_i = first_index(lines, lambda l: label_of(l) == "name")
    addr_i = first_index(lines, lambda l: label_of(l) == "address")
    header_i = first_index(lines, lambda l: HEADER_RE.search(l))
    nic_i = first_index(lines, lambda l: nic and nic in re.sub(r"[ \-]", "", l).upper())
    if name_i >= 0 and addr_i >= 0:
        score += 3 if name_i < addr_i else -3
    if header_i >= 0 and nic_i >= 0 and header_i != nic_i:
        score += 2 if header_i < nic_i else -2
    return score


def read_card(paths: list) -> dict:
    lines = []
    for path in paths:
        for image in load_images(path):
            best = ocr_lines(image)
            best_score = orientation_score(best)
            # Scans are sometimes saved sideways/upside down: if the upright read looks weak,
            # try the other orientations and keep the one that reads most like a card.
            if best_score < 10:
                for turns in (1, 3, 2):
                    rotated = ocr_lines(rotate(image, turns))
                    score = orientation_score(rotated)
                    if score > best_score:
                        best, best_score = rotated, score
            lines.extend(best)

    result = {
        "nicNumber": find_nic(lines),
        "fullName": find_name(lines),
        "address": find_address(lines),
        "dateOfBirth": find_dob(lines),
        "gender": find_gender(lines),
        "lines": lines,
        "warnings": [],
    }
    if not lines:
        result["warnings"].append("No text could be read from the scan. Check the image quality.")
    labels = {"nicNumber": "NIC number", "fullName": "Full name", "address": "Address"}
    for key, label in labels.items():
        if not result[key]:
            result["warnings"].append(f"{label} could not be read; please enter it manually.")
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_nic.py <front> [<back>]", file=sys.stderr)
        sys.exit(2)
    try:
        print(json.dumps(read_card(sys.argv[1:3]), ensure_ascii=False))
    except Exception as e:  # noqa: BLE001 - reported to the API as a 500 with details
        print(f"NIC scan error: {e}", file=sys.stderr)
        sys.exit(1)
