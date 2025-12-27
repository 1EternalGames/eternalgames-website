// app/news/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import NewsPageClient from './NewsPageClient';
import { getUniversalBaseData } from '@/app/actions/layoutActions';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'الأخبار',
  description: 'تغطية شاملة وموجزة لآخر أخبار صناعة الألعاب.',
  alternates: { canonical: '/news' }
};

export default async function NewsPage() {
  const data = await getUniversalBaseData();
  const { news: allNews, metadata: meta } = data;

  const heroNews = allNews.slice(0, 4);
  const gridNews = allNews;

  if (allNews.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">موجز الأنباء</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لا أنباءَ تُذكَر.</p>
        </div>
    );
  }

  return (
    <NewsPageClient
      heroArticles={heroNews}
      initialGridArticles={gridNews}
      allGames={meta?.games || []}
      allTags={meta?.newsTags || []}
    />
  );
}