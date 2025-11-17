// app/articles/page.tsx
import { client } from '@/lib/sanity.client';
import { featuredShowcaseArticlesQuery, allArticlesListQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import ArticlesPageClient from './ArticlesPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المقالات',
  description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة لأحدث الظواهر في عالم الألعاب من خبراء EternalGames.',
  openGraph: {
    title: 'المقالات | EternalGames',
    description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة لأحدث الظواهر في عالم الألعاب.',
  },
  twitter: {
    title: 'المقالات | EternalGames',
    description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة لأحدث الظواهر في عالم الألعاب.',
  }
};

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allGameTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current, category}`;
const allArticleTypeTagsQuery = groq`*[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current, category}`;

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

export default async function ArticlesPage() {
  const [featuredArticles, initialGridArticles, allGames, allGameTagsRaw, allArticleTypeTagsRaw]: [SanityArticle[], SanityArticle[], SanityGame[], SanityTag[], SanityTag[]] = await Promise.all([
    client.fetch(featuredShowcaseArticlesQuery),
    client.fetch(allArticlesListQuery),
    client.fetch(allGamesQuery),
    client.fetch(allGameTagsQuery),
    client.fetch(allArticleTypeTagsQuery),
  ]);

  const allGameTags = deduplicateTags(allGameTagsRaw);
  const allArticleTypeTags = deduplicateTags(allArticleTypeTagsRaw);

  if (!featuredArticles || featuredArticles.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">أحدث المقالات</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>بلغتَ المنتهى. مقالاتٌ أخرى تلوحُ في الأفق.</p>
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