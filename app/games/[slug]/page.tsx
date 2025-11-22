// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';
import { getCachedGamePageData } from '@/lib/sanity.fetch';

export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gameSlug = decodeURIComponent(slug);

  // Request Memoization ensures this fetch is shared with the Page component
  const data = await getCachedGamePageData(gameSlug);

  if (!data?.game) return {};
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const title = `محور لعبة: ${data.game.title}`;
  const description = `استكشف كل المحتوى المتعلق بلعبة ${data.game.title} على EternalGames.`;
  const ogImageUrl = data.game.mainImage 
    ? urlFor(data.game.mainImage).width(1200).height(630).fit('crop').format('jpg').url()
    : `${siteUrl}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/games/${gameSlug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: data.game.title }],
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

    // Returns result instantly from Metadata request cache
    const data = await getCachedGamePageData(gameSlug);

    if (!data?.game) {
        notFound();
    }

    const { game: gameMeta, items: allItems } = data;

    // PERFORMANCE FIX: Removed `enrichContentList` to maintain speed.
    
    if (!allItems || allItems.length === 0) {
        return (
             <div className="container page-container">
                <h1 className="page-title">محور لعبة:&quot;{gameMeta.title}&quot;</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.8rem', maxWidth: '600px', margin: '0 auto'}}>
                    لم يُخطَّ حرفٌ بعدُ عن هذه اللعبة. الأرشيفُ يترقب.
                </p>
            </div>
        );
    }

    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={gameMeta.title}
            hubType="اللعبة"
        />
    );
}