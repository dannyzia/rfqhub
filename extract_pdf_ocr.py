#!/usr/bin/env python3
"""
OCR-based PDF-to-text extraction for image-only (scanned) PDFs.
Requires: pip install pymupdf pytesseract
          Tesseract installed (https://github.com/UB-Mannheim/tesseract/wiki)
          Bangla data: tesseract install ben (or download ben.traineddata)
"""
import sys
from pathlib import Path

try:
    import fitz  # pymupdf
    import pytesseract
    from PIL import Image
    import io
except ImportError as e:
    print("Install: pip install pymupdf pytesseract pillow", file=sys.stderr)
    print(e, file=sys.stderr)
    sys.exit(1)

PDF_PATH = Path(
    __file__).parent / r"Resources/Policy copy/01 Public Procurement Related Act"
PDF_FILE = PDF_PATH / "2017-07-31-16-00-37-Public-Procurement-Act-2006-Bangla.pdf"
OUT_FILE = PDF_FILE.with_suffix(".txt")


def main():
    if not PDF_FILE.is_file():
        print("Not found:", PDF_FILE, file=sys.stderr)
        sys.exit(1)
    doc = fitz.open(PDF_FILE)
    lines = []
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))
        # Use Bangla if available: lang='ben' or 'ben+eng'
        try:
            text = pytesseract.image_to_string(img, lang="ben")
        except pytesseract.TesseractError:
            text = pytesseract.image_to_string(img, lang="eng")
        lines.append(f"\n--- Page {i + 1} of {len(doc)} ---\n\n")
        lines.append(text or "(no text detected)\n")
        lines.append("\n")
    doc.close()
    OUT_FILE.write_text("".join(lines), encoding="utf-8")
    print("OCR output written to", OUT_FILE)


if __name__ == "__main__":
    main()
