#!/usr/bin/env python3
"""Build site/index.html: a single self-contained viewer of every Markdown note in the vault.

Run from anywhere:  python3 site/build.py
Open site/index.html in a browser. No server, no internet needed (fonts fall back to system fonts offline).
"""
import json, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SKIP = {".git", "site", "node_modules"}

notes = []
for p in sorted(ROOT.rglob("*.md")):
    rel = p.relative_to(ROOT)
    if SKIP & set(rel.parts):
        continue
    text = p.read_text(encoding="utf-8")
    m = re.search(r"^#\s+(.+)$", text, re.M)
    title = m.group(1).strip() if m else rel.stem
    notes.append({"path": rel.as_posix(), "title": title, "text": text})

try:
    rev = subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"], text=True).strip()
except Exception:
    rev = "unknown"

data = json.dumps({"notes": notes, "rev": rev}, ensure_ascii=False).replace("</", "<\\/")
html = (HERE / "template.html").read_text(encoding="utf-8").replace("/*__DATA__*/null", data)
(HERE / "index.html").write_text(html, encoding="utf-8")
print(f"Built site/index.html with {len(notes)} notes (rev {rev})")
