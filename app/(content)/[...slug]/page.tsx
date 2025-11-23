// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import type { Metadata } from 'next';
import { getCachedContentAndDictionary } from '@/lib/sanity.fetch'; 
import { client } from '@/lib/sanity.client'; 
// REMOVED: import { enrichContentList } from '@/lib/enrichment'; 
// REMOVED: import prisma ...

// THE FIX: Force this page to be Static. 
// This replicates the "Instant" behavior of 27e26af.
export const dynamic = 'force-static';
export const revalidate = 60; // Update static cache every 60 seconds

const typeMap: Record<string, string> = {
    reviews: 'review',
    articles: 'article',
    news: 'news',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length < 2) return {};
    
    const [section, slug] = slugArray;
    const sanityType = typeMap[section];
    if (!sanityType) return {};
    
    const { item } = await getCachedContentAndDictionary(sanityType, slug);

    if (!item) return {};
    return { 
        title: item.title, 
        description: item.synopsis || `Read the full ${sanityType} on EternalGames.` 
    };
}

export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]] | order(_createdAt desc)[0...100]{ "slug": slug.current, _type }`);
        return allContent.filter(c => c.slug).map(c => {
            const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
            return { slug: [type, c.slug] };
        });
    } catch (error) {
        return [];
    }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug: slugArray } = await params;
    
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [section, slug] = slugArray;
    const sanityType = typeMap[section];
    
    if (!sanityType) notFound();

    // 1. Fetch Only Sanity Content (Static Compatible)
    const { item: rawItem, dictionary } = await getCachedContentAndDictionary(sanityType, slug);
    
    if (!rawItem) notFound();

    // 2. REMOVED DB ENRICHMENT
    // We pass the raw item. The client component (CreatorCredit) will handle 
    // fetching usernames lazily if they are missing.
    
    const colorDictionary = dictionary?.autoColors || [];

    return (
        <ContentPageClient item={rawItem} type={section as any} colorDictionary={colorDictionary}>
             {/* 3. Client-Side Comments
                 We do NOT pass initialComments. This forces CommentSection to fetch
                 on the client, ensuring the initial HTML response is instant. */}
             <CommentSection 
                slug={slug} 
                contentType={section} 
             />
        </ContentPageClient>
    );
}