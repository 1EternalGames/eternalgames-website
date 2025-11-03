import os

# --- CONFIGURATION ---
# Root folder (project root)
root_dir = os.getcwd()
# Updated output file name to reflect its comprehensiveness
output_file = "EternalGamesWebsite_Full.txt"

# Whitelist of explicit root-level files to include
whitelist_files = [
    ".env",
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
# --- END OF CONFIGURATION ---

print(f"Gathering project files into {output_file}...")

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
                # Exclusion logic: Skip descending into node_modules, specifically for sanity/node_modules
                # This is more efficient as it skips walking the whole directory tree.
                if folder == "sanity" and "node_modules" in dirnames:
                    dirnames.remove("node_modules")
                    dirnames.remove(".sanity")

                # Sort filenames for consistent output
                for filename in sorted(filenames):
                    file_path = os.path.join(dirpath, filename)
                    # Use forward slashes for cross-platform compatibility in the output path
                    rel_file_path = os.path.relpath(file_path, root_dir).replace('\\', '/')

                    # Secondary check for exclusion (though the dirnames modification should cover it)
                    if rel_file_path.startswith("sanity/node_modules/"):
                        continue

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