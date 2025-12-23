// components/seo/OrganizationJsonLd.tsx
import React from 'react';

export default function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EternalGames",
    "url": siteUrl,
    "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/icon.png`,
        "width": 512,
        "height": 512
    },
    "sameAs": [
      "https://x.com/1EternalGames",
      "https://www.youtube.com/@1eternalgames",
      "https://www.instagram.com/1eternalgames",
      "https://www.tiktok.com/@1eternalgames"
    ],
    "description": "منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}