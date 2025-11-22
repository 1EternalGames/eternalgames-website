// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import type { Metadata } from 'next';
import { Suspense } from 'react';
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
    
    // OPTIMIZATION: Use same cache key as page
    const { item } = await getCachedContentAndDictionary(sanityType, slug);

    if (!item) return {};
    return { 
        title: item.title, 
        description: item.synopsis || `Read the full ${sanityType} on EternalGames.` 
    };
}

async function CommentsLoader({ slug, contentType }: { slug: string, contentType: string }) {
    try {
        const comments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { 
                author: { select: { id: true, name: true, image: true, username: true } }, 
                votes: true, 
                _count: { select: { replies: true } }, 
                replies: { take: 2, include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } } }, orderBy: { createdAt: 'asc' } } 
            },
            orderBy: { createdAt: 'desc' },
        });
        return <CommentSection slug={slug} contentType={contentType} initialComments={comments} />;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return <CommentSection slug={slug} contentType={contentType} initialComments={[]} />;
    }
}

export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]] | order(_createdAt desc)[0...50]{ "slug": slug.current, _type }`);
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

    // OPTIMIZATION: Batched cached request
    const { item: rawItem, dictionary } = await getCachedContentAndDictionary(sanityType, slug);
    
    if (!rawItem) notFound();

    const [enrichedItem] = await enrichContentList([rawItem]);

    const colorDictionary = dictionary?.autoColors || [];

    return (
        <ContentPageClient item={enrichedItem} type={section as any} colorDictionary={colorDictionary}>
            <Suspense fallback={<div className="spinner" style={{margin: '4rem auto'}}></div>}>
                <CommentsLoader slug={slug} contentType={section} />
            </Suspense>
        </ContentPageClient>
    );
}