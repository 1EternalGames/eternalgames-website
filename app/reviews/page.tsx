// app/reviews/page.tsx
import { client } from '@/lib/sanity.client';
import { featuredHeroReviewQuery, paginatedReviewsQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import ReviewsPageClient from './ReviewsPageClient';
import { Suspense } from 'react';
import GridPageSkeleton from '@/components/skeletons/GridPageSkeleton';
import { ScoreFilter } from '@/components/filters/ReviewFilters';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function ReviewsPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [heroReview, allGames, allTags]: [SanityReview, SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(featuredHeroReviewQuery),
    client.fetch(allGamesQuery),
    client.fetch(allTagsQuery),
  ]);

  const offset = 0; // Server-side filtering doesn't need pagination for initial load
  const limit = 20;
  const sort = (searchParams.sort as 'latest' | 'score') || 'latest';
  const scoreRange = (searchParams.score as ScoreFilter) || 'All';
  const gameSlug = (searchParams.game as string) || undefined;
  const tagSlugs = searchParams.tags ? String(searchParams.tags).split(',') : undefined;
  const searchTerm = (searchParams.q as string) || undefined;

  const query = paginatedReviewsQuery(gameSlug, tagSlugs, searchTerm, scoreRange, offset, limit, sort);
  const initialGridReviews: SanityReview[] = await client.fetch(query);
  
  if (!heroReview) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد حاليًا أي مراجعات في الأرشيف. عد قريبًا.</p>
      </div>
    );
  }

  // Ensure hero review isn't duplicated in the grid on initial load
  const gridReviews = (initialGridReviews || []).filter(review => review._id !== heroReview._id);

  return (
    <Suspense fallback={<GridPageSkeleton />}>
      <ReviewsPageClient 
        heroReview={heroReview} 
        initialGridReviews={gridReviews}
        allGames={allGames}
        allTags={allTags}
      />
    </Suspense>
  );
}