import os
import re
from pathlib import Path

# --- CONFIGURATION ---

# Directories to explicitly scan.
SCAN_DIRS = [Path("app"), Path("components"), Path("hooks")]

# Names of directories to ignore. This is now a simple set of strings for correct comparison.
IGNORE_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
}

# File extensions to scan for text.
SCAN_EXTENSIONS = {'.tsx', '.ts'}

# Regular expressions designed to find potential user-facing text.
REGEX_PATTERNS = [
    # 1. High-confidence: Text inside JSX tags: > Hello World <
    re.compile(r'>\s*([^<>{`=;]+)\s*<'),

    # 2. High-confidence: Text in common UI attributes.
    re.compile(r'(?:placeholder|title|alt|aria-label|label|message|description)\s*=\s*["\']([^"\']+)["\']'),

    # 3. Medium-confidence: Text in template literals.
    re.compile(r'`([^`]+)`'),
    
    # 4. Low-confidence: General string literals that will be heavily filtered.
    re.compile(r'["\']([^"\']+)["\']'),
]


def is_user_facing(text: str) -> bool:
    """
    Applies a set of aggressive heuristics to determine if a string is likely user-facing text
    rather than code, a class name, a path, or other non-UI string.

    Args:
        text (str): The string to analyze.

    Returns:
        bool: True if the string is likely user-facing text, False otherwise.
    """
    cleaned_text = text.strip()

    # --- REJECTION RULES (ORDERED BY SPECIFICITY) ---

    # Rule 1: Reject empty or very short, non-Arabic strings.
    if len(cleaned_text) < 2:
        return False

    # Rule 2: Reject common programming operators and syntax.
    if re.search(r'==|!=|=>|\|\||&&|\?\?|\?:|\+\+|--|=>|={|};', cleaned_text):
        return False
        
    # Rule 3: Reject if it contains unbalanced or code-like brackets/parentheses.
    if cleaned_text.count('(') != cleaned_text.count(')') or \
       cleaned_text.count('[') != cleaned_text.count(']') or \
       cleaned_text.count('{') != cleaned_text.count('}'):
        return False
    if re.search(r'[(){}\[\]]', cleaned_text) and ' ' not in cleaned_text:
        return False

    # Rule 4: Reject if it looks like a URL, file path, CSS selector, or contains HTML/XML tags.
    if re.search(r'[/{.#:\[\]<>]', cleaned_text) and ' ' not in cleaned_text:
        return False
    if '<' in cleaned_text and '>' in cleaned_text:
        return False
        
    # Rule 5: Reject if it's a file extension or looks like one.
    if re.fullmatch(r'\.?\w+\.(png|jpg|jpeg|svg|gif|webp|css|module)', cleaned_text, re.IGNORECASE):
        return False

    # Rule 6: Reject if it looks like camelCase, PascalCase, kebab-case, or snake_case code.
    if ' ' not in cleaned_text and not re.fullmatch(r'[\u0600-\u06FF]+', cleaned_text):
        if re.match(r'^[a-z]+(?:[A-Z][a-z0-9]*)+$', cleaned_text) or \
           re.match(r'^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)*$', cleaned_text) or \
           re.match(r'^[a-z]+(?:-[a-z0-9]+)+$', cleaned_text) or \
           re.match(r'^[a-z_]+(?:_[a-z0-9]+)+$', cleaned_text, re.IGNORECASE):
            return False
            
    # Rule 7: Reject common code-related keywords and CSS properties.
    code_keywords = {
        'div', 'span', 'true', 'false', 'null', 'undefined', 'button', 'submit', 'text', 'password', 'email', 
        'search', 'checkbox', 'radio', 'hidden', 'string', 'number', 'boolean', 'object', 'function', 
        'class', 'id', 'key', 'const', 'let', 'var', 'import', 'export', 'from', 'as', 'type', 'interface',
        'public', 'private', 'protected', 'async', 'await', 'return', 'props', 'state', 'ref',
        'width', 'height', 'color', 'background', 'margin', 'padding', 'border', 'display', 'position', 'left', 'right', 'top', 'bottom',
        'grid', 'flex', 'auto', 'block', 'inline-block', 'justify-content', 'align-items'
    }
    if cleaned_text.lower() in code_keywords:
        return False
        
    # Rule 8: The string must contain at least one letter (English or Arabic).
    if not re.search(r'[a-zA-Z\u0600-\u06FF]', cleaned_text):
        return False
        
    # Rule 9: Reject strings that are just special characters or numbers.
    if re.fullmatch(r'[^a-zA-Z\u0600-\u06FF\s]+', cleaned_text):
        return False

    # Rule 10: Reject if it contains variable placeholders like ${...}
    if re.search(r'\$\{.+?\}', cleaned_text):
        return False
        
    # Rule 11: Reject if it looks like a CSS unit.
    if re.fullmatch(r'-?\d+(\.\d+)?(px|rem|em|%|vh|vw|s|ms|deg)', cleaned_text, re.IGNORECASE):
        return False
        
    # Rule 12: Reject if it looks like SVG path data.
    if re.match(r'^[MmLlHhVvCcSsQqTtAaZz][\d\s.,-e]+$', cleaned_text.strip()):
        return False
        
    # --- ACCEPTANCE RULES ---
    
    # Rule 13: A string with multiple words is highly likely to be user-facing text.
    if ' ' in cleaned_text:
        return True
        
    # Rule 14: A single word that is entirely Arabic is likely user-facing.
    if re.fullmatch(r'[\u0600-\u06FF]+', cleaned_text):
        return True
        
    # Final check: For single English words, be very strict.
    if not cleaned_text[0].isalnum() or not cleaned_text[-1].isalnum():
        return False
    if re.fullmatch(r'[A-Z][a-z]+', cleaned_text):
        return True
    if re.fullmatch(r'[a-z]+', cleaned_text):
        return False

    return True


