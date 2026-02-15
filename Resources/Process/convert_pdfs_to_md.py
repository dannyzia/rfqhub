#!/usr/bin/env python3
"""
PDF/DOCX to Markdown Converter using Marker
Converts all PDF and DOCX files in Resources\Process and Resources\Policy directories
to Markdown (.md) format using the marker-master tool.
"""

import logging
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("conversion_log.txt"), logging.StreamHandler()],
)

# Base directory
BASE_DIR = Path(__file__).parent.parent.parent
# Debug: Print paths
print(f"DEBUG: __file__ = {__file__}")
print(f"DEBUG: BASE_DIR = {BASE_DIR}")
print(f"DEBUG: Script location: {Path(__file__).absolute()}")

# Directories to process
PROCESS_DIR = BASE_DIR / "Resources" / "Process"
POLICY_DIR = BASE_DIR / "Resources" / "Policy"
NEW_DOCS_DIR = BASE_DIR / "Resources" / "New Docs"

# Output directory for markdown files (same as input directories)
OUTPUT_DIR = None  # Files will be saved in same directories as originals

# Files to skip (already have good .md versions)
# SKIP_FILES removed - convert files if .md doesn't exist or is empty


def get_marker_command() -> str:
    """Find the marker command"""
    # Use marker_single.py from Resources\marker-master directory
    marker_path = (
        BASE_DIR / "Resources" / "marker-master" / "marker-master" / "convert_single.py"
    )
    print(f"DEBUG: marker_path = {marker_path}")
    print(f"DEBUG: marker_path.exists() = {marker_path.exists()}")

    if marker_path.exists():
        return f'python "{marker_path}"'

    # Fallback to convert_single in PATH if available
    try:
        subprocess.run(
            ["convert_single", "--help"], capture_output=True, timeout=5, check=True
        )
        return "convert_single"
    except (
        subprocess.CalledProcessError,
        FileNotFoundError,
        subprocess.TimeoutExpired,
    ):
        pass

    # Try marker in PATH as well
    try:
        subprocess.run(
            ["convert_single", "--help"], capture_output=True, timeout=5, check=True
        )
        return "convert_single"
    except (
        subprocess.CalledProcessError,
        FileNotFoundError,
        subprocess.TimeoutExpired,
    ):
        pass

    raise RuntimeError(f"Marker command not found. Expected path: {marker_path}")


def should_convert_file(filepath: Path) -> bool:
    """Determine if a file should be converted"""
    print(f"DEBUG: Checking file: {filepath}")

    # Check if .md version already exists
    md_file = filepath.parent / (filepath.stem + ".md")
    if md_file.exists():
        # Check if it's not empty (size > 1KB)
        if md_file.stat().st_size > 1024:
            logging.info(
                f"Skipping {filepath.name} - .md version already exists and is not empty"
            )
            return False
        else:
            logging.warning(
                f"Found empty .md file for {filepath.name} - will reconvert"
            )
            return True

    logging.info(f"Will convert: {filepath.name} - no .md version exists")
    return True


def find_files_to_convert(directory: Path) -> List[Path]:
    """Find all PDF and DOCX files that need conversion"""
    files_to_convert = []

    if not directory.exists():
        logging.warning(f"Directory does not exist: {directory}")
        return files_to_convert

    logging.info(f"Scanning directory: {directory}")

    # Find PDF and DOCX files
    patterns = ["*.pdf", "*.PDF", "*.docx", "*.DOCX"]
    for pattern in patterns:
        matching_files = list(directory.glob(pattern))
        logging.info(f"  Found {len(matching_files)} files matching {pattern}")
        for filepath in matching_files:
            if should_convert_file(filepath):
                files_to_convert.append(filepath)

    logging.info(f"Total files to convert in {directory}: {len(files_to_convert)}")
    return files_to_convert


