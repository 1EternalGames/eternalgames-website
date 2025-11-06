// app/news/page.tsx
import { client } from '@/lib/sanity.client';
import { newsHeroQuery, paginatedNewsQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import NewsPageClient from './NewsPageClient';
import { Suspense } from 'react';
import GridPageSkeleton from '@/components/skeletons/GridPageSkeleton';

export const revalidate = 60;

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allNewsTagsQuery = groq`*[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function NewsPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [heroNewsRaw, allGames, allTags]: [SanityNews[], SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(newsHeroQuery),
    client.fetch(allGamesQuery),
    client.fetch(allNewsTagsQuery),
  ]);

  const offset = 0;
  const limit = 50;
  const sort = (searchParams['sort'] as 'latest' | 'viral') || 'latest';
  const gameSlug = (searchParams['game'] as string) || undefined;
  const tagSlugs = searchParams['tags'] ? String(searchParams['tags']).split(',') : undefined;
  const searchTerm = (searchParams['q'] as string) || undefined;

  const query = paginatedNewsQuery(gameSlug, tagSlugs, searchTerm, offset, limit, sort);
  const initialGridNewsRaw: SanityNews[] = await client.fetch(query);

  if (!heroNewsRaw || heroNewsRaw.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">موجز الأنباء</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لا توجد أخبار حاليًا. سنعود بالجديد.</p>
        </div>
    );
  }

  return (
    <Suspense fallback={<div className="page-container"><GridPageSkeleton count={8}/></div>}>
      <NewsPageClient
        heroArticles={heroNewsRaw || []}
        initialGridArticles={initialGridNewsRaw || []}
        allGames={allGames || []}
        allTags={allTags || []}
      />
    </Suspense>
  );
}