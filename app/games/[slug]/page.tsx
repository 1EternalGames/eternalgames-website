// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';
import { getCachedGamePageData } from '@/lib/sanity.fetch';
import { enrichContentList } from '@/lib/enrichment';
import { unstable_cache } from 'next/cache';
import { groq } from 'next-sanity';

export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

// FIX: Updated query to include ALL release metadata (price, dev, pub, platforms)
const getEnrichedGameData = unstable_cache(
    async (slug: string) => {
        // 1. Fetch Basic Game Data & Content (Reviews/News/Articles)
        const data = await getCachedGamePageData(slug);
        if (!data) return null;
        
        const enrichedItems = await enrichContentList(data.items || []);
        
        // 2. Fetch the release document associated with this game to get metadata
        const releaseQuery = groq`*[_type == "gameRelease" && game->slug.current == $slug][0]{ 
            synopsis,
            price,
            "developer": developer->title,
            "publisher": publisher->title,
            platforms,
            tags[]->{title, "slug": slug.current},
            "releaseImage": mainImage
        }`;
        const releaseData = await client.fetch(releaseQuery, { slug });
        
        return { 
            ...data, 
            items: enrichedItems, 
            releaseTags: releaseData?.tags || [],
            synopsis: releaseData?.synopsis || null,
            // Pass new metadata
            price: releaseData?.price,
            developer: releaseData?.developer,
            publisher: releaseData?.publisher,
            platforms: releaseData?.platforms,
            // Use release image as fallback if game doc image is missing
            mainImage: data.mainImage || releaseData?.releaseImage 
        };
    },
    ['enriched-game-data'],
    { tags: ['game', 'content'] }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gameSlug = decodeURIComponent(slug);

  const data = await getEnrichedGameData(gameSlug);

  if (!data) return {}; 
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const title = `محور لعبة: ${data.title}`;
  const description = data.synopsis || `استكشف كل المحتوى المتعلق بلعبة ${data.title} على EternalGames.`;
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

    const data = await getEnrichedGameData(gameSlug);

    if (!data) {
        notFound();
    }

    const { title: gameTitle, items: allItems, synopsis, releaseTags, mainImage, price, developer, publisher, platforms } = data;

    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={gameTitle}
            hubType="اللعبة"
            synopsis={synopsis}
            tags={releaseTags}
            fallbackImage={mainImage} 
            // Pass new props
            price={price}
            developer={developer}
            publisher={publisher}
            platforms={platforms}
        />
    );
}