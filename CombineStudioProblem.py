import os

# List of files to include in the output
files_to_collect = [
    # Directly Related Files
    "lib/sanity.client.ts",
    "lib/sanity.server.ts",
    "app/studio/page.tsx",
    "app/studio/[contentType]/[id]/page.tsx",
    "next.config.ts",
    ".env",
    # General Project Context
    "package.json",
    "tsconfig.json",
    "app/layout.tsx",
    "app/lib/authOptions.ts",
    "prisma/schema.prisma",
    "sanity/sanity.config.ts",
]

output_filename = "EternalGames_Full_Context.txt"

def collect_files(file_list, output_file):
    """Reads content from a list of files and writes it to a single output file."""
    print(f"Starting code collection into '{output_file}'...")
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for filepath in file_list:
            print(f"  -> Processing: {filepath}")
            outfile.write(f"--- START OF FILE {filepath} ---\n\n")
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
            
            outfile.write("\n\n--- END OF FILE {filepath} ---\n\n")
            outfile.write("=" * 80 + "\n\n")
    
    print("\nCollection complete.")
    print(f"All specified file contents have been written to '{output_file}'.")

if __name__ == "__main__":
    collect_files(files_to_collect, output_filename)