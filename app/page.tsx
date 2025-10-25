// app/page.tsx
import { client } from '@/lib/sanity.client';
import { latestNewsQuery, allReleasesQuery, vanguardReviewsQuery, featuredArticlesQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';
import prisma from '@/lib/prisma';
import { SanityAuthor } from '@/types/sanity';

export const revalidate = 60;

// Helper to enrich an array of creator documents with usernames from Prisma
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


async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter(item => item?.mainImage);
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    const [reviews, articles, latestNews] = await Promise.all([
        client.fetch(vanguardReviewsQuery),
        client.fetch(featuredArticlesQuery),
        client.fetch(latestNewsQuery)
    ]);
    
    // Enrich all fetched content with usernames from Prisma before sending to client components.
    const enrichedReviews = await Promise.all(
        reviews.map(async (review) => ({
            ...review,
            authors: await enrichCreators(review.authors),
            designers: await enrichCreators(review.designers),
        }))
    );

    const enrichedArticles = await Promise.all(
        articles.map(async (article) => ({
            ...article,
            authors: await enrichCreators(article.authors),
            designers: await enrichCreators(article.designers),
        }))
    );

    return (
        <DigitalAtriumHomePage
            reviews={enrichedReviews}
            articles={enrichedArticles}
            latestNews={latestNews}
        >
            <Suspense fallback={<div className="spinner" style={{margin: '12rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <ReleasesSection />
            </Suspense>
        </DigitalAtriumHomePage>
    );
}