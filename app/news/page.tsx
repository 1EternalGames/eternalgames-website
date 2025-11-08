// app/news/page.tsx
import { client } from '@/lib/sanity.client';
import { newsHeroQuery, newsGridInitialQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import NewsPageClient from './NewsPageClient';
import { Suspense } from 'react';

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allNewsTagsQuery = groq`*[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function NewsPage() {
  const [heroNewsRaw, initialGridNewsRaw, allGames, allTags]: [SanityNews[], SanityNews[], SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(newsHeroQuery),
    client.fetch(newsGridInitialQuery),
    client.fetch(allGamesQuery),
    client.fetch(allNewsTagsQuery),
  ]);

  if (!heroNewsRaw || heroNewsRaw.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">موجز الأنباء</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لا توجد أخبار حاليًا. سنعود بالجديد.</p>
        </div>
    );
  }

  const NewsPageFallback = () => (
    <div className="container page-container" style={{display: 'flex', alignItems:'center', justifyContent: 'center', minHeight: '80vh'}}>
      <div className="spinner" />
    </div>
  );

  return (
    <Suspense fallback={<NewsPageFallback />}>
      <NewsPageClient
        heroArticles={heroNewsRaw || []}
        initialGridArticles={initialGridNewsRaw || []}
        allGames={allGames || []}
        allTags={allTags || []}
      />
    </Suspense>
  );
}