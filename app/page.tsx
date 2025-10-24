// app/page.tsx
import { client } from '@/lib/sanity.client';
import { heroContentQuery, latestNewsQuery, allReleasesQuery, vanguardReviewsQuery, featuredArticlesQuery } from '@/lib/sanity.queries'; // <-- UPDATED IMPORT
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases';

export const revalidate = 60;

async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter(item => item?.mainImage);
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    const [heroContent, reviews, articles, latestNews] = await Promise.all([
        client.fetch(heroContentQuery),
        client.fetch(vanguardReviewsQuery), // <-- USE NEW QUERY
        client.fetch(featuredArticlesQuery),
        client.fetch(latestNewsQuery)
    ]);
    
    const sanitizedHeroContent = {
        featuredReview: heroContent?.featuredReview?.mainImage ? heroContent.featuredReview : null,
        latestNews: heroContent?.latestNews?.mainImage ? heroContent.latestNews : null,
        featuredArticle: heroContent?.featuredArticle?.mainImage ? heroContent.featuredArticle : null,
    };

    return (
        <DigitalAtriumHomePage
            heroContent={sanitizedHeroContent}
            reviews={reviews}
            articles={articles}
            latestNews={latestNews}
        >
            <Suspense fallback={<div className="spinner" style={{margin: '12rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <ReleasesSection />
            </Suspense>
        </DigitalAtriumHomePage>
    );
}