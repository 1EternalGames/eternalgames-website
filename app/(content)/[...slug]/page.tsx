// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCachedDocument, getCachedColorDictionary } from '@/lib/sanity.fetch'; 
import { client } from '@/lib/sanity.client'; // For static params

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
    
    // Request Memoization ensures this fetch is shared with the Page component
    const item = await getCachedDocument(sanityType, slug);

    if (!item) return {};
    return { 
        title: item.title, 
        description: item.synopsis || `Read the full ${sanityType} on EternalGames.` 
    };
}

// --- ASYNC COMMENT LOADER ---
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
        // Limit static generation to recent items to keep build times reasonable. 
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

    const [item, colorDictionaryData] = await Promise.all([
        getCachedDocument(sanityType, slug),
        getCachedColorDictionary()
    ]);
    
    if (!item) notFound();

    const colorDictionary = colorDictionaryData?.autoColors || [];

    return (
        <ContentPageClient item={item} type={section as any} colorDictionary={colorDictionary}>
            <Suspense fallback={<div className="spinner" style={{margin: '4rem auto'}}></div>}>
                <CommentsLoader slug={slug} contentType={section} />
            </Suspense>
        </ContentPageClient>
    );
}