import os
import shutil
import json

# 1. Clear Next.js Cache
if os.path.exists(".next"):
    shutil.rmtree(".next")
    print("Cleaned .next cache directory.")

# 2. Fix tsconfig.json
tsconfig_path = "tsconfig.json"
if os.path.exists(tsconfig_path):
    with open(tsconfig_path, "r", encoding='utf-8') as f:
        # Load as flexible JSON (allowing comments if any, though standard json lib is strict)
        # We will use simple string manipulation to avoid parsing errors with comments
        lines = f.readlines()

    new_lines = []
    for line in lines:
        # Remove the specific line causing the error
        if ".next/dev/types/**/*.ts" not in line:
            new_lines.append(line)
    
    with open(tsconfig_path, "w", encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Fixed tsconfig.json include patterns.")