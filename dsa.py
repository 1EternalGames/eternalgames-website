import json
import os

# 1. Load package.json
try:
    with open('package.json', 'r') as f:
        data = json.load(f)

    # 2. Remove the broken dependency if it exists
    if 'devDependencies' in data and '@types/xss' in data['devDependencies']:
        del data['devDependencies']['@types/xss']
    if 'dependencies' in data and '@types/xss' in data['dependencies']:
        del data['dependencies']['@types/xss']

    # 3. Save clean package.json
    with open('package.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print("Fixed package.json")

except FileNotFoundError:
    print("package.json not found, skipping fix.")

# 4. Install correctly
os.system("npm install zod xss")

# 5. Ensure lib directory exists
os.makedirs("lib", exist_ok=True)