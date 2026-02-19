// components/seo/AboutPageJsonLd.tsx
import React from 'react';

export default function AboutPageJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eternalgamesweb.com';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "EternalGames",
      "url": siteUrl,
      "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/icon.png`
      },
      "foundingDate": "2023",
      "description": "منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "editorial",
        "email": "me@EternalGamesWeb.com"
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}