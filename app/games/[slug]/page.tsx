// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';
import { getCachedGamePageData } from '@/lib/sanity.fetch';
import { enrichContentList } from '@/lib/enrichment'; // OPTIMIZATION
import { unstable_cache } from 'next/cache';

export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

// Optimized cache wrapper that includes enrichment to avoid waterfall
const getEnrichedGameData = unstable_cache(
    async (slug: string) => {
        const data = await getCachedGamePageData(slug); // This hits Sanity via cache
        if (!data) return null;
        
        // Enrich the items list inside this cached function
        const enrichedItems = await enrichContentList(data.items || []);
        return { ...data, items: enrichedItems };
    },
    ['enriched-game-data'],
    { tags: ['game', 'content'] }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gameSlug = decodeURIComponent(slug);

  // Request Memoization ensures this fetch is shared with the Page component
  const data = await getEnrichedGameData(gameSlug);

  if (!data) return {}; 
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const title = `محور لعبة: ${data.title}`;
  const description = `استكشف كل المحتوى المتعلق بلعبة ${data.title} على EternalGames.`;
  const ogImageUrl = data.mainImage 
    ? urlFor(data.mainImage).width(1200).height(630).fit('crop').format('jpg').url()
    : `${siteUrl}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/games/${gameSlug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: data.title }],
      type: 'website',
    },
  };
}

export async function generateStaticParams() {
    try {
        const slugs = await client.fetch<string[]>(`*[_type == "game" && defined(slug.current)][].slug.current`);
        return slugs.map((slug) => ({
            slug,
        }));
    } catch (error) {
        return [];
    }
}

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const gameSlug = decodeURIComponent(slug);

    // Returns result instantly from Metadata request cache (and internal cache)
    const data = await getEnrichedGameData(gameSlug);

    if (!data) {
        notFound();
    }

    const { title: gameTitle, items: allItems } = data;

    if (!allItems || allItems.length === 0) {
        return (
             <div className="container page-container">
                <h1 className="page-title">محور لعبة:&quot;{gameTitle}&quot;</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.8rem', maxWidth: '600px', margin: '0 auto'}}>
                    لم يُخطَّ حرفٌ بعدُ عن هذه اللعبة. الأرشيفُ يترقب.
                </p>
            </div>
        );
    }

    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={gameTitle}
            hubType="اللعبة"
        />
    );
}