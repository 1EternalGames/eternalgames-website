// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import type { Metadata } from 'next';
import { getCachedContentAndDictionary } from '@/lib/sanity.fetch'; 
import { client } from '@/lib/sanity.client'; 
// CRITICAL FIX: Removed unused imports (prisma, enrichment) to prevent Vercel
// from bundling database logic into this route, ensuring it remains Static/ISR.

export const dynamic = 'force-static'; // Force static generation
export const revalidate = 60; // Revalidate every minute if needed

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
        // Simple, lightweight query for build time
        const query = `*[_type in ["review", "article", "news"]] { "slug": slug.current, _type }`;
        const allContent = await client.fetch<any[]>(query);
        
        return allContent
            .filter(c => c.slug)
            .map(c => {
                const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
                return { slug: [type, c.slug] };
            });
    } catch (error) {
        console.error("GenerateStaticParams Error:", error);
        return [];
    }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug: slugArray } = await params;
    
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [section, slug] = slugArray;
    const sanityType = typeMap[section];
    
    if (!sanityType) notFound();

    // Pure Sanity fetch. No Database. No Prisma.
    const { item: rawItem, dictionary } = await getCachedContentAndDictionary(sanityType, slug);
    
    if (!rawItem) notFound();

    const colorDictionary = dictionary?.autoColors || [];

    return (
        <ContentPageClient item={rawItem} type={section as any} colorDictionary={colorDictionary}>
             <CommentSection 
                slug={slug} 
                contentType={section} 
             />
        </ContentPageClient>
    );
}