// components/seo/SpeakableJsonLd.tsx
import React from 'react';

type SpeakableProps = {
    cssSelectors: string[];
};

export default function SpeakableJsonLd({ cssSelectors }: SpeakableProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "SpeakableSpecification",
        "cssSelector": cssSelectors
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}