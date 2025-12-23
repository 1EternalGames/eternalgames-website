import os
import shutil

# 1. Remove loading files
loading_files = [
    'app/reviews/loading.tsx',
    'app/articles/loading.tsx',
    'app/news/loading.tsx',
    'app/releases/loading.tsx'
]

for file in loading_files:
    if os.path.exists(file):
        os.remove(file)

# 2. Remove skeletons directory
if os.path.exists('components/skeletons'):
    shutil.rmtree('components/skeletons')