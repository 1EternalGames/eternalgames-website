// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity.client';
// REMOVED: getCachedContentAndDictionary (The wrapper causing the issue)
import { 
    reviewBySlugQuery, 
    articleBySlugQuery, 
    newsBySlugQuery,
    colorDictionaryQuery
} from '@/lib/sanity.queries';
import { groq } from 'next-sanity';

// Force static generation for "Instant" speed
export const dynamic = 'force-static';
export const revalidate = 60; // Revalidate every 60 seconds (ISR)

const typeMap: Record<string, string> = {
    reviews: 'review',
    articles: 'article',
    news: 'news',
};

const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length < 2) return {};
    
    const [section, slug] = slugArray;
    const sanityType = typeMap[section];
    if (!sanityType) return {};
    
    // Direct fetch for metadata (Fast)
    const query = queryMap[sanityType];
    if (!query) return {};

    const item = await client.fetch(query, { slug });

    if (!item) return {};
    return { 
        title: item.title, 
        description: item.synopsis || `Read the full ${sanityType} on EternalGames.` 
    };
}

export async function generateStaticParams() {
    try {
        // OPTIMIZATION: Fetch ALL content to ensure 100% Cache Hit Ratio (Instant Load)
        // Removed the [0...100] limit.
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

    const docQuery = queryMap[sanityType];
    if (!docQuery) notFound();

    const combinedQuery = groq`{
        "item": ${docQuery},
        "dictionary": ${colorDictionaryQuery}
    }`;

    const { item: rawItem, dictionary } = await client.fetch(combinedQuery, { slug });
    
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