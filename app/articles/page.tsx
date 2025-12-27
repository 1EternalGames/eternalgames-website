// app/articles/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import ArticlesPageClient from './ArticlesPageClient';
import { getUniversalBaseData } from '@/app/actions/layoutActions';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'المقالات',
  description: 'مقالات معمقة، آراء جريئة، وتحليلات شاملة.',
  alternates: { canonical: '/articles' }
};

export default async function ArticlesPage() {
  const data = await getUniversalBaseData();
  const { articles: allArticles, metadata: meta } = data;

  const featuredArticles = allArticles.slice(0, 5);
  // Pass full list to grid for client-side filtering power
  const gridArticles = allArticles;

  if (allArticles.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">أحدث المقالات</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>بلغتَ المنتهى.</p>
        </div>
    );
  }

  return (
    <ArticlesPageClient
      featuredArticles={featuredArticles}
      initialGridArticles={gridArticles}
      allGames={meta?.games || []}
      allGameTags={meta?.gameTags || []}
      allArticleTypeTags={meta?.articleTags || []}
    />
  );
}