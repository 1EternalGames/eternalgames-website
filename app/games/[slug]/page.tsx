// app/games/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery } from '@/lib/sanity.queries'; // Use LEAN query
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';

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

    // MODIFIED: Using lean query for initial content load
    const allItems = await client.fetch(allContentByGameListQuery, { slug: gameSlug });

    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={gameMeta.title}
            hubType="اللعبة"
        />
    );
}


