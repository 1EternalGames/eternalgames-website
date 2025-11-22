// app/articles/page.tsx
import { client } from '@/lib/sanity.client';
import { articlesIndexQuery } from '@/lib/sanity.queries';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import ArticlesPageClient from './ArticlesPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { enrichContentList } from '@/lib/enrichment';
import IndexPageSkeleton from '@/components/skeletons/IndexPageSkeleton';

export const metadata: Metadata = {
  title: 'المقالات',
  description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة لأحدث الظواهر في عالم الألعاب من خبراء EternalGames.',
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'المقالات | EternalGames',
    description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة لأحدث الظواهر في عالم الألعاب.',
  },
  twitter: {
    title: 'المقالات | EternalGames',
    description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة لأحدث الظواهر في عالم الألعاب.',
  }
};

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
  const data = await client.fetch(articlesIndexQuery);
  
  const { 
      featured: featuredArticlesRaw, 
      grid: initialGridArticlesRaw, 
      games: allGames, 
      gameTags: allGameTagsRaw, 
      typeTags: allArticleTypeTagsRaw 
  } = data;

  const allGameTags = deduplicateTags(allGameTagsRaw);
  const allArticleTypeTags = deduplicateTags(allArticleTypeTagsRaw);

  if (!featuredArticlesRaw || featuredArticlesRaw.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">أحدث المقالات</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>بلغتَ المنتهى. مقالاتٌ أخرى تلوحُ في الأفق.</p>
        </div>
    );
  }

  const featuredArticles = (await enrichContentList(featuredArticlesRaw)) as SanityArticle[];
  const initialGridArticles = (await enrichContentList(initialGridArticlesRaw)) as SanityArticle[];

  return (
    <Suspense fallback={<IndexPageSkeleton heroVariant="center" />}>
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