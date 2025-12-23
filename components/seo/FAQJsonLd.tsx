// components/seo/FAQJsonLd.tsx
import React from 'react';

type FAQItem = {
    question: string;
    answer: string;
};

export default function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}