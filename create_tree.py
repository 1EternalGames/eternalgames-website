import os

def generate_tree(startpath):
    """
    Generates a visual tree structure of a directory.
    """
    # --- Configuration: Add folders, files, or extensions to ignore here ---
    ignore_list = {
        'node_modules',
        '.git',
        '.next',
        '__pycache__',
        '.DS_Store',
        '.env',
        'package-lock.json',
        'migration_lock.toml',
        '.txt',
        'EternalGamesWebsite_Full*.txt',
        'create_tree.py',  # Ignore the script itself
        '.log',
        '.lock',
        '.swp'
    }
    # --- End Configuration ---

    # Prefixes for the tree structure
    space = '    '
    branch = '│   '
    tee = '├── '
    last = '└── '

    def _tree_generator(dir_path, prefix=""):
        # Get directory and file names and filter out ignored ones
        content = os.listdir(dir_path)
        
        filtered_content = [
            item for item in content 
            if item not in ignore_list and not any(item.endswith(ext) for ext in ignore_list if ext.startswith('.'))
        ]
        
        # Separate directories and files
        dirs = sorted([d for d in filtered_content if os.path.isdir(os.path.join(dir_path, d))])
        files = sorted([f for f in filtered_content if os.path.isfile(os.path.join(dir_path, f))])
        
        # Combine and determine pointers
        entries = dirs + files
        pointers = [tee] * (len(entries) - 1) + [last]

        for pointer, path in zip(pointers, entries):
            yield prefix + pointer + path
            
            full_path = os.path.join(dir_path, path)
            if os.path.isdir(full_path):
                extension = branch if pointer == tee else space
                yield from _tree_generator(full_path, prefix=prefix + extension)

    # Print the root directory name
    print(f"{os.path.basename(os.path.abspath(startpath))}/")
    # Start the recursive generator
    for line in _tree_generator(startpath):
        print(line)


if __name__ == "__main__":
    # Start the tree generation from the current directory
    generate_tree('.')