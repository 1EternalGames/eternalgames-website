// app/reviews/page.tsx
import { client } from '@/lib/sanity.client';
import { featuredHeroReviewQuery, allReviewsListQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import ReviewsPageClient from './ReviewsPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';

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

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function ReviewsPage() {
  const [heroReview, initialGridReviews, allGames, allTags]: [SanityReview, SanityReview[], SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(featuredHeroReviewQuery),
    client.fetch(allReviewsListQuery),
    client.fetch(allGamesQuery),
    client.fetch(allTagsQuery),
  ]);

  if (!heroReview) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>الأرشيفُ خالٍ من المراجعاتِ حاليًا. عُد قريبًا.</p>
      </div>
    );
  }

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