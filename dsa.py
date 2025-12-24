import os

# Create directory for the new store
os.makedirs("lib", exist_ok=True)
# Create directory for the hydrator component
os.makedirs("components/utils", exist_ok=True)

# Create the new files
with open("lib/contentStore.ts", "w") as f:
    f.write("")
with open("components/utils/GlobalContentHydrator.tsx", "w") as f:
    f.write("")