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
    
    // LOGIC UPDATE:
    // 1. If we are on the root path ('/'), show the base.
    // 2. If an overlay is OPEN (isOverlayOpen === true), show the base (it acts as the glass background).
    // 3. Otherwise (e.g. on '/reviews' without overlay), hide it via CSS.
    const shouldRender = pathname === '/' || isOverlayOpen;
    
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

    // OPTIMIZATION:
    // Instead of returning null, we return the div with display: none.
    // This keeps the heavy 3D scene and layout mounted in the React tree,
    // preventing re-mount lag and navigation glitches when returning to Home.
    return (
        <div 
            id="universal-base-layer"
            style={{ 
                display: shouldRender ? 'block' : 'none'
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