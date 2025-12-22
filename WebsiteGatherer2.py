import os

# --- CONFIGURATION ---
# Root folder (project root)
root_dir = os.getcwd()
# Updated output file name to reflect its comprehensiveness
output_file = "EternalGamesWebsite_Full.txt"

# Whitelist of explicit root-level files to include
whitelist_files = [
    "next-auth.d.ts",
    "next.config.ts",
    "package.json",
    "tsconfig.json",
    "sanity.cli.ts",
]

# --- UPDATED: All essential directories are now included ---
# The script will walk through these folders and include every file inside them.
auto_include_dirs = [
    "app",
    "components",
    "hooks",      # Added for useDebounce
    "lib",
    "prisma",     # Added as requested
    "sanity",     # Added for Sanity Studio configuration
    "types",      # Added for TypeScript definitions
]

# --- NEW EXCLUSION LIST ---
# Folders to explicitly skip during os.walk
# All paths should be relative to root_dir (e.g., "lib/generated")
exclude_dirs_full_path = [
    "lib/generated", # Added exclusion for generated files
]
# --- END OF CONFIGURATION ---

print(f"Gathering project files into {output_file}...")

# Convert exclude_dirs_full_path into a set for fast lookup
# and ensure they start with the appropriate auto_include_dirs prefix
# We will check for these full relative paths during os.walk
exclude_dirs_set = set(exclude_dirs_full_path)


with open(output_file, "w", encoding="utf-8", errors="ignore") as out:
    # --- 1. Handle root-level whitelist files ---
    for rel_path in whitelist_files:
        file_path = os.path.join(root_dir, rel_path)
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                out.write(f"--- START OF FILE {rel_path} ---\n\n")
                out.write(content)
                out.write(f"\n\n--- END OF FILE {rel_path} ---\n\n")
                out.write("="*80 + "\n\n")
            except Exception as e:
                out.write(f"--- START OF FILE {rel_path} ---\n\n")
                out.write(f"[Could not read file: {e}]")
                out.write(f"\n\n--- END OF FILE {rel_path} ---\n\n")
                out.write("="*80 + "\n\n")
        else:
            out.write(f"--- START OF FILE {rel_path} ---\n\n")
            out.write(f"[File not found at: {file_path}]")
            out.write(f"\n\n--- END OF FILE {rel_path} ---\n\n")
            out.write("="*80 + "\n\n")

    # --- 2. Handle auto-include directories ---
    for folder in auto_include_dirs:
        folder_path = os.path.join(root_dir, folder)
        if os.path.exists(folder_path):
            # We use dirnames here so we can modify the list *in place* to prevent os.walk from descending
            for dirpath, dirnames, filenames in os.walk(folder_path):
                # Get the relative path of the current directory (dirpath)
                current_rel_dir = os.path.relpath(dirpath, root_dir).replace('\\', '/')

                # --- Exclusion Logic ---

                # 1. Skip descending into 'node_modules' and '.sanity' inside the 'sanity' folder
                if folder == "sanity":
                    if "node_modules" in dirnames:
                        dirnames.remove("node_modules")
                    if ".sanity" in dirnames:
                        dirnames.remove(".sanity")

                # 2. Skip descending into any explicitly excluded directory (like 'lib/generated')
                # Modify dirnames in place to prevent os.walk from entering excluded subdirectories
                dirs_to_remove = []
                for dirname in dirnames:
                    full_rel_path = f"{current_rel_dir}/{dirname}"
                    if full_rel_path in exclude_dirs_set:
                        dirs_to_remove.append(dirname)

                for dirname in dirs_to_remove:
                    dirnames.remove(dirname)

                # If the current directory itself is an exclusion, skip processing its files.
                # This is a safeguard, though the dirnames modification should prevent us from reaching deep exclusions.
                if current_rel_dir in exclude_dirs_set:
                     continue


                # Sort filenames for consistent output
                for filename in sorted(filenames):
                    file_path = os.path.join(dirpath, filename)
                    # Use forward slashes for cross-platform compatibility in the output path
                    rel_file_path = os.path.relpath(file_path, root_dir).replace('\\', '/')

                    # Secondary check for exclusion (though the dirnames modification should cover it)
                    if rel_file_path.startswith("sanity/node_modules/"):
                        continue
                    # A file inside an excluded directory should already be skipped by the 'continue' above,
                    # but this can be a redundant check if needed.
                    
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        out.write(f"--- START OF FILE {rel_file_path} ---\n\n")
                        out.write(content)
                        out.write(f"\n\n--- END OF FILE {rel_file_path} ---\n\n")
                        out.write("="*80 + "\n\n")
                    except Exception as e:
                        out.write(f"--- START OF FILE {rel_file_path} ---\n\n")
                        out.write(f"[Could not read file: {e}]")
                        out.write(f"\n\n--- END OF FILE {rel_file_path} ---\n\n")
                        out.write("="*80 + "\n\n")
        else:
            out.write(f"--- DIRECTORY {folder} ---\n\n")
            out.write(f"[Folder not found at: {folder_path}]")
            out.write(f"\n\n--- END OF DIRECTORY {folder} ---\n\n")
            out.write("="*80 + "\n\n")

print(f"✅ Done! All selected files and directories have been saved into: {output_file}")