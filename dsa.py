import os

# 1. Define the ONLY valid location
valid_middleware = os.path.abspath("middleware.ts")

print("Scanning for rogue middleware files...")

# Walk through every folder
for root, dirs, files in os.walk("."):
    # Skip node_modules and .git and .next
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".git" in dirs:
        dirs.remove(".git")
    if ".next" in dirs:
        dirs.remove(".next")

    for file in files:
        # Case insensitive check for "middleware"
        if "middleware" in file.lower() and (file.endswith(".ts") or file.endswith(".js")):
            full_path = os.path.abspath(os.path.join(root, file))
            
            # If it's NOT the root middleware.ts, DESTROY IT
            if full_path != valid_middleware:
                try:
                    os.remove(full_path)
                    print(f"❌ DELETED rogue file: {full_path}")
                except Exception as e:
                    print(f"⚠️ Could not delete {full_path}: {e}")

print("Cleanup complete.")

# 2. Create the NEW 'Pure' Middleware (No NextAuth wrapper)
# This removes the dependency on the deprecated export style
with open("middleware.ts", "w", encoding='utf-8') as f:
    f.write("") # Clear file content for overwrite