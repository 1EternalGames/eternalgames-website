// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import type { Metadata } from 'next';
import { getCachedContentAndDictionary } from '@/lib/sanity.fetch'; 
import { client } from '@/lib/sanity.client'; 
import { enrichContentList } from '@/lib/enrichment';

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
        // OPTIMIZATION: Pre-build the first 100 articles for instant cache hits
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

    const { item: rawItem, dictionary } = await getCachedContentAndDictionary(sanityType, slug);
    
    if (!rawItem) notFound();

    // This uses the unstable_cache which is fast, but does not block the main thread like a fresh DB call.
    const [enrichedItem] = await enrichContentList([rawItem]);

    const colorDictionary = dictionary?.autoColors || [];

    return (
        <ContentPageClient item={enrichedItem} type={section as any} colorDictionary={colorDictionary}>
             {/* Pass ONLY the slug. The component will fetch comments client-side. */}
             <CommentSection 
                slug={slug} 
                contentType={section} 
             />
        </ContentPageClient>
    );
}