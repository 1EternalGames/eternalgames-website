// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import type { Metadata } from 'next';
import { getCachedContentAndDictionary } from '@/lib/sanity.fetch'; 
import { client } from '@/lib/sanity.client'; 
import { enrichContentList } from '@/lib/enrichment';
import prisma from '@/lib/prisma'; // Import Prisma

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

    // 1. Parallelize the Sanity fetch and the Prisma DB fetch
    const contentPromise = getCachedContentAndDictionary(sanityType, slug);
    
    const commentsPromise = prisma.comment.findMany({
        where: { contentSlug: slug, parentId: null },
        include: { 
            author: { select: { id: true, name: true, image: true, username: true } }, 
            votes: true, 
            _count: { select: { replies: true } }, 
            replies: { 
                take: 2, 
                include: { 
                    author: { select: { id: true, name: true, image: true, username: true } }, 
                    votes: true, 
                    _count: { select: { replies: true } } 
                }, 
                orderBy: { createdAt: 'asc' } 
            } 
        },
        orderBy: { createdAt: 'desc' },
    });

    const [{ item: rawItem, dictionary }, initialComments] = await Promise.all([
        contentPromise,
        commentsPromise
    ]);
    
    if (!rawItem) notFound();

    // Enrich authors using cached Prisma calls
    const [enrichedItem] = await enrichContentList([rawItem]);

    const colorDictionary = dictionary?.autoColors || [];

    return (
        <ContentPageClient item={enrichedItem} type={section as any} colorDictionary={colorDictionary}>
             <CommentSection 
                slug={slug} 
                contentType={section} 
                initialComments={initialComments} // Pass the server-fetched comments
             />
        </ContentPageClient>
    );
}