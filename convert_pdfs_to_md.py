#!/usr/bin/env python3
"""
Script to convert PDF files to Markdown using markitdown.
Finds all PDF files and creates corresponding .md files if they don't exist.
"""

import os
import sys
from pathlib import Path
from markitdown import MarkItDown

def convert_pdf_to_markdown(pdf_path):
    """Convert a single PDF file to Markdown"""
    try:
        md = MarkItDown()
        result = md.convert(str(pdf_path))
        # The result is a DocumentConverterResult object with text_content attribute
        return result.text_content
    except Exception as e:
        print(f"  ❌ Error converting {pdf_path.name}: {str(e)}")
        return None

def find_pdfs_without_md(root_dir):
    """Find all PDF files that don't have corresponding .md files"""
    pdfs_without_md = []
    
    for pdf_file in Path(root_dir).rglob("*.pdf"):
        md_file = pdf_file.with_suffix(".md")
        if not md_file.exists():
            pdfs_without_md.append(pdf_file)
    
    return sorted(pdfs_without_md)

def main():
    # Get the workspace root
    script_dir = Path(__file__).parent
    
    print("=" * 80)
    print("PDF to Markdown Converter")
    print("=" * 80)
    print()
    
    # Find all PDFs without corresponding .md files
    pdfs_to_convert = find_pdfs_without_md(script_dir)
    
    if not pdfs_to_convert:
        print("✓ All PDF files have corresponding markdown files!")
        return
    
    print(f"Found {len(pdfs_to_convert)} PDF files without corresponding .md files:")
    print()
    
    converted = 0
    failed = 0
    
    for idx, pdf_file in enumerate(pdfs_to_convert, 1):
        relative_path = pdf_file.relative_to(script_dir)
        print(f"[{idx}/{len(pdfs_to_convert)}] Converting: {relative_path}")
        
        # Convert PDF to Markdown
        markdown_content = convert_pdf_to_markdown(pdf_file)
        
        if markdown_content:
            # Save to .md file
            md_file = pdf_file.with_suffix(".md")
            try:
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(markdown_content)
                print(f"  ✓ Saved to: {md_file.name}")
                converted += 1
            except Exception as e:
                print(f"  ❌ Failed to save markdown file: {str(e)}")
                failed += 1
        else:
            failed += 1
        
        print()
    
    # Summary
    print("=" * 80)
    print("Conversion Summary:")
    print(f"  Total PDFs: {len(pdfs_to_convert)}")
    print(f"  Successfully converted: {converted}")
    print(f"  Failed: {failed}")
    print("=" * 80)

if __name__ == "__main__":
    main()
