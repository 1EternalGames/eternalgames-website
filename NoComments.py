import os
import re

# --- CONFIGURATION ---
# Root folder (project root)
root_dir = os.getcwd()
# Updated output file name
output_file = "EternalGamesWebsite_Full_NoComments.txt"

# Whitelist of explicit root-level files to include
whitelist_files = [
    "next-auth.d.ts",
    "next.config.ts",
    "package.json",
    "tsconfig.json",
    "sanity.cli.ts",
]

# All essential directories are now included
auto_include_dirs = [
    "app",
    "components",
    "hooks",
    "lib",
    "prisma",
    "sanity",
    "types",
]
# --- END OF CONFIGURATION ---

def process_content(content: str, file_path: str) -> str:
    """
    Removes comments from the content of a file, but keeps the first line if it is a comment.
    Handles various comment styles (//, /* */, #).
    """
    if not content:
        return ""

    lines = content.splitlines()
    if not lines:
        return ""
        
    first_line = lines[0]
    first_line_is_comment = False

    # Determine if the first line is a comment based on file type
    file_ext = os.path.splitext(file_path)[1]
    stripped_first_line = first_line.strip()

    if file_ext in ['.ts', '.tsx', '.js', '.jsx', '.css', '.d.ts']:
        if stripped_first_line.startswith('//') or stripped_first_line.startswith('/*'):
            first_line_is_comment = True
    elif file_ext in ['.py', '.toml', '.prisma'] or os.path.basename(file_path) == '.env':
        if stripped_first_line.startswith('#'):
            first_line_is_comment = True

    # Process the content for comment removal
    # 1. Remove multi-line /* ... */ comments
    content_no_multiline = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # 2. Remove single-line // and # comments
    lines_processed = []
    for line in content_no_multiline.splitlines():
        # A more robust regex to avoid stripping URLs with //
        line = re.sub(r'(?<![:])//.*', '', line)
        line = re.sub(r'#.*', '', line)
        if line.strip():  # Only keep lines that are not empty after comment removal
            lines_processed.append(line)
            
    final_content = "\n".join(lines_processed)

    # If the first line was a comment, prepend it to the cleaned content
    if first_line_is_comment:
        # Check if the first line was accidentally removed (e.g., it was the only content in a multi-line block)
        if not final_content.strip().startswith(stripped_first_line):
            return first_line + "\n" + final_content
        else:
            # If it's still there (e.g., // comment), we need to avoid duplication.
            # We'll reconstruct the content, placing the preserved first line
            # and then the rest of the cleaned lines, skipping the first one if it's the same.
            if len(lines_processed) > 0 and lines_processed[0].strip() == stripped_first_line:
                return "\n".join([first_line] + lines_processed[1:])
            else:
                return first_line + "\n" + final_content
    else:
        return final_content


print(f"Gathering and cleaning project files into {output_file}...")

with open(output_file, "w", encoding="utf-8", errors="ignore") as out:
    all_paths = []

    # --- 1. Gather root-level whitelist files ---
    for rel_path in whitelist_files:
        file_path = os.path.join(root_dir, rel_path)
        if os.path.exists(file_path):
            all_paths.append(rel_path)

    # --- 2. Gather files from auto-include directories ---
    for folder in auto_include_dirs:
        folder_path = os.path.join(root_dir, folder)
        if os.path.exists(folder_path):
            for dirpath, dirnames, filenames in os.walk(folder_path):
                # Exclusion logic for sanity's node_modules and .sanity cache
                if "sanity" in folder and ("node_modules" in dirnames or ".sanity" in dirnames):
                    if "node_modules" in dirnames: dirnames.remove("node_modules")
                    if ".sanity" in dirnames: dirnames.remove(".sanity")
                
                for filename in filenames:
                    file_path = os.path.join(dirpath, filename)
                    rel_file_path = os.path.relpath(file_path, root_dir).replace('\\', '/')
                    all_paths.append(rel_file_path)

    # --- 3. Process and write all gathered files ---
    for rel_path in sorted(all_paths):
        file_path = os.path.join(root_dir, rel_path)
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            processed_content = process_content(content, file_path)
            
            out.write(f"--- START OF FILE {rel_path} ---\n\n")
            out.write(processed_content)
            out.write(f"\n\n--- END OF FILE {rel_path} ---\n\n")
            out.write("="*80 + "\n\n")
        except Exception as e:
            out.write(f"--- START OF FILE {rel_path} ---\n\n")
            out.write(f"[Could not read or process file: {e}]")
            out.write(f"\n\n--- END OF FILE {rel_path} ---\n\n")
            out.write("="*80 + "\n\n")

print(f"✅ Done! All selected files have been cleaned and saved into: {output_file}")