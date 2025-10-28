// app/page.tsx
import React from 'react';
import { client } from '@/lib/sanity.client';
import { allReleasesQuery, vanguardReviewsQuery, homepageArticlesQuery, homepageNewsQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';
import prisma from '@/lib/prisma';
import HomepageFeeds from '@/components/homepage/HomepageFeeds';
import { adaptToCardProps } from '@/lib/adapters';

export const revalidate = 60;

async function getEngagementScoresMap() {
    try {
        const contentTypes = ['review', 'article', 'news'];
        const contentIdsQuery = await prisma.engagement.findMany({
            where: { contentType: { in: contentTypes }, type: 'LIKE' },
            select: { contentId: true },
            distinct: ['contentId']
        });
        const ids = contentIdsQuery.map(i => i.contentId);

        const [likes, shares] = await Promise.all([
            prisma.engagement.groupBy({ by: ['contentId'], where: { contentId: { in: ids }, type: 'LIKE' }, _count: { userId: true } }),
            prisma.share.groupBy({ by: ['contentId'], where: { contentId: { in: ids } }, _count: { userId: true } })
        ]);

        const scoresMap = new Map<number, number>();
        ids.forEach(id => {
            const likeCount = likes.find(s => s.contentId === id)?._count.userId || 0;
            const shareCount = shares.find(s => s.contentId === id)?._count.userId || 0;
            scoresMap.set(id, (likeCount * 2) + (shareCount * 5));
        });
        return scoresMap;
    } catch (error) {
        console.error('Failed to fetch engagement scores on server:', error);
        return new Map<number, number>();
    }
}

async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter(item => item?.mainImage);
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    const [
        reviews, 
        homepageArticlesRaw, 
        homepageNewsRaw, 
        scoresMap
    ] = await Promise.all([
        client.fetch(vanguardReviewsQuery),
        client.fetch(homepageArticlesQuery),
        client.fetch(homepageNewsQuery),
        getEngagementScoresMap()
    ]);
    
    const sortItemsByScore = (items: any[]) => {
        return [...items].sort((a, b) => (scoresMap.get(b.legacyId) || 0) - (scoresMap.get(a.legacyId) || 0));
    };

    // --- ARTICLE LOGIC (CORRECTED) ---
    const sortedArticlesByScore = sortItemsByScore(homepageArticlesRaw);
    const topArticlesRaw = sortedArticlesByScore.slice(0, 2);
    const topArticleIds = new Set(topArticlesRaw.map(a => a._id));
    const topArticles = topArticlesRaw.map(adaptToCardProps).filter(Boolean);

    const latestArticles = homepageArticlesRaw
        .filter((a: any) => !topArticleIds.has(a._id))
        .slice(0, 10)
        .map(adaptToCardProps)
        .filter(Boolean);
    
    // --- NEWS LOGIC (CORRECTED) ---
    const sortedNewsByScore = sortItemsByScore(homepageNewsRaw);
    const topNewsRaw = sortedNewsByScore.slice(0, 3);
    const topNewsIds = new Set(topNewsRaw.map(n => n._id));
    const pinnedNews = topNewsRaw.map(adaptToCardProps).filter(Boolean);

    const newsList = homepageNewsRaw
        .filter((n: any) => !topNewsIds.has(n._id))
        .slice(0, 15)
        .map(adaptToCardProps)
        .filter(Boolean);

    return (
        <DigitalAtriumHomePage reviews={reviews}>
            {topArticles.length > 0 && <HomepageFeeds topArticles={topArticles} latestArticles={latestArticles} pinnedNews={pinnedNews} newsList={newsList} />}
            <Suspense fallback={<div className="spinner" style={{margin: '12rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <ReleasesSection />
            </Suspense>
        </DigitalAtriumHomePage>
    );
}