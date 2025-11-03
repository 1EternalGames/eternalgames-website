// app/articles/page.tsx
import { client } from '@/lib/sanity.client';
import { featuredShowcaseArticlesQuery, allArticlesListQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import ArticlesPageClient from './ArticlesPageClient';
import { Suspense } from 'react';

export const revalidate = 60;

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allGameTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allArticleTypeTagsQuery = groq`*[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current}`;

export default async function ArticlesPage() {
  const [featuredArticles, initialGridArticles, allGames, allGameTags, allArticleTypeTags]: [SanityArticle[], SanityArticle[], SanityGame[], SanityTag[], SanityTag[]] = await Promise.all([
    client.fetch(featuredShowcaseArticlesQuery),
    client.fetch(allArticlesListQuery),
    client.fetch(allGamesQuery),
    client.fetch(allGameTagsQuery),
    client.fetch(allArticleTypeTagsQuery),
  ]);

  if (!featuredArticles || featuredArticles.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">ديوان الفن</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>الأرشيف هادئ. المزيد من المقالات قريبًا.</p>
        </div>
    );
  }

  const ArticlesPageFallback = () => (
    <div className="container page-container" style={{display: 'flex', alignItems:'center', justifyContent: 'center'}}>
      <div className="spinner" />
    </div>
  );

  return (
    <Suspense fallback={<ArticlesPageFallback />}>
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