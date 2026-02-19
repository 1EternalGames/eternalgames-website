// app/reviews/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import CollectionPageJsonLd from '@/components/seo/CollectionPageJsonLd';
import { getUniversalBaseData } from '@/app/actions/layoutActions';
import ReviewsPageClient from './ReviewsPageClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'المراجعات',
  description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames.',
  alternates: { canonical: '/reviews' }
};

export default async function ReviewsPage() {
  // We fetch Universal Data here too because this page acts as an entry point.
  // The layout has already fetched it, so this cache hit is cheap.
  // We need it to pass to the Client Component for the "Base Layer" if user reloads here.
  const data = await getUniversalBaseData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eternalgamesweb.com';

  // Extract Review Data from Universal Set
  const { reviews: allReviews, metadata: meta } = data;
  const heroReview = allReviews[0];
  const gridReviews = allReviews; // Full list

  const itemList = gridReviews.map((item: any) => ({
      headline: item.title,
      url: `${siteUrl}/reviews/${item.slug}`,
      datePublished: item.publishedAt
  }));

  if (!heroReview) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>الأرشيفُ خالٍ من المراجعاتِ حاليًا.</p>
      </div>
    );
  }

  return (
    <>
      <CollectionPageJsonLd 
        name="مراجعات الألعاب" 
        description="أحدث مراجعات الألعاب من فريق EternalGames" 
        url={`${siteUrl}/reviews`}
        hasPart={itemList}
      />
      
      {/* 
         We don't need hydration here anymore because UserStoreHydration (in Layout) 
         has already flooded the store with the Universal Data (including reviews).
         We just render the visual client.
      */}
      <ReviewsPageClient 
        heroReview={heroReview} 
        initialGridReviews={gridReviews}
        allGames={meta?.games || []}
        allTags={meta?.gameTags || []}
      />
    </>
  );
}