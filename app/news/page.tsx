// app/news/page.tsx
import { client } from '@/lib/sanity.client';
import { newsHeroQuery, newsGridInitialQuery } from '@/lib/sanity.queries';
import { groq } from 'next-sanity';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import NewsPageClient from './NewsPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأخبار',
  description: 'تغطية شاملة وموجزة لآخر أخبار صناعة الألعاب. ابقَ على اطلاع دائم بكل ما هو جديد ومهم.',
  alternates: {
    canonical: '/news',
  },
  openGraph: {
    title: 'الأخبار | EternalGames',
    description: 'تغطية شاملة وموجزة لآخر أخبار صناعة الألعاب.',
  },
  twitter: {
    title: 'الأخبار | EternalGames',
    description: 'تغطية شاملة وموجزة لآخر أخبار صناعة الألعاب.',
  }
};

const allGamesQuery = groq`*[_type == "game"] | order(title asc) {_id, title, "slug": slug.current}`;
const allNewsTagsQuery = groq`*[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current, category}`;

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

export default async function NewsPage() {
  const [heroNewsRaw, initialGridNewsRaw, allGames, allTagsRaw]: [SanityNews[], SanityNews[], SanityGame[], SanityTag[]] = await Promise.all([
    client.fetch(newsHeroQuery),
    client.fetch(newsGridInitialQuery),
    client.fetch(allGamesQuery),
    client.fetch(allNewsTagsQuery),
  ]);

  const allTags = deduplicateTags(allTagsRaw);

  if (!heroNewsRaw || heroNewsRaw.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">موجز الأنباء</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لا أنباءَ تُذكَر. سنوافيكم بالجديد.</p>
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