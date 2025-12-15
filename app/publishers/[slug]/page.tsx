// app/publishers/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import ReleasePageClient from '@/app/releases/ReleasePageClient';
import type { SanityGameRelease } from '@/types/sanity';

export async function generateStaticParams() {
    const publishers = await client.fetch<string[]>(`
        *[_type == "publisher"].slug.current
    `);
    
    return publishers.map(slug => ({ slug }));
}

export const dynamicParams = true;

export default async function PublisherPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const query = groq`*[_type == "gameRelease" && publisher->slug.current == $slug && (isTBA == true || (defined(releaseDate) && releaseDate >= "2023-01-01"))] | order(releaseDate asc) { 
        _id, legacyId, title, releaseDate, isTBA, platforms, synopsis, price, 
        "developer": developer->{title, "slug": slug.current}, 
        "publisher": publisher->{title, "slug": slug.current},
        "mainImage": mainImage{asset, "url": asset->url, "blurDataURL": asset->metadata.lqip, alt}, 
        "game": game->{ "slug": slug.current }, 
        "slug": game->slug.current, 
        "tags": tags[]->{title, "slug": slug.current} 
    }`;

    const releases: SanityGameRelease[] = await client.fetch(query, { slug });
    
    if (releases.length === 0) {
        notFound();
    }
    
    const publisherName = releases[0].publisher?.title || "Unknown Publisher";

    return (
        <div className="container page-container" style={{ paddingTop: 'calc(var(--nav-height-scrolled) + 2rem)' }}>
            <h1 className="page-title">أعمال الناشر: {publisherName}</h1>
            <ReleasePageClient releases={releases} />
        </div>
    );
}