def convert_file(
    marker_cmd: str, input_file: Path, output_file: Path
) -> Tuple[bool, str]:
    """Convert a single file using marker"""

    logging.info(f"Converting: {input_file.name} -> {output_file.name}")

    try:
        # Run marker command
        cmd = [marker_cmd, str(input_file)]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes timeout per file
            encoding="utf-8",
            errors="ignore",
        )

        # Check if conversion was successful
        if result.returncode != 0:
            error_msg = f"Marker failed with return code {result.returncode}"
            if result.stderr:
                error_msg += f"\nStderr: {result.stderr}"
            logging.error(error_msg)
            return False, error_msg

        # Write output to markdown file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result.stdout)

        # Verify output is not empty
        if output_file.stat().st_size == 0:
            error_msg = "Output file is empty"
            logging.error(error_msg)
            return False, error_msg

        logging.info(
            f"Successfully converted: {input_file.name} ({output_file.stat().st_size} bytes)"
        )
        return True, "Success"

    except subprocess.TimeoutExpired:
        error_msg = "Conversion timed out after 5 minutes"
        logging.error(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Exception during conversion: {str(e)}"
        logging.error(error_msg)
        return False, error_msg


def main():
    """Main conversion function"""
    print(f"DEBUG: Current working directory: {os.getcwd()}")
    print(f"DEBUG: Script directory: {Path(__file__).parent}")

    logging.info("=" * 80)
    logging.info("PDF/DOCX to Markdown Converter using Marker")
    logging.info("=" * 80)

    try:
        # Find marker command
        marker_cmd = get_marker_command()
        logging.info(f"Using marker command: {marker_cmd}")

        # Statistics
        total_files = 0
        successful = 0
        failed = 0
        skipped = 0
        results = []

        # Process each directory
        for directory_name, directory in [
            ("Process", PROCESS_DIR),
            ("Policy", POLICY_DIR),
            ("New Docs", NEW_DOCS_DIR),
        ]:
            logging.info(f"\n{'-' * 80}")
            logging.info(f"Processing directory: {directory}")
            logging.info(f"{'-' * 80}\n")

            # Find files to convert
            files_to_convert = find_files_to_convert(directory)
            total_files += len(files_to_convert)

            if not files_to_convert:
                logging.info(f"No files to convert in {directory}")
                continue

            logging.info(
                f"Found {len(files_to_convert)} files to convert in {directory}"
            )

            # Convert each file
            for input_file in files_to_convert:
                output_file = input_file.parent / (input_file.stem + ".md")

                success, message = convert_file(marker_cmd, input_file, output_file)

                results.append(
                    {
                        "file": str(input_file.name),
                        "directory": directory_name,
                        "success": success,
                        "message": message,
                        "output_size": output_file.stat().st_size
                        if success and output_file.exists()
                        else 0,
                    }
                )

                if success:
                    successful += 1
                else:
                    failed += 1

            logging.info(
                f"\nCompleted {directory}: {successful} successful, {failed} failed"
            )

        # Print summary
        logging.info(f"\n{'=' * 80}")
        logging.info("CONVERSION SUMMARY")
        logging.info(f"{'=' * 80}")
        logging.info(f"Total files processed: {total_files}")
        logging.info(f"Successful: {successful}")
        logging.info(f"Failed: {failed}")
        logging.info(
            f"Skipped: {len([r for r in results if 'skipped' in str(r.get('message', ''))])}"
        )

        # Print detailed results
        if results:
            logging.info(f"\n{'-' * 80}")
            logging.info("DETAILED RESULTS")
            logging.info(f"{'-' * 80}\n")

            for result in results:
                status = "✓ SUCCESS" if result["success"] else "✗ FAILED"
                logging.info(f"{status} | {result['directory']}/{result['file']}")
                if not result["success"]:
                    logging.info(f"         Error: {result['message']}")
                else:
                    logging.info(f"         Output: {result['output_size']} bytes")

        # Exit with appropriate code
        if failed > 0:
            logging.warning(f"\nConversion completed with {failed} failure(s)")
            sys.exit(1)
        else:
            logging.info(f"\nAll {successful} files converted successfully!")
            sys.exit(0)

    except Exception as e:
        logging.error(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
