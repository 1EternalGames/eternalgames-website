// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery } from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';

export const dynamicParams = true;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const gameSlug = decodeURIComponent(slug);

  const game = await client.fetch(
    `*[_type == "game" && slug.current == $slug][0]{title, mainImage}`,
    { slug: gameSlug }
  );

  if (!game) return {};
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const title = `محور لعبة: ${game.title}`;
  const description = `استكشف كل المحتوى المتعلق بلعبة ${game.title} على EternalGames، من مراجعات ومقالات إلى آخر الأخبار.`;
  const ogImageUrl = game.mainImage 
    ? urlFor(game.mainImage).width(1200).height(630).fit('crop').format('jpg').url()
    : `${siteUrl}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/games/${gameSlug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: game.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch slugs for game hub pages. Build cannot continue.`, error);
        throw error;
    }
}

export default async function GameHubPage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const gameSlug = decodeURIComponent(slug);

    const gameMeta = await client.fetch(
        `*[_type == "game" && slug.current == $slug][0]{title}`,
        { slug: gameSlug }
    );

    if (!gameMeta) {
        notFound();
    }

    const allItems = await client.fetch(allContentByGameListQuery, { slug: gameSlug });
    
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