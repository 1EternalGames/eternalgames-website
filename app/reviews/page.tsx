// app/reviews/page.tsx
import { client } from '@/lib/sanity.client';
// MODIFIED: Import both heavy and lean queries
import { featuredHeroReviewQuery, allReviewsListQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import ReviewsPageClient from './ReviewsPageClient';

export const revalidate = 60;

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
// THE FIX: Only fetch tags relevant to reviews.
const allTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function ReviewsPage() {
  // MODIFIED: Fetch hero and list data in parallel
  const [heroReview, otherReviews, allGames, allTags]: [SanityReview, SanityReview[], SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(featuredHeroReviewQuery),      // Fetches one "heavy" review for the hero
    client.fetch(allReviewsListQuery),         // Fetches all reviews "lean" for the grid
    client.fetch(allGamesQuery),
    client.fetch(allTagsQuery),
  ]);

  // Ensure hero review exists to prevent crashes
  if (!heroReview) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد حاليًا أي مراجعات في الأرشيف. عد قريبًا.</p>
      </div>
    );
  }

  // Filter the main list to exclude the hero review, preventing duplication
  const gridReviews = (otherReviews || []).filter(review => review._id !== heroReview._id);

  return (
    <ReviewsPageClient 
      heroReview={heroReview} 
      otherReviews={gridReviews}
      allGames={allGames}
      allTags={allTags}
    />
  );
}


