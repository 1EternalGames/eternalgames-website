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
    gameSlug?: string;
    title: string;
    authors: SanityAuthor[];
    designers?: SanityAuthor[];
    date?: string;
    year?: number | null;
    imageUrl: string;
    verticalImageUrl?: string | null; // Added: Optional vertical image
    mainImageRef?: any;
    mainImageVerticalRef?: any; // Added: Raw ref for vertical image
    score?: number;
    tags: { title: string, slug: string }[];
    blurDataURL: string;
    category?: string; 
    newsType?: 'official' | 'rumor' | 'leak'; 
    verdict?: string;
    pros?: any[];
    cons?: any[];
    content?: any[];
    relatedReviewIds?: any[];
    synopsis?: string;
    
    // NEW: Release Specific Fields (Optional for other types)
    onGamePass?: boolean;
    onPSPlus?: boolean;
    trailer?: string;
    isPinned?: boolean;
    datePrecision?: 'day' | 'month' | 'year'; 
    isTBA?: boolean;
};

export type EngagementScore = { id: number; engagementScore: number };


