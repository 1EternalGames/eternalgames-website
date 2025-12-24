// app/reviews/page.tsx
import { client } from '@/lib/sanity.client';
import { reviewsIndexQuery } from '@/lib/sanity.queries'; 
import type { SanityReview } from '@/types/sanity';
import ReviewsPageClient from './ReviewsPageClient';
import type { Metadata } from 'next';
import { enrichContentList, enrichCreators } from '@/lib/enrichment';
import { unstable_cache } from 'next/cache';
import CollectionPageJsonLd from '@/components/seo/CollectionPageJsonLd';
import GlobalContentHydrator from '@/components/utils/GlobalContentHydrator';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'المراجعات',
  description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames. تقييمات شاملة، تحليلات دقيقة، وحكم نهائي.',
  alternates: {
    canonical: '/reviews',
  },
  openGraph: {
    title: 'مراجعات | EternalGames',
    description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames.',
  },
  twitter: {
    title: 'مراجعات | EternalGames',
    description: 'استكشف أحدث وأعمق مراجعات الألعاب من فريق EternalGames.',
  }
};

const getCachedReviewsPageData = unstable_cache(
  async () => {
    const data = await client.fetch(reviewsIndexQuery);
    const { hero: heroReviewRaw, grid: initialGridReviewsRaw } = data;

    let heroReview = null;
    if (heroReviewRaw) {
        heroReview = {
            ...heroReviewRaw,
            authors: await enrichCreators(heroReviewRaw.authors),
            designers: await enrichCreators(heroReviewRaw.designers)
        };
    }

    const initialGridReviews = await enrichContentList(initialGridReviewsRaw) as SanityReview[];

    return {
      ...data,
      hero: heroReview,
      grid: initialGridReviews
    };
  },
  ['reviews-page-index-v2'],
  { 
    revalidate: false, 
    tags: ['review', 'content'] 
  }
);

export default async function ReviewsPage() {
  const data = await getCachedReviewsPageData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';

  const {
      hero: heroReview,
      grid: initialGridReviews,
      games: allGames,
      tags: allTags
  } = data;
  
  // Hydration Data
  const hydrationData = [...(initialGridReviews || [])];
  if(heroReview) hydrationData.push(heroReview);

  const itemList = (initialGridReviews || []).map((item: any) => ({
      headline: item.title,
      url: `${siteUrl}/reviews/${item.slug}`,
      datePublished: item.publishedAt
  }));
  if (heroReview) {
      itemList.unshift({
          headline: heroReview.title,
          url: `${siteUrl}/reviews/${heroReview.slug}`,
          datePublished: heroReview.publishedAt
      });
  }

  if (!heroReview) {
    return (
      <div className="container page-container">
        <h1 className="page-title">المراجعات</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>الأرشيفُ خالٍ من المراجعاتِ حاليًا. عُد قريبًا.</p>
      </div>
    );
  }
  
  const gridReviews = (initialGridReviews || []).filter((review: SanityReview) => review._id !== heroReview._id);

  return (
    <>
      <GlobalContentHydrator items={hydrationData} />
      <CollectionPageJsonLd 
        name="مراجعات الألعاب" 
        description="أحدث مراجعات الألعاب من فريق EternalGames" 
        url={`${siteUrl}/reviews`}
        hasPart={itemList}
      />
      <ReviewsPageClient 
        heroReview={heroReview} 
        initialGridReviews={gridReviews}
        allGames={allGames}
        allTags={allTags}
      />
    </>
  );
}