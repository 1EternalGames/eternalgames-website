// app/reviews/page.tsx
import { client } from '@/lib/sanity.client';
import { reviewsIndexQuery } from '@/lib/sanity.queries'; 
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import ReviewsPageClient from './ReviewsPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { enrichContentList, enrichCreators } from '@/lib/enrichment';
import IndexPageSkeleton from '@/components/skeletons/IndexPageSkeleton';
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: 'المراجعات',
  description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames. تقييمات شاملة، تحليلات دقيقة، وحكم نهائي.',
  alternates: {
    canonical: '/reviews',
  },
  openGraph: {
    title: 'مراجعات | EternalGames',
    description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames.',
  },
  twitter: {
    title: 'مراجعات | EternalGames',
    description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames.',
  }
};

// OPTIMIZATION: Cache the entire reviews page data fetch + enrichment
// This ensures we don't hit Sanity OR the Database on every request.
const getCachedReviewsPageData = unstable_cache(
  async () => {
    const data = await client.fetch(reviewsIndexQuery);
    const { hero: heroReviewRaw, grid: initialGridReviewsRaw } = data;

    // Enrich data inside the cache
    let heroReview = null;
    if (heroReviewRaw) {
        heroReview = {
            ...heroReviewRaw,
            authors: await enrichCreators(heroReviewRaw.authors),
            designers: await enrichCreators(heroReviewRaw.designers)
        };
    }

    const initialGridReviews = await enrichContentList(initialGridReviewsRaw) as SanityReview[];

    return {
      ...data,
      hero: heroReview,
      grid: initialGridReviews
    };
  },
  ['reviews-page-index'],
  { 
    revalidate: false, // Cache indefinitely
    tags: ['review', 'content'] // Revalidate when reviews are published/edited
  }
);

export default async function ReviewsPage() {
  const data = await getCachedReviewsPageData();

  const {
      hero: heroReview,
      grid: initialGridReviews,
      games: allGames,
      tags: allTags
  } = data;

  if (!heroReview) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>الأرشيفُ خالٍ من المراجعاتِ حاليًا. عُد قريبًا.</p>
      </div>
    );
  }
  
  // FIX: Explicitly type 'review' as SanityReview to satisfy TypeScript
  const gridReviews = (initialGridReviews || []).filter((review: SanityReview) => review._id !== heroReview._id);

  return (
    <Suspense fallback={<IndexPageSkeleton heroVariant="center" />}>
      <ReviewsPageClient 
        heroReview={heroReview} 
        initialGridReviews={gridReviews}
        allGames={allGames}
        allTags={allTags}
      />
    </Suspense>
  );
}