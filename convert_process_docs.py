#!/usr/bin/env python3
"""
Convert PDFs and DOCX files in Resources/Process to Markdown using marker library.
Falls back to python-docx for DOCX files if needed.
"""

import os
import sys
from pathlib import Path

# Add marker-master to path
marker_path = Path(__file__).parent / "Resources" / "marker-master" / "marker-master"
if marker_path.exists():
    sys.path.insert(0, str(marker_path))
    print(f"Added marker path: {marker_path}\n")

HAVE_MARKER = False
HAVE_DOCX_CONVERTER = False

try:
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    HAVE_MARKER = True
    print("✓ Marker library loaded successfully\n")
except ImportError as e:
    print(f"⚠️  Marker PDF converter not available: {e}\n")
    HAVE_MARKER = False

# Try marker for DOCX
if HAVE_MARKER:
    try:
        from marker.converters.docx import DocxConverter
        HAVE_DOCX_CONVERTER = True
    except ImportError:
        HAVE_DOCX_CONVERTER = False

# Fallback for DOCX
try:
    from docx import Document
    HAVE_PYTHON_DOCX = True
except ImportError:
    HAVE_PYTHON_DOCX = False


def convert_docx_with_python_docx(docx_path):
    """Convert DOCX to markdown using python-docx"""
    try:
        doc = Document(docx_path)
        lines = []
        for para in doc.paragraphs:
            if para.text.strip():
                lines.append(para.text)
        return "\n\n".join(lines)
    except Exception as e:
        print(f"      ❌ Python-docx error: {e}")
        return None


def convert_pdf_with_marker(pdf_path):
    """Convert PDF to markdown using marker"""
    try:
        converter = PdfConverter(artifact_types=["markdown"])
        result = converter(str(pdf_path))
        return result.markdown
    except Exception as e:
        print(f"      ❌ Marker PDF error: {e}")
        return None


def convert_docx_with_marker(docx_path):
    """Convert DOCX to markdown using marker"""
    try:
        converter = DocxConverter(artifact_types=["markdown"])
        result = converter(str(docx_path))
        return result.markdown
    except Exception as e:
        print(f"      ❌ Marker DOCX error: {e}")
        return None



def convert_file(file_path):
    """Convert a single file (PDF or DOCX) to Markdown"""
    path = Path(file_path)
    suffix = path.suffix.lower()
    
    print(f"  [{path.name}]...", end=" ", flush=True)
    
    content = None
    
    if suffix == ".pdf":
        if HAVE_MARKER:
            content = convert_pdf_with_marker(str(path))
        else:
            print("❌ Marker not available")
            return False
    
    elif suffix == ".docx":
        if HAVE_DOCX_CONVERTER:
            content = convert_docx_with_marker(str(path))
        elif HAVE_PYTHON_DOCX:
            content = convert_docx_with_python_docx(str(path))
        else:
            print("❌ No DOCX converter available")
            return False
    
    if content:
        # Save to .md file
        md_path = path.with_suffix(".md")
        try:
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓")
            return True
        except Exception as e:
            print(f"❌ Save error: {e}")
            return False
    else:
        print(f"❌")
        return False


def main():
    script_dir = Path(__file__).parent
    process_dir = script_dir / "Resources" / "Process"
    
    print("=" * 80)
    print("Convert PDFs and DOCX Files to Markdown")
    print("Using: marker library + python-docx fallback")
    print("Location: Resources\\Process only")
    print("=" * 80)
    print()
    
    if not process_dir.exists():
        print(f"Error: Process directory not found: {process_dir}")
        return
    
    # Find all PDF and DOCX files without corresponding .md
    files_to_convert = []
    
    for pdf_file in sorted(process_dir.glob("*.pdf")):
        md_file = pdf_file.with_suffix(".md")
        files_to_convert.append(pdf_file)
    
    for docx_file in sorted(process_dir.glob("*.docx")):
        md_file = docx_file.with_suffix(".md")
        files_to_convert.append((docx_file))
    
    if not files_to_convert:
        print("No PDF or DOCX files found in Resources\\Process")
        print()
        return
    
    print(f"Found {len(files_to_convert)} files to convert:\n")
    
    converted = 0
    failed = 0
    
    for idx, file_path in enumerate(sorted(files_to_convert), 1):
        print(f"[{idx:2d}/{len(files_to_convert)}]", end=" ", flush=True)
        result = convert_file(file_path)
        if result:
            converted += 1
        else:
            failed += 1
    
    print()
    print("=" * 80)
    print("Conversion Summary:")
    print(f"  Total files: {len(files_to_convert)}")
    print(f"  Successfully converted: {converted}")
    print(f"  Failed: {failed}")
    print("=" * 80)


if __name__ == "__main__":
    main()
