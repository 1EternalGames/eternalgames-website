// components/UniversalBase.tsx
'use client';

import React, { useMemo, memo } from 'react';
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

// Optimization: Memoize the heavy internal structure.
// This ensures that when the parent UniversalBase re-renders (e.g. to toggle display:none),
// React doesn't try to diff the entire 3D scene and grid again.
const HeavyHomeContent = memo(function HeavyHomeContent({ data }: UniversalBaseProps) {
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

    return (
        <DigitalAtriumHomePage 
            reviews={reviews}
            feedsContent={feedsContent}
            releasesSection={releasesSection}
        />
    );
});

export default function UniversalBase({ data }: UniversalBaseProps) {
    const pathname = usePathname();
    const isOverlayOpen = useContentStore(s => s.isOverlayOpen);
    
    // If on homepage OR overlay is open, we keep this mounted.
    // If on sub-pages (e.g. /reviews) without overlay, we hide it via CSS.
    // Note: We avoid unmounting entirely to keep the 3D context alive if possible,
    // but Next.js router might unmount it on page change anyway.
    // This logic mainly helps when navigating BACK to home or opening overlay from home.
    const shouldRender = pathname === '/' || isOverlayOpen;
    
    return (
        <div 
            id="universal-base-layer"
            style={{ 
                display: shouldRender ? 'block' : 'none'
            }}
        >
            <HeavyHomeContent data={data} />
        </div>
    );
}