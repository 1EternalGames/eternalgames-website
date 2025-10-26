// app/page.tsx
import { client } from '@/lib/sanity.client';
import { allReleasesQuery, vanguardReviewsQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';
import prisma from '@/lib/prisma';
import { SanityAuthor } from '@/types/sanity';

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

async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter(item => item?.mainImage);
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    // Data fetching is simplified to only get the reviews.
    const reviews = await client.fetch(vanguardReviewsQuery);
    
    const enrichedReviews = await Promise.all(
        reviews.map(async (review) => ({
            ...review,
            authors: await enrichCreators(review.authors),
            designers: await enrichCreators(review.designers),
        }))
    );

    return (
        <DigitalAtriumHomePage reviews={enrichedReviews}>
            <Suspense fallback={<div className="spinner" style={{margin: '12rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <ReleasesSection />
            </Suspense>
        </DigitalAtriumHomePage>
    );
}