// app/(content)/[...slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import { groq } from 'next-sanity';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCachedDocument } from '@/lib/sanity.fetch';

// Fetch color dictionary (lightweight, singleton)
const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

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
    
    // Uses the request-memoized fetcher. This triggers the fetch.
    // The result is cached for the Page component.
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
        // Optional: Limit this to the most recent 100 items to speed up build
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

    // Parallelize the cached document retrieval (likely instant/cached) and the color dictionary fetch
    const [item, colorDictionaryData] = await Promise.all([
        getCachedDocument(sanityType, slug),
        client.fetch(colorDictionaryQuery)
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