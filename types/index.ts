// types/index.ts
import type { SanityAuthor } from "./sanity";

// This type represents the standardized data structure for all content cards,
// as produced by the `adaptToCardProps` adapter.
export type CardProps = {
    type: 'review' | 'article' | 'news';
    id: number | string;
    slug: string;
    game?: string;
    title: string;
    authors: SanityAuthor[];
    designers?: SanityAuthor[];
    date?: string;
    year?: number | null;
    imageUrl: string;
    score?: number;
    tags: string[];
    blurDataURL: string;
    verdict?: string;
    pros?: any[];
    cons?: any[];
    content?: any[];
    relatedReviewIds?: any[];
    category?: string;
};