// components/seo/HomeJsonLd.tsx
import React from 'react';

export default function HomeJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eternalgamesweb.com';
  
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "EternalGames",
        "url": siteUrl,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/api/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": "EternalGames",
        "url": siteUrl,
        "logo": {
            "@type": "ImageObject",
            "url": `${siteUrl}/icon.svg`,
            "width": 512,
            "height": 512
        },
        "sameAs": [
          "https://x.com/1EternalGames",
          "https://www.youtube.com/@1eternalgames",
          "https://www.instagram.com/1eternalgames",
          "https://www.tiktok.com/@1eternalgames"
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}