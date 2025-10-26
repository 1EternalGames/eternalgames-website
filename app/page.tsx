// app/page.tsx
import { client } from '@/lib/sanity.client';
import { allReleasesQuery, vanguardReviewsQuery, homePageArticlesQuery, homePageNewsQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';
import prisma from '@/lib/prisma';
import { SanityAuthor } from '@/types/sanity';
import HomePageSecondaryFeatures from '@/components/homepage/HomePageSecondaryFeatures';

export const revalidate = 60;

async function enrichCreators(creators: SanityAuthor[] | undefined): Promise<SanityAuthor[]> {
    if (!creators || creators.length === 0) return [];
    
    const userIds = creators.map(c => c.prismaUserId).filter(Boolean);
    if (userIds.length === 0) return creators;

    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
    });
    const usernameMap = new Map(users.map(u => [u.id, u.username]));

    return creators.map(creator => ({
        ...creator,
        username: usernameMap.get(creator.prismaUserId) || creator.username || null,
    }));
}

async function enrichContentList(list: any[]) {
    return Promise.all(
        list.map(async (item) => ({
            ...item,
            authors: await enrichCreators(item.authors),
            reporters: await enrichCreators(item.reporters),
            designers: await enrichCreators(item.designers),
        }))
    );
}

async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter(item => item?.mainImage);
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    const [reviews, articles, news] = await Promise.all([
        client.fetch(vanguardReviewsQuery),
        client.fetch(homePageArticlesQuery),
        client.fetch(homePageNewsQuery),
    ]);
    
    const [enrichedReviews, enrichedArticles, enrichedNews] = await Promise.all([
        enrichContentList(reviews),
        enrichContentList(articles),
        enrichContentList(news),
    ]);

    return (
        <DigitalAtriumHomePage reviews={enrichedReviews}>
            <HomePageSecondaryFeatures articles={enrichedArticles} news={enrichedNews} />
            <Suspense fallback={<div className="spinner" style={{margin: '12rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <ReleasesSection />
            </Suspense>
        </DigitalAtriumHomePage>
    );
}