// types/index.ts

// This type represents the standardized data structure for all content cards,
// as produced by the `adaptToCardProps` adapter.
export type CardProps = {
    type: 'review' | 'article' | 'news';
    id: number | string;
    slug: string;
    game?: string;
    title: string;
    author: string;
    authorPrismaId?: string;
    date?: string; // <-- Used for unified date format
    // year?: number; REMOVED
    imageUrl: string;
    score?: number;
    tags: string[];
    blurDataURL: string;
    category?: string;
    verdict?: string;
    pros?: string[];
    cons?: string[];
    content?: any[];
    relatedReviewIds?: string[];
};


