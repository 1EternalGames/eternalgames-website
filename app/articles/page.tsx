// app/articles/page.tsx
import { client } from '@/lib/sanity.client';
import { featuredShowcaseArticlesQuery, paginatedArticlesQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import ArticlesPageClient from './ArticlesPageClient';
import { Suspense } from 'react';
import GridPageSkeleton from '@/components/skeletons/GridPageSkeleton';

export const revalidate = 60;

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allGameTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allArticleTypeTagsQuery = groq`*[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function ArticlesPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [featuredArticles, allGames, allGameTags, allArticleTypeTags]: [SanityArticle[], SanityGame[], SanityTag[], SanityTag[]] = await Promise.all([
    client.fetch(featuredShowcaseArticlesQuery),
    client.fetch(allGamesQuery),
    client.fetch(allGameTagsQuery),
    client.fetch(allArticleTypeTagsQuery),
  ]);

  const offset = 0;
  const limit = 20;
  const sort = (searchParams['sort'] as 'latest' | 'viral') || 'latest';
  const gameSlug = (searchParams['game'] as string) || undefined;
  const tagSlugs = searchParams['tags'] ? String(searchParams['tags']).split(',') : undefined;
  const searchTerm = (searchParams['q'] as string) || undefined;
  
  const query = paginatedArticlesQuery(gameSlug, tagSlugs, searchTerm, offset, limit, sort);
  const initialGridArticles: SanityArticle[] = await client.fetch(query);

  if (!featuredArticles || featuredArticles.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">ديوان الفن</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>الأرشيف هادئ. المزيد من المقالات قريبًا.</p>
        </div>
    );
  }

  return (
    <Suspense fallback={<GridPageSkeleton />}>
      <ArticlesPageClient
        featuredArticles={featuredArticles}
        initialGridArticles={initialGridArticles}
        allGames={allGames}
        allGameTags={allGameTags}
        allArticleTypeTags={allArticleTypeTags}
      />
    </Suspense>
  );
}