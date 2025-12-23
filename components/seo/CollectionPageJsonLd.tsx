// components/seo/CollectionPageJsonLd.tsx
import React from 'react';

type CollectionPageProps = {
    name: string;
    description: string;
    url: string;
    hasPart?: {
        headline: string;
        url: string;
        datePublished?: string;
    }[];
};

export default function CollectionPageJsonLd({ name, description, url, hasPart = [] }: CollectionPageProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": name,
        "description": description,
        "url": url,
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": hasPart.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": item.url,
                "name": item.headline
            }))
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}