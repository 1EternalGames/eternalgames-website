import os

# Remove loading.tsx files to prevent Next.js from switching to a skeleton layout immediately
# This forces the browser to keep the current page visible until the new one is ready (React Transition behavior)
files_to_remove = [
    "app/loading.tsx",
    "app/reviews/loading.tsx",
    "app/articles/loading.tsx",
    "app/news/loading.tsx",
    "app/releases/loading.tsx"
]

for file_path in files_to_remove:
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Removed {file_path}")
    else:
        print(f"Did not find {file_path}")