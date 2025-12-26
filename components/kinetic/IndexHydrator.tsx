// components/kinetic/IndexHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';

/**
 * Hydrates the store with initial data for Index pages (Reviews, News, etc.)
 * derived from the homepage data. This allows "Instant" opening of index pages
 * without a network request.
 */
export default function IndexHydrator({ 
    reviews, 
    articles, 
    news, 
    releases, 
    metadata 
}: { 
    reviews: any[], 
    articles: any[], 
    news: any[], 
    releases: any[],
    metadata: any
}) {
    const hydrateIndex = useContentStore((state) => state.hydrateIndex);
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current) return;
        hasHydrated.current = true;

        // 1. REVIEWS INDEX DATA
        // FIX: Pass FULL reviews array. Do not slice. 
        // The ReviewsPageClient will filter the hero out of the grid view visually,
        // but needs the full list for accurate pagination offsets.
        hydrateIndex('reviews', {
            hero: reviews[0], 
            grid: reviews, 
            allGames: metadata?.games || [],
            allTags: metadata?.gameTags || []
        });

        // 2. ARTICLES INDEX DATA
        hydrateIndex('articles', {
            featured: articles.slice(0, 5),
            grid: articles, 
            allGames: metadata?.games || [],
            allGameTags: metadata?.gameTags || [],
            allArticleTypeTags: metadata?.articleTags || []
        });

        // 3. NEWS INDEX DATA
        hydrateIndex('news', {
            hero: news.slice(0, 4),
            grid: news, 
            allGames: metadata?.games || [],
            allTags: metadata?.newsTags || []
        });

        // 4. RELEASES INDEX DATA
        hydrateIndex('releases', {
            releases: releases
        });

    }, [reviews, articles, news, releases, metadata, hydrateIndex]);

    return null;
}