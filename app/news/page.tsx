// app/news/page.tsx
import { client } from '@/lib/sanity.client';
import { newsIndexQuery } from '@/lib/sanity.queries';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import NewsPageClient from './NewsPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { enrichContentList } from '@/lib/enrichment';
import IndexPageSkeleton from '@/components/skeletons/IndexPageSkeleton';

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
  const data = await client.fetch(newsIndexQuery);

  const {
      hero: heroNewsRaw,
      grid: initialGridNewsRaw,
      games: allGames,
      tags: allTagsRaw
  } = data;

  const allTags = deduplicateTags(allTagsRaw);

  if (!heroNewsRaw || heroNewsRaw.length === 0) {
    return (
        <div className="container page-container">
            <h1 className="page-title">موجز الأنباء</h1>
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لا أنباءَ تُذكَر. سنوافيكم بالجديد.</p>
        </div>
    );
  }

  const heroArticles = (await enrichContentList(heroNewsRaw)) as SanityNews[];
  const initialGridArticles = (await enrichContentList(initialGridNewsRaw)) as SanityNews[];

  return (
    <Suspense fallback={<IndexPageSkeleton heroVariant="news" />}>
      <NewsPageClient
        heroArticles={heroArticles}
        initialGridArticles={initialGridArticles}
        allGames={allGames || []}
        allTags={allTags || []}
      />
    </Suspense>
  );
}