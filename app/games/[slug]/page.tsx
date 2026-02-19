// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';
import { getCachedGamePageData } from '@/lib/sanity.fetch';
import { enrichContentList } from '@/lib/enrichment';
import { unstable_cache } from 'next/cache';
import { groq } from 'next-sanity';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import VideoGameJsonLd from '@/components/seo/VideoGameJsonLd';
import GameHubClient from '@/components/GameHubClient'; 

export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

const getEnrichedGameData = unstable_cache(
    async (slug: string) => {
        const data = await getCachedGamePageData(slug);
        if (!data) return null;
        
        const enrichedItems = await enrichContentList(data.items || []);
        
        const releaseQuery = groq`*[_type == "gameRelease" && game->slug.current == $slug][0]{ 
            synopsis,
            price,
            releaseDate,
            "developer": developer->title,
            "publisher": publisher->title,
            platforms,
            "onGamePass": coalesce(onGamePass, false),
            "onPSPlus": coalesce(onPSPlus, false),
            tags[]->{title, "slug": slug.current},
            "releaseImage": mainImage
        }`;
        const releaseData = await client.fetch(releaseQuery, { slug });
        
        return { 
            ...data, 
            items: enrichedItems, 
            releaseTags: releaseData?.tags || [],
            synopsis: releaseData?.synopsis || null,
            releaseDate: releaseData?.releaseDate,
            price: releaseData?.price,
            developer: releaseData?.developer,
            publisher: releaseData?.publisher,
            platforms: releaseData?.platforms,
            onGamePass: releaseData?.onGamePass,
            onPSPlus: releaseData?.onPSPlus,
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
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eternalgamesweb.com';
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
        // FIX: Strictly filter out invalid slugs (., empty, or paths)
        return slugs
            .filter(slug => 
                typeof slug === 'string' && 
                slug.trim().length > 0 && 
                slug !== '.' &&
                !slug.includes('/')
            )
            .map((slug) => ({
                slug,
            }));
    } catch (error) {
        console.error("Error generating game params:", error);
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

    const { title: gameTitle, items: allItems, synopsis, releaseTags, mainImage, price, developer, publisher, platforms, onGamePass, onPSPlus, releaseDate } = data;

    const breadcrumbItems = [
        { name: 'الرئيسية', item: '/' },
        { name: 'الألعاب', item: '/releases' },
        { name: gameTitle, item: `/games/${gameSlug}` }
    ];

    const genreNames = releaseTags.map((t: any) => t.title);
    const imageUrl = mainImage ? urlFor(mainImage).width(800).url() : undefined;

    return (
        <>
            <BreadcrumbJsonLd items={breadcrumbItems} />
            <VideoGameJsonLd 
                name={gameTitle}
                description={synopsis || `Game Hub for ${gameTitle}`}
                image={imageUrl}
                releaseDate={releaseDate}
                genre={genreNames}
                platforms={platforms}
                developer={developer}
                publisher={publisher}
            />
            <GameHubClient
                gameTitle={gameTitle}
                items={allItems}
                synopsis={synopsis}
                releaseTags={releaseTags}
                mainImage={mainImage}
                price={price}
                developer={developer}
                publisher={publisher}
                platforms={platforms}
                onGamePass={onGamePass}
                onPSPlus={onPSPlus}
            />
        </>
    );
}