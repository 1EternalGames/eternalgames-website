import os

# Create directories
os.makedirs('app/studio/social-templates/instagram-news', exist_ok=True)
os.makedirs('components/studio/social', exist_ok=True)

# Create files
files = [
    'app/studio/social-templates/page.tsx',
    'app/studio/social-templates/instagram-news/page.tsx',
    'app/studio/social-templates/actions.ts',
    'components/studio/social/InstagramNewsCanvas.tsx',
    'components/studio/social/SmartFiller.tsx',
    'components/studio/social/SocialEditor.module.css',
]

for f in files:
    with open(f, 'w') as file:
        pass