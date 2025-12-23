// components/seo/CarouselJsonLd.tsx
import React from 'react';

type CarouselItem = {
    url: string;
    position: number;
    name?: string;
    image?: string;
};

export default function CarouselJsonLd({ data }: { data: CarouselItem[] }) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": data.map((item) => ({
            "@type": "ListItem",
            "position": item.position,
            "url": item.url,
            "name": item.name,
            "image": item.image
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}