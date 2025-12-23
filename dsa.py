import os

os.makedirs('app/privacy-policy', exist_ok=True)
os.makedirs('app/terms-of-service', exist_ok=True)

with open('components/CookieConsent.tsx', 'w') as f:
    pass

with open('components/CookieConsent.module.css', 'w') as f:
    pass