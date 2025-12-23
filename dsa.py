import os

os.makedirs('lib', exist_ok=True)
os.makedirs('components/content', exist_ok=True)
os.makedirs('components/seo', exist_ok=True)

with open('lib/readingTime.ts', 'w') as f:
    pass

with open('components/content/TableOfContents.tsx', 'w') as f:
    pass

with open('components/content/TableOfContents.module.css', 'w') as f:
    pass

with open('components/seo/FAQJsonLd.tsx', 'w') as f:
    pass