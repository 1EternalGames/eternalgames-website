import os

# 1. Delete the file causing the crash
file_to_remove = "app/(content)/[...slug]/opengraph-image.tsx"
if os.path.exists(file_to_remove):
    os.remove(file_to_remove)

# 2. Create directory for the new API route
os.makedirs("app/api/og", exist_ok=True)