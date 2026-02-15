#!/usr/bin/env python3
"""Extract text from a PDF file and save to a .txt file."""
import sys
from pathlib import Path

from pypdf import PdfReader

def main():
    pdf_path = Path(
        r"Resources/Policy copy/01 Public Procurement Related Act"
        r"/2017-07-31-16-00-37-Public-Procurement-Act-2006-Bangla.pdf"
    )
    if not pdf_path.is_file():
        pdf_path = Path(__file__).parent / pdf_path
    if not pdf_path.is_file():
        print("PDF not found:", pdf_path, file=sys.stderr)
        sys.exit(1)

    out_path = pdf_path.with_suffix(".txt")
    reader = PdfReader(str(pdf_path))
    lines = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            lines.append(f"\n--- Page {i + 1} of {len(reader.pages)} ---\n\n")
            lines.append(text)
            lines.append("\n")

    out_path.write_text("".join(lines), encoding="utf-8")
    print("Extracted", len(reader.pages), "pages to", out_path)

if __name__ == "__main__":
    main()
