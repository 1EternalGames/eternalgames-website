// types/index.ts
import type { SanityAuthor } from "./sanity";

// This type represents the standardized data structure for all content cards,
// as produced by the `adaptToCardProps` adapter.
export type CardProps = {
    type: 'review' | 'article' | 'news';
    id: string; // Sanity _id
    legacyId: number; // Numeric legacy ID
    slug: string;
    game?: string;
    gameSlug?: string; // Added: For linking to game hubs
    title: string;
    authors: SanityAuthor[];
    designers?: SanityAuthor[];
    date?: string;
    year?: number | null;
    imageUrl: string;
    mainImageRef?: any; // For components needing custom aspect ratios
    score?: number;
    tags: { title: string, slug: string }[];
    blurDataURL: string;
    category?: string; 
    newsType?: 'official' | 'rumor' | 'leak'; // Added Field
    verdict?: string;
    pros?: any[];
    cons?: any[];
    content?: any[];
    relatedReviewIds?: any[];
    synopsis?: string;
};

export type EngagementScore = { id: number; engagementScore: number };