import os

# List of the 10 files related to the timeline issue
files_to_collect = [
    "app/releases/page.tsx",
    "app/releases/ReleasePageClient.tsx",
    "app/releases/ReleasesPage.module.css",
    "components/KineticReleaseTimeline.tsx",
    "components/KineticReleaseTimeline.module.css",
    "components/TimelineCard.tsx",
    "components/TimelineCard.module.css",
    "components/AnimatedReleases.tsx",
    "lib/sanity.queries.ts",
    "sanity/schemaTypes/gameReleaseType.ts",
]

output_filename = "EternalGames_Timeline_Context.txt"

def collect_files(file_list, output_file):
    """Reads content from a list of files and writes it to a single output file."""
    print(f"Starting code collection into '{output_file}'...")
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for filepath in file_list:
            print(f"  -> Processing: {filepath}")
            # Use os.path.normpath to handle different OS path separators
            normalized_path = os.path.normpath(filepath)
            outfile.write(f"--- START OF FILE {normalized_path} ---\n\n")
            try:
                with open(filepath, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    outfile.write(content)
            except FileNotFoundError:
                print(f"  [WARNING] File not found: {filepath}. Skipping.")
                outfile.write("!!! FILE NOT FOUND AT THIS PATH !!!\n")
            except Exception as e:
                print(f"  [ERROR] Could not read file {filepath}: {e}")
                outfile.write(f"!!! ERROR READING FILE: {e} !!!\n")
            
            outfile.write(f"\n\n--- END OF FILE {normalized_path} ---\n\n")
            outfile.write("=" * 80 + "\n\n")
    
    print("\nCollection complete.")
    print(f"All specified file contents have been written to '{output_file}'.")

if __name__ == "__main__":
    collect_files(files_to_collect, output_filename)