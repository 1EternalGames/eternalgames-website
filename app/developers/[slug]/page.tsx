// app/developers/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import ReleasePageClient from '@/app/releases/ReleasePageClient';
import type { SanityGameRelease } from '@/types/sanity';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd'; 

export async function generateStaticParams() {
    // FIX: Added 'defined(slug.current)' to query and added JS filter
    const developers = await client.fetch<string[]>(`
        *[_type == "developer" && defined(slug.current)].slug.current
    `);
    
    return developers
        .filter(slug => slug && slug.trim() !== '')
        .map(slug => ({ slug }));
}

export const dynamicParams = true;

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const query = groq`*[_type == "gameRelease" && developer->slug.current == $slug && (isTBA == true || (defined(releaseDate) && releaseDate >= "2023-01-01"))] | order(releaseDate asc) { 
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
    
    const studioName = releases[0].developer?.title || "Unknown Studio";

    const breadcrumbItems = [
        { name: 'الرئيسية', item: '/' },
        { name: 'المطورون', item: '#' }, 
        { name: studioName, item: `/developers/${slug}` }
    ];

    return (
        <>
            <BreadcrumbJsonLd items={breadcrumbItems} />
            <div className="container page-container" style={{ paddingTop: 'calc(var(--nav-height-scrolled) + 2rem)' }}>
                <h1 className="page-title">أعمال الاستوديو: {studioName}</h1>
                <ReleasePageClient releases={releases} hideHeader={true} />
            </div>
        </>
    );
}