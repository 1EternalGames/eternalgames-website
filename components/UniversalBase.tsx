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
    
    // Logic: 
    // 1. If we are on the homepage, we MUST render the base (it's the main content).
    // 2. If we are on any other page, we ONLY render if the overlay is open (to show background).
    // 3. This CSS-based toggle is much cheaper than unmounting/remounting the heavy 3D scene.
    
    const shouldDisplay = pathname === '/' || isOverlayOpen;
    
    return (
        <div 
            id="universal-base-layer"
            style={{ 
                // Hide purely with CSS to keep WebGL context alive but invisible
                display: shouldDisplay ? 'block' : 'none',
                // Ensure it sits below everything on the Z-index stack if it's the background
                position: 'relative',
                zIndex: 0
            }}
        >
            <HeavyHomeContent data={data} />
        </div>
    );
}