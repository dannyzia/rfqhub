"""
Quick script to convert DOCX/PDF files to markdown using python-docx for DOCX files
"""
import os
from pathlib import Path

def convert_docx_to_text(docx_path):
    """Convert DOCX to plain text using python-docx"""
    try:
        from docx import Document
        doc = Document(docx_path)
        text = []
        for para in doc.paragraphs:
            if para.text.strip():
                text.append(para.text)
        return "\n\n".join(text)
    except ImportError:
        return "ERROR: python-docx not installed. Run: pip install python-docx"
    except Exception as e:
        return f"ERROR: {str(e)}"

def convert_file(file_path):
    """Convert a single file"""
    path = Path(file_path)
    
    if path.suffix.lower() == '.docx':
        print(f"\n{'='*80}")
        print(f"Converting: {path.name}")
        print(f"{'='*80}\n")
        content = convert_docx_to_text(file_path)
        
        # Save to markdown file
        output_path = path.with_suffix('.md')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"# {path.stem}\n\n")
            f.write(content)
        
        print(f"✓ Saved to: {output_path.name}")
        return content
    else:
        return f"Unsupported format: {path.suffix}"

if __name__ == "__main__":
    # Convert all DOCX files in Resources/Process
    process_dir = Path(r"Resources\Process")
    
    docx_files = sorted(process_dir.glob("*.docx"))
    
    if docx_files:
        print(f"Found {len(docx_files)} DOCX files to convert\n")
        
        for docx_file in docx_files:
            try:
                convert_file(docx_file)
            except Exception as e:
                print(f"✗ Error converting {docx_file.name}: {str(e)}")
        
        print(f"\n{'='*80}")
        print(f"✓ Conversion complete! {len(docx_files)} files processed.")
        print(f"{'='*80}")
    else:
        print("No DOCX files found in Resources/Process")
