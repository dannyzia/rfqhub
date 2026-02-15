#!/usr/bin/env python3
"""
Convert PDFs in Resources\Policy\01 Public Procurement Related Act to Markdown using marker.
"""

import sys
import os
from pathlib import Path
import subprocess

# Path to marker-master
marker_master = Path(__file__).parent / "Resources" / "marker-master" / "marker-master"
policy_01_dir = Path(__file__).parent / "Resources" / "Policy" / "01 Public Procurement Related Act"

print("=" * 80)
print("Testing PDF Conversion: Resources\\Policy\\01 Public Procurement Related Act")
print("=" * 80)
print()

if not policy_01_dir.exists():
    print(f"Error: Directory not found: {policy_01_dir}")
    sys.exit(1)

# Find PDFs
pdf_files = sorted(policy_01_dir.glob("*.pdf"))

if not pdf_files:
    print("No PDF files found in Policy\\01 directory")
    sys.exit(1)

print(f"Found {len(pdf_files)} PDF files:\n")
for pdf in pdf_files:
    size_mb = pdf.stat().st_size / (1024 * 1024)
    print(f"  • {pdf.name} ({size_mb:.2f} MB)")

print("\nAttempting conversion...\n")

# Try method 1: Using marker_single from marker-master
convert_script = marker_master / "marker" / "converters" / "pdf.py"

if not marker_master.exists():
    print(f"Warning: marker-master not found at {marker_master}")
    print("Trying with installed marker-pdf package instead...")
    
    try:
        from marker.converters.pdf import PdfConverter
        
        print("Using installed marker-pdf package\n")
        
        converted = 0
        for pdf_file in pdf_files:
            print(f"Converting: {pdf_file.name}...", end=" ", flush=True)
            try:
                converter = PdfConverter(artifact_types=["markdown"])
                result = converter(str(pdf_file))
                
                md_file = pdf_file.with_suffix(".md")
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(result.markdown)
                
                size_mb = md_file.stat().st_size / (1024 * 1024)
                print(f"✓ ({size_mb:.2f} MB)")
                converted += 1
            except Exception as e:
                print(f"❌ Error: {e}")
        
        print(f"\nConversion complete: {converted}/{len(pdf_files)} files")
        
    except ImportError:
        print("Error: marker-pdf package not properly installed")
        sys.exit(1)

else:
    print(f"Using marker-master from {marker_master}\n")
    
    # Add to path and try direct import
    sys.path.insert(0, str(marker_master))
    
    try:
        from marker.converters.pdf import PdfConverter
        
        print("Marker library loaded successfully\n")
        
        converted = 0
        for pdf_file in pdf_files:
            print(f"Converting: {pdf_file.name}...", end=" ", flush=True)
            try:
                converter = PdfConverter(artifact_types=["markdown"])
                result = converter(str(pdf_file))
                
                md_file = pdf_file.with_suffix(".md")
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(result.markdown)
                
                size_mb = md_file.stat().st_size / (1024 * 1024)
                print(f"✓ ({size_mb:.2f} MB)")
                converted += 1
            except Exception as e:
                print(f"❌ {type(e).__name__}: {str(e)[:50]}")
        
        print(f"\nConversion complete: {converted}/{len(pdf_files)} files")
        
    except ImportError as e:
        print(f"Error loading marker: {e}")
        print("\nTrying fallback with markitdown...")
        
        try:
            from markitdown import MarkItDown
            
            md = MarkItDown()
            converted = 0
            
            for pdf_file in pdf_files:
                print(f"Converting: {pdf_file.name}...", end=" ", flush=True)
                try:
                    result = md.convert(str(pdf_file))
                    
                    md_file = pdf_file.with_suffix(".md")
                    with open(md_file, 'w', encoding='utf-8') as f:
                        f.write(result.text_content)
                    
                    size_mb = md_file.stat().st_size / (1024 * 1024)
                    print(f"✓ ({size_mb:.2f} MB)")
                    converted += 1
                except Exception as e:
                    print(f"❌ {type(e).__name__}: {str(e)[:50]}")
            
            print(f"\nConversion complete (using markitdown): {converted}/{len(pdf_files)} files")
            
        except ImportError:
            print("Neither marker nor markitdown available")
            sys.exit(1)

print()
print("=" * 80)
