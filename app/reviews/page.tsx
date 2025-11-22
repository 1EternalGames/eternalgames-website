// app/reviews/page.tsx
import { client } from '@/lib/sanity.client';
import { reviewsIndexQuery } from '@/lib/sanity.queries';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import ReviewsPageClient from './ReviewsPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { enrichContentList, enrichCreators } from '@/lib/enrichment';

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

// Helper function to remove duplicates based on title
const deduplicateTags = (tags: SanityTag[]): SanityTag[] => {
    if (!tags) return [];
    const uniqueMap = new Map<string, SanityTag>();
    tags.forEach(tag => {
        if (tag && tag.title && !uniqueMap.has(tag.title)) {
            uniqueMap.set(tag.title, tag);
        }
    });
    return Array.from(uniqueMap.values());
};

export default async function ReviewsPage() {
  // OPTIMIZATION: Fetch all data in a single batched request
  const data = await client.fetch(reviewsIndexQuery);

  const {
      hero: heroReviewRaw,
      grid: initialGridReviewsRaw,
      games: allGames,
      tags: allTagsRaw
  } = data;
  
  const allTags = deduplicateTags(allTagsRaw);

  if (!heroReviewRaw) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>الأرشيفُ خالٍ من المراجعاتِ حاليًا. عُد قريبًا.</p>
      </div>
    );
  }

  // Enrich data with usernames server-side to prevent client-side waterfalls
  const heroReview = {
      ...heroReviewRaw,
      authors: await enrichCreators(heroReviewRaw.authors),
      designers: await enrichCreators(heroReviewRaw.designers)
  };
  
  const initialGridReviews = (await enrichContentList(initialGridReviewsRaw)) as SanityReview[];
  const gridReviews = (initialGridReviews || []).filter(review => review._id !== heroReview._id);

  return (
    <Suspense fallback={<div className="spinner page-container" style={{margin: 'auto'}} />}>
      <ReviewsPageClient 
        heroReview={heroReview} 
        initialGridReviews={gridReviews}
        allGames={allGames}
        allTags={allTags}
      />
    </Suspense>
  );
}