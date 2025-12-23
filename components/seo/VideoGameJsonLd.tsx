// components/seo/VideoGameJsonLd.tsx
import React from 'react';

type VideoGameProps = {
    name: string;
    description: string;
    image?: string;
    releaseDate?: string;
    genre?: string[];
    platforms?: string[];
    playMode?: string[]; // e.g., SinglePlayer, MultiPlayer
    publisher?: string;
    developer?: string;
};

export default function VideoGameJsonLd({ 
    name, 
    description, 
    image, 
    releaseDate, 
    genre, 
    platforms, 
    publisher, 
    developer 
}: VideoGameProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": name,
        "description": description,
        "image": image,
        "datePublished": releaseDate,
        "genre": genre,
        "operatingSystem": platforms,
        "publisher": publisher ? { "@type": "Organization", "name": publisher } : undefined,
        "author": developer ? { "@type": "Organization", "name": developer } : undefined,
        "applicationCategory": "Game"
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}