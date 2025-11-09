// app/page.tsx
import { unstable_cache } from 'next/cache';
import React from 'react';
import { client } from '@/lib/sanity.client';
import { allReleasesQuery, vanguardReviewsQuery, homepageArticlesQuery, homepageNewsQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';
import prisma from '@/lib/prisma';
import { SanityAuthor, SanityReview } from '@/types/sanity';
import HomepageFeeds from '@/components/homepage/HomepageFeeds';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';

const getCachedEnrichedCreators = unstable_cache(
    async (creatorIds: string[]): Promise<[string, string | null][]> => {
        if (creatorIds.length === 0) return [];
        try {
            const users = await prisma.user.findMany({
                where: { id: { in: creatorIds } },
                select: { id: true, username: true },
            });
            return users.map(u => [u.id, u.username || null]);
        } catch (error) {
            console.warn(`[CACHE WARNING] Database connection failed during cached creator enrichment. Skipping. Error:`, error);
            return [];
        }
    },
    ['enriched-creators'],
    { revalidate: 3600, tags: ['enriched-creators'] }
);

async function enrichCreators(creators: SanityAuthor[] | undefined): Promise<SanityAuthor[]> {
    if (!creators || creators.length === 0) return [];
    
    const userIds = creators.map(c => c.prismaUserId).filter(Boolean);
    if (userIds.length === 0) return creators;

    const usernameArray = await getCachedEnrichedCreators(userIds);
    const usernameMap = new Map(usernameArray);

    return creators.map(creator => ({
        ...creator,
        username: usernameMap.get(creator.prismaUserId) || creator.username || null,
    }));
}

const getCachedEngagementScoresMap = unstable_cache(
    async (): Promise<[number, number][]> => {
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
            return Array.from(scoresMap.entries());
        } catch (error) {
            console.warn('[CACHE WARNING] DB connection failed for engagement scores. Gracefully continuing. Error:', error);
            return [];
        }
    },
    ['homepage-engagement-scores'],
    { revalidate: 60, tags: ['engagement-scores'] }
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
        reviews, 
        homepageArticlesRaw, 
        homepageNewsRaw, 
        scoresArray
    ] = await Promise.all([
        client.fetch(vanguardReviewsQuery),
        client.fetch(homepageArticlesQuery),
        client.fetch(homepageNewsQuery),
        getCachedEngagementScoresMap()
    ]);

    // Reorder the reviews to place the highest-rated one first
    if (reviews.length > 0) {
        const topRatedIndex = reviews.reduce((topIndex: number, currentReview: SanityReview, currentIndex: number) => {
            const topScore = reviews[topIndex].score ?? 0;
            const currentScore = currentReview.score ?? 0;
            // In case of a tie, the more recent one (already earlier in the array) wins
            return currentScore > topScore ? currentIndex : topIndex;
        }, 0);
        
        // Move the top-rated review to the front if it's not already there
        if (topRatedIndex > 0) {
            const [topRatedReview] = reviews.splice(topRatedIndex, 1);
            reviews.unshift(topRatedReview);
        }
    }

    const scoresMap = new Map(scoresArray);
    
    const enrichedReviews = await Promise.all(
        reviews.map(async (review: any) => ({
            ...review,
            authors: await enrichCreators(review.authors),
            designers: await enrichCreators(review.designers),
        }))
    );
    
    const sortItemsByScore = (items: any[]) => {
        return [...items].sort((a, b) => (scoresMap.get(b.legacyId) || 0) - (scoresMap.get(a.legacyId) || 0));
    };

    const sortedArticlesByScore = sortItemsByScore(homepageArticlesRaw);
    const topArticlesRaw = sortedArticlesByScore.slice(0, 2);
    const topArticleIds = new Set(topArticlesRaw.map((a: any) => a._id));
    const topArticles = topArticlesRaw.map(adaptToCardProps).filter(Boolean) as CardProps[];

    const latestArticles = homepageArticlesRaw
        .filter((a: any) => !topArticleIds.has(a._id))
        .slice(0, 10)
        .map(adaptToCardProps)
        .filter(Boolean) as CardProps[];
    
    const sortedNewsByScore = sortItemsByScore(homepageNewsRaw);
    const topNewsRaw = sortedNewsByScore.slice(0, 3);
    const topNewsIds = new Set(topNewsRaw.map((n: any) => n._id));
    const pinnedNews = topNewsRaw.map(adaptToCardProps).filter(Boolean) as CardProps[];

    const newsList = homepageNewsRaw
        .filter((n: any) => !topNewsIds.has(n._id))
        .slice(0, 15)
        .map(adaptToCardProps)
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
            reviews={enrichedReviews}
            feedsContent={feedsContent}
            releasesSection={releasesSection}
        />
    );
}