// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery } from '@/lib/sanity.queries'; // Use LEAN query
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';

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
    
    // THE DEFINITIVE FIX: The check is now correctly placed *before* the HubPageClient is rendered.
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