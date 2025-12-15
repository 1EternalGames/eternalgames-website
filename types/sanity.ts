// types/sanity.ts
import type { Image, PortableTextBlock } from '@sanity/types'

export interface SanityImage extends Image {
    url: string;
    blurDataURL: string;
    alt?: string;
}

export interface SanityTag {
    _id: string;
    title: string;
    slug: string;
}

export interface SanityAuthor {
    _id: string;
    name: string;
    slug: string;
    prismaUserId: string;
    // --- ENRICHED DATA ---
    username?: string | null;
    image?: string | null;
    bio?: string | null;
}

export interface SanityGame {
    _id: string;
    title: string;
    slug: string;
    mainImage?: SanityImage;
}

// New Types
export interface SanityDeveloper {
    _id: string;
    title: string;
    slug: string;
}

export interface SanityPublisher {
    _id: string;
    title: string;
    slug: string;
}

export interface SanityReview {
    _id: string;
    _type: 'review';
    legacyId: number;
    title: string;
    slug: string;
    authors: SanityAuthor[];
    designers?: SanityAuthor[];
    game: { _id: string, title: string };
    mainImage: SanityImage;
    score: number;
    verdict: string;
    pros: string[];
    cons: string[];
    content: PortableTextBlock[];
    tags: { _id: string, title: string }[];
    publishedAt: string;
    relatedReviews: {
        _id: string;
        legacyId: number;
        title: string;
        slug: string;
        mainImage: SanityImage;
        score: number;
        author: { name: string };
        publishedAt: string;
    }[];
}

export interface SanityArticle {
    _id: string;
    _type: 'article';
    legacyId: number;
    title: string;
    slug: string;
    authors: SanityAuthor[];
    designers?: SanityAuthor[];
    game: { title: string };
    mainImage: SanityImage;
    content?: PortableTextBlock[];
    tags: { _id: string, title: string }[];
    publishedAt: string; 
    relatedArticles?: any[];
}

export interface SanityNews {
    _id: string;
    _type: 'news';
    legacyId: number;
    title: string;
    slug: string;
    newsType: 'official' | 'rumor' | 'leak'; 
    reporters: SanityAuthor[];
    designers?: SanityAuthor[];
    mainImage: SanityImage;
    category: string;
    tags: { _id: string, title: string }[];
    publishedAt: string; 
    content?: PortableTextBlock[];
}

export interface SanityGameRelease {
    _id: string;
    legacyId: number;
    title: string;
    slug: string;
    releaseDate: string;
    isTBA?: boolean;       
    price?: string;        
    developer?: SanityDeveloper; 
    publisher?: SanityPublisher; 
    platforms: ('PC' | 'PlayStation' | 'PlayStation 5' | 'Xbox' | 'Switch')[];
    synopsis: string;
    mainImage: SanityImage;
    tags?: SanityTag[]; // Updated to full SanityTag interface
}

export interface SanitySearchResult {
    _id: string;
    _type: 'review' | 'article' | 'news';
    title: string;
    slug: string;
    imageUrl?: string;
    publishedAt?: string;
    authorName?: string;
    gameTitle?: string;
    category?: string;
}