def extract_text_from_file(file_path: Path) -> set[str]:
    """
    Reads a file, applies all regex patterns, and returns a set of unique strings.
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"  [Warning] Could not read file {file_path}: {e}")
        return set()

    found_texts = set()
    for pattern in REGEX_PATTERNS:
        matches = pattern.findall(content)
        for match in matches:
            text = re.sub(r'\$\{[^}]+\}', '', match)
            text = re.sub(r'\s+', ' ', text).strip()
            if text:
                found_texts.add(text)
    return found_texts


def main():
    """
    Main function to traverse specified project directories, extract text from
    target file types, filter it, and save the result.
    """
    project_root = Path.cwd()
    print(f"Scanning for user-facing text in specified directories: {', '.join(map(str, SCAN_DIRS))}\n")

    all_raw_texts = set()

    for scan_dir in SCAN_DIRS:
        target_path = project_root / scan_dir
        if not target_path.is_dir():
            print(f"  [Warning] Directory '{scan_dir}' not found. Skipping.")
            continue

        for root, dirs, files in os.walk(target_path, topdown=True):
            # THE DEFINITIVE FIX: Prune ignored directories using a simple string comparison.
            # This corrects the NameError and the faulty logic.
            dirs[:] = [d for d in dirs if d not in IGNORE_DIR_NAMES]

            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in SCAN_EXTENSIONS:
                    relative_path = file_path.relative_to(project_root)
                    print(f"  -> Processing: {relative_path}")
                    extracted = extract_text_from_file(file_path)
                    all_raw_texts.update(extracted)

    print("\nFiltering extracted strings with corrected, stricter heuristics...")
    user_facing_texts = sorted([text for text in all_raw_texts if is_user_facing(text)])

    output_filename = 'user_facing_texts.txt'
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write("# --- User-Facing Texts Extracted from EternalGames Project (Corrected) ---\n")
            f.write(f"# --- Scanned Directories: {', '.join(map(str, SCAN_DIRS))} ---\n\n")
            for text in user_facing_texts:
                f.write(text + '\n')
    except Exception as e:
        print(f"\n[ERROR] Could not write to output file: {e}")
        return

    print(f"\n✅ Success! Found {len(user_facing_texts)} unique user-facing text strings.")
    print(f"   Results have been saved to '{output_filename}'")


if __name__ == "__main__":
    main()