// components/kinetic/IndexHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';

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
    const { hydrateIndex, pageMap } = useContentStore();
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current) return;
        hasHydrated.current = true;

        // FIX: Only hydrate if store has LESS data than what we have initially.
        // This prevents overwriting expanded lists (loaded via infinite scroll) with the shorter initial list
        // when navigating back to the homepage.
        
        // 1. REVIEWS
        const storedReviews = pageMap.get('reviews');
        if (!storedReviews || storedReviews.grid.length <= reviews.length) {
            hydrateIndex('reviews', {
                hero: reviews[0], 
                grid: reviews, 
                allGames: metadata?.games || [],
                allTags: metadata?.gameTags || [],
                nextOffset: reviews.length // Initialize offset
            });
        }

        // 2. ARTICLES
        const storedArticles = pageMap.get('articles');
        if (!storedArticles || storedArticles.grid.length <= articles.length) {
            hydrateIndex('articles', {
                featured: articles.slice(0, 5),
                grid: articles, 
                allGames: metadata?.games || [],
                allGameTags: metadata?.gameTags || [],
                allArticleTypeTags: metadata?.articleTags || [],
                nextOffset: articles.length
            });
        }

        // 3. NEWS
        const storedNews = pageMap.get('news');
        if (!storedNews || storedNews.grid.length <= news.length) {
            hydrateIndex('news', {
                hero: news.slice(0, 4),
                grid: news, 
                allGames: metadata?.games || [],
                allTags: metadata?.newsTags || [],
                nextOffset: news.length
            });
        }

        // 4. RELEASES
        // Releases are typically fully loaded or static, so we can overwrite safely or check length
        if (!pageMap.has('releases')) {
            hydrateIndex('releases', {
                releases: releases
            });
        }

    }, [reviews, articles, news, releases, metadata, hydrateIndex, pageMap]);

    return null;
}