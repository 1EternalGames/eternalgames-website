import os

# List of files to be gathered as requested
file_paths = [
    "lib/adapters.ts",
    "components/DigitalAtriumHomePage.tsx",
    "components/homepage/HomepageFeeds.tsx",
]

output_filename = "fast_commit_files.txt"

# Open the output file in write mode with UTF-8 encoding
try:
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        print(f"Starting to gather files into '{output_filename}'...")
        
        for i, file_path in enumerate(file_paths):
            # Format path for display (works on Windows/Linux/macOS)
            normalized_path = file_path.replace("\\", "/")

            header = f"--- START OF FILE {normalized_path} ---\n\n"
            footer = f"\n\n--- END OF FILE {normalized_path} ---"
            separator = "\n\n================================================================================\n\n"

            outfile.write(header)
            
            try:
                # Open and read the content of the target file
                with open(file_path, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    outfile.write(content)
                print(f"  [SUCCESS] Added content from: {normalized_path}")
            except FileNotFoundError:
                # Handle cases where a file might not exist
                not_found_message = f"[File not found at this path: {normalized_path}]"
                outfile.write(not_found_message)
                print(f"  [WARNING] File not found, skipping: {normalized_path}")
            except Exception as e:
                # Handle other potential errors during file reading
                error_message = f"[Error reading file: {e}]"
                outfile.write(error_message)
                print(f"  [ERROR] Could not read file {normalized_path}: {e}")

            outfile.write(footer)
            if i < len(file_paths) - 1:
                outfile.write(separator)

    print(f"\nOperation complete. All file contents have been gathered into '{output_filename}'.")
    print("Please copy the content of this file and provide it for analysis.")

except Exception as e:
    print(f"An unexpected error occurred: {e}")