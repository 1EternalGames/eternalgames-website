// app/news/page.tsx
import { client } from '@/lib/sanity.client';
import { allNewsListQuery } from '@/lib/sanity.queries'; // Use LEAN query
import { groq } from 'next-sanity';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import NewsPageClient from './NewsPageClient';
import { Suspense } from 'react';

export const revalidate = 60;

// Fetch all filter options (unchanged)
const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
// THE FIX: Only fetch tags relevant to news.
const allTagsQuery = groq`*[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function NewsPage() {
  // REVERTED: Fetch only fast Sanity data.
  const [allNews, allGames, allTags]: [SanityNews[], SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(allNewsListQuery),
    client.fetch(allGamesQuery),
    client.fetch(allTagsQuery),
  ]);

  if (!allNews || allNews.length === 0) {
    return (
      <div className="container page-container">
        <h1 className="page-title">موجز كرونوس</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>أرشيف الأخبار فارغ حاليًا. يرجى العودة لاحقًا.</p>
      </div>
    );
  }
  
  const latestHeadlines = allNews.slice(0, 7);

  // THE FIX: Wrap the client component in Suspense
  return (
    <Suspense fallback={<div className="spinner page-container" style={{margin: 'auto'}} />}>
      <NewsPageClient
        allNews={allNews}
        latestHeadlines={latestHeadlines}
        allGames={allGames}
        allTags={allTags}
      />
    </Suspense>
  );
}