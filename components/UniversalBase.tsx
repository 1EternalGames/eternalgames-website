// components/UniversalBase.tsx
'use client';

import React, { useMemo } from 'react';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import AnimatedReleases from '@/components/AnimatedReleases';
import HomepageFeeds from '@/components/homepage/HomepageFeeds';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import { useContentStore } from '@/lib/contentStore';
import { usePathname } from 'next/navigation';

interface UniversalBaseProps {
    data: {
        reviews: any[];
        articles: any[];
        news: any[];
        releases: any[];
        credits: any[];
        metadata: any;
    };
}

export default function UniversalBase({ data }: UniversalBaseProps) {
    const pathname = usePathname();
    const isOverlayOpen = useContentStore(s => s.isOverlayOpen);
    
    // Determine visibility:
    // 1. If we are on the root path '/', we are fully visible.
    // 2. If we are on a subpath (e.g. '/reviews'), we are technically "covered" by the page content (children).
    //    HOWEVER, for the overlay system to work smoothly, we keep this mounted.
    //    If an overlay is OPEN, this base layer sits behind it.
    
    const isRoot = pathname === '/';
    
    // Processing Data for DigitalAtrium
    const { reviews, articles, news, releases, credits } = data;

    const feedsContent = useMemo(() => {
        const topArticles = articles.slice(0, 2).map(i => adaptToCardProps(i, { width: 800 })).filter(Boolean) as CardProps[];
        const latestArticles = articles.slice(2, 12).map(i => adaptToCardProps(i, { width: 400 })).filter(Boolean) as CardProps[];
        
        const pinnedNews = news.slice(0, 3).map(i => adaptToCardProps(i, { width: 600 })).filter(Boolean) as CardProps[];
        const newsList = news.slice(3, 18).map(i => adaptToCardProps(i, { width: 300 })).filter(Boolean) as CardProps[];
        
        return (
            <HomepageFeeds 
                topArticles={topArticles} 
                latestArticles={latestArticles} 
                pinnedNews={pinnedNews} 
                newsList={newsList} 
            />
        );
    }, [articles, news]);

    const releasesSection = useMemo(() => {
        const sanitizedReleases = (releases || []).filter((item: any) => 
            item?.mainImage?.url && item.releaseDate && item.title && item.slug
        );
        return <AnimatedReleases releases={sanitizedReleases} credits={credits} />;
    }, [releases, credits]);

    // OPTIMIZATION: When overlay is open, we can freeze/hide this layer to save GPU,
    // but to keep scroll position valid, we just leave it.
    // CSS module usually handles `display: none` via `body.editor-active` for Studio, 
    // but for the public site overlays, we want it visible underneath (glass effect).

    return (
        <div 
            id="universal-base-layer"
            style={{ 
                // If not root and no overlay is open, the children (Next.js Page) cover this.
                // But we want to allow "seeing through" if the top page is transparent?
                // Actually, Next.js mounts children *after* layout content by default? No, layout wraps children.
                // So this component renders *before* {children} in layout.tsx.
                // We keep it flow-normal.
                display: 'block'
            }}
        >
            <DigitalAtriumHomePage 
                reviews={reviews}
                feedsContent={feedsContent}
                releasesSection={releasesSection}
            />
        </div>
    );
}