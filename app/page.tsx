// app/page.tsx
import { client } from '@/lib/sanity.client';
import { heroContentQuery, latestNewsQuery, allReleasesQuery, featuredReviewsQuery, featuredArticlesQuery } from '@/lib/sanity.queries';
import DigitalAtriumHomePage from '@/components/DigitalAtriumHomePage';
import { Suspense } from 'react';
import AnimatedReleases from '@/components/AnimatedReleases'; // <-- IMPORT THE NEW CLIENT COMPONENT

export const revalidate = 60;

// This async component fetches the data for the releases...
async function ReleasesSection() {
    const releases = await client.fetch(allReleasesQuery);
    const sanitizedReleases = (releases || []).filter(item => item?.mainImage);
    // ...and renders the CLIENT component, passing the data as a prop.
    return <AnimatedReleases releases={sanitizedReleases} />;
}

export default async function HomePage() {
    // Stage 1: Fetch all critical content EXCEPT releases.
    const [heroContent, reviews, articles, latestNews] = await Promise.all([
        client.fetch(heroContentQuery),
        client.fetch(featuredReviewsQuery),
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


