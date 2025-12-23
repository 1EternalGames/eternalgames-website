// components/seo/ProfilePageJsonLd.tsx
import React from 'react';

type ProfilePageProps = {
  name: string;
  username: string;
  image?: string;
  description?: string;
  url: string;
  sameAs?: string[];
  mainEntityOfPage?: string;
};

export default function ProfilePageJsonLd({ 
  name, 
  username, 
  image, 
  description, 
  url, 
  sameAs = [],
  mainEntityOfPage 
}: ProfilePageProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": name,
      "alternateName": username,
      "identifier": username,
      "image": image,
      "description": description,
      "url": url,
      "sameAs": sameAs
    },
    "mainEntityOfPage": mainEntityOfPage
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}