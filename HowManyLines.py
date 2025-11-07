import re
from collections import defaultdict
import os

def parse_input_file(file_path):
    """
    Parses the large concatenated text file into a dictionary of {filename: content}.
    """
    files = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Regex to find all file blocks
        pattern = r"--- START OF FILE (.+?) ---\n(.*?)\n--- END OF FILE .+? ---"
        matches = re.findall(pattern, content, re.DOTALL)
        
        for filename, file_content in matches:
            files[filename.strip()] = file_content
    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        return None
    return files

def get_language_category(filename):
    """
    Categorizes a file based on its extension.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext in ['.ts', '.tsx']:
        return "TypeScript/TSX"
    elif ext == '.css':
        return "CSS"
    elif ext == '.json':
        return "JSON"
    elif ext == '.sql':
        return "SQL"
    elif ext in ['.env', '.toml', '.prisma']:
        return "Configuration"
    else:
        return "Other"

def analyze_file_content(content, category):
    """
    Analyzes the content of a single file for various metrics.
    """
    lines = content.splitlines()
    total_lines = len(lines)
    words = content.split()
    total_words = len(words)
    total_chars = len(content)
    
    comment_lines = 0
    code_lines = 0
    blank_lines = 0
    inline_comment_lines = 0
    
    is_in_multiline_comment = False
    
    single_line_markers = []
    if category in ["TypeScript/TSX", "CSS"]:
        single_line_markers.append('//')
    if category in ["Configuration", "SQL"]:
        single_line_markers.append('#')

    for line in lines:
        stripped_line = line.strip()

        if not stripped_line:
            blank_lines += 1
            continue

        # Handle multi-line comments for TS/TSX/CSS
        if category in ["TypeScript/TSX", "CSS"]:
            if '/*' in stripped_line:
                is_in_multiline_comment = True
            
            if is_in_multiline_comment:
                comment_lines += 1
                if '*/' in stripped_line:
                    is_in_multiline_comment = False
                continue

        # Handle single-line comments
        is_full_comment = False
        for marker in single_line_markers:
            if stripped_line.startswith(marker):
                comment_lines += 1
                is_full_comment = True
                break
        if is_full_comment:
            continue
            
        # If it's not a blank line or a full comment line, it contains code.
        code_lines += 1
        
        # Check for inline comments
        for marker in single_line_markers:
            if marker in stripped_line:
                inline_comment_lines += 1
                break
                
    return {
        'total_lines': total_lines,
        'code_lines': code_lines,
        'comment_lines': comment_lines,
        'blank_lines': blank_lines,
        'inline_comment_lines': inline_comment_lines,
        'total_words': total_words,
        'total_chars': total_chars
    }

def print_summary(title, stats):
    """
    Prints a formatted summary of the analysis stats.
    """
    print("-" * 60)
    print(f"{title.center(60)}")
    print("-" * 60)

    total_lines = stats['total_lines']
    code_lines = stats['code_lines']
    comment_lines = stats['comment_lines']
    blank_lines = stats['blank_lines']
    
    # The most important question: lines with and without comments
    lines_with_some_comment = comment_lines + stats['inline_comment_lines']
    lines_without_any_comment = total_lines - lines_with_some_comment - blank_lines
    
    code_ratio = (code_lines / total_lines * 100) if total_lines > 0 else 0
    comment_ratio = (comment_lines / total_lines * 100) if total_lines > 0 else 0
    blank_ratio = (blank_lines / total_lines * 100) if total_lines > 0 else 0

    print(f"Files Count             : {stats.get('file_count', 'N/A'):<10}")
    print(f"Total Characters        : {stats['total_chars']:,}")
    print(f"Total Words             : {stats['total_words']:,}")
    print("\n--- Line Analysis ---")
    print(f"Total Lines             : {total_lines:,}")
    print(f"  - Lines of Code       : {code_lines:,} ({code_ratio:.1f}%)")
    print(f"  - Comment-Only Lines  : {comment_lines:,} ({comment_ratio:.1f}%)")
    print(f"  - Blank Lines         : {blank_lines:,} ({blank_ratio:.1f}%)")
    
    print("\n--- Answering the Main Question ---")
    print(f"Lines WITH comments     : {lines_with_some_comment:,} (Comment-only + Inline)")
    print(f"Lines WITHOUT comments  : {lines_without_any_comment:,} (Pure code lines)")
    
    print("-" * 60 + "\n")


if __name__ == "__main__":
    input_filename = "EternalGamesWebsite_Full149.txt"
    all_files = parse_input_file(input_filename)

    if all_files:
        overall_stats = defaultdict(int)
        category_stats = defaultdict(lambda: defaultdict(int))

        overall_stats['file_count'] = len(all_files)

        for filename, content in all_files.items():
            category = get_language_category(filename)
            stats = analyze_file_content(content, category)

            category_stats[category]['file_count'] += 1
            for key, value in stats.items():
                overall_stats[key] += value
                category_stats[category][key] += value
        
        print_summary("Overall Project Analysis", overall_stats)

        for category, stats in sorted(category_stats.items()):
            print_summary(f"Category: {category}", stats)