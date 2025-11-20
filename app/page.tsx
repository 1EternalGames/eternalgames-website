// app/page.tsx
import { unstable_cache } from 'next/cache';
import React from 'react';
import { client } from '@/lib/sanity.client';
import { allReleasesQuery, vanguardReviewsQuery, homepageArticlesQuery, homepageNewsQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';
import prisma from '@/lib/prisma';
import { SanityReview } from '@/types/sanity';
import HomepageFeeds from '@/components/homepage/HomepageFeeds';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import { enrichContentList } from '@/lib/enrichment';

const getCachedEngagementScoresMap = unstable_cache(
    async (): Promise<[number, number][]> => {
        try {
            const contentTypes = ['review', 'article', 'news'];
            const contentIdsQuery = await prisma.engagement.findMany({
                where: { contentType: { in: contentTypes }, type: 'LIKE' },
                select: { contentId: true },
                distinct: ['contentId']
            });
            const ids = contentIdsQuery.map((i: any) => i.contentId);

            const [likes, shares] = await Promise.all([
                prisma.engagement.groupBy({ by: ['contentId'], where: { contentId: { in: ids }, type: 'LIKE' }, _count: { userId: true } }),
                prisma.share.groupBy({ by: ['contentId'], where: { contentId: { in: ids } }, _count: { userId: true } })
            ]);

            const scoresMap = new Map<number, number>();
            ids.forEach((id: number) => {
                const likeCount = likes.find((s: any) => s.contentId === id)?._count.userId || 0;
                const shareCount = shares.find((s: any) => s.contentId === id)?._count.userId || 0;
                scoresMap.set(id, (likeCount * 2) + (shareCount * 5));
            });
            return Array.from(scoresMap.entries());
        } catch (error) {
            console.warn('[CACHE WARNING] DB connection failed for engagement scores. Gracefully continuing. Error:', error);
            return [];
        }
    },
    ['homepage-engagement-scores'],
    { tags: ['engagement-scores'] }
);


async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter((item: any) => 
        item?.mainImage?.url && item.releaseDate && item.title && item.slug
    );
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    const [
        reviewsRaw, 
        homepageArticlesRaw, 
        homepageNewsRaw, 
        scoresArray
    ] = await Promise.all([
        client.fetch(vanguardReviewsQuery),
        client.fetch(homepageArticlesQuery),
        client.fetch(homepageNewsQuery),
        getCachedEngagementScoresMap()
    ]);

    const reviews = (await enrichContentList(reviewsRaw)) as SanityReview[];
    const homepageArticles = await enrichContentList(homepageArticlesRaw);
    const homepageNews = await enrichContentList(homepageNewsRaw);

    if (reviews.length > 0) {
        const topRatedIndex = reviews.reduce((topIndex: number, currentReview: SanityReview, currentIndex: number) => {
            const topScore = reviews[topIndex].score ?? 0;
            const currentScore = currentReview.score ?? 0;
            return currentScore > topScore ? currentIndex : topIndex;
        }, 0);
        
        if (topRatedIndex > 0) {
            const [topRatedReview] = reviews.splice(topRatedIndex, 1);
            reviews.unshift(topRatedReview);
        }
    }

    const scoresMap = new Map(scoresArray);
    
    const sortItemsByScore = (items: any[]) => {
        return [...items].sort((a, b) => (scoresMap.get(b.legacyId) || 0) - (scoresMap.get(a.legacyId) || 0));
    };

    const sortedArticlesByScore = sortItemsByScore(homepageArticles);
    const topArticlesRaw = sortedArticlesByScore.slice(0, 2);
    const topArticleIds = new Set(topArticlesRaw.map((a: any) => a._id));
    // OPTIMIZATION: Request 800px for top cards
    const topArticles = topArticlesRaw.map(item => adaptToCardProps(item, { width: 800 })).filter(Boolean) as CardProps[];

    const latestArticles = homepageArticles
        .filter((a: any) => !topArticleIds.has(a._id))
        .slice(0, 10)
        // OPTIMIZATION: Request 400px for list items
        .map(item => adaptToCardProps(item, { width: 400 }))
        .filter(Boolean) as CardProps[];
    
    const sortedNewsByScore = sortItemsByScore(homepageNews);
    const topNewsRaw = sortedNewsByScore.slice(0, 3);
    const topNewsIds = new Set(topNewsRaw.map((n: any) => n._id));
    // OPTIMIZATION: 600px for spotlight
    const pinnedNews = topNewsRaw.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[];

    const newsList = homepageNews
        .filter((n: any) => !topNewsIds.has(n._id))
        .slice(0, 15)
        // OPTIMIZATION: 300px for stream
        .map(item => adaptToCardProps(item, { width: 300 }))
        .filter(Boolean) as CardProps[];

    const feedsContent = (
        <HomepageFeeds 
            topArticles={topArticles} 
            latestArticles={latestArticles} 
            pinnedNews={pinnedNews} 
            newsList={newsList} 
        />
    );

    const releasesSection = <ReleasesSection />;

    return (
        <DigitalAtriumHomePage 
            reviews={reviews}
            feedsContent={feedsContent}
            releasesSection={releasesSection}
        />
    );
}