import os
import shutil

# Ensure the old directory is gone and the new one exists
old_path = "app/api/revalidate"
new_path = "app/api/revalidate-sanity"

if os.path.exists(old_path):
    if os.path.exists(new_path):
        # If both exist, remove the old one safely
        shutil.rmtree(old_path)
        print(f"Removed duplicate old directory: {old_path}")
    else:
        # If only old exists, rename it
        shutil.move(old_path, new_path)
        print(f"Renamed {old_path} to {new_path}")
else:
    # If old doesn't exist, ensure new one does
    os.makedirs(new_path, exist_ok=True)
    print(f"Ensured {new_path} exists")