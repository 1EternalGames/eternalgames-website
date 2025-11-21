// app/(content)/[...slug]/page.tsx
import { client } from '@/lib/sanity.client';
import {
    reviewBySlugQuery,
    articleBySlugQuery,
    newsBySlugQuery,
} from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import { groq } from 'next-sanity';
import type { Metadata } from 'next';
import { Suspense, cache } from 'react';

// CACHE OPTIMIZATION: Deduplicate requests between generateMetadata and Page
const getCachedItem = cache(async (query: string, params: any) => {
    return await client.fetch(query, params);
});

const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

const contentConfig = {
    reviews: { query: reviewBySlugQuery, sanityType: 'review' },
    articles: { query: articleBySlugQuery, sanityType: 'article' },
    news: { query: newsBySlugQuery, sanityType: 'news' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length < 2) return {};
    
    const [type, slug] = slugArray;
    const sanityType = type === 'reviews' ? 'review' : type === 'articles' ? 'article' : type === 'news' ? 'news' : null;
    if (!sanityType) return {};
    
    // Uses the cached client fetch
    const item = await client.fetch(`*[_type == "${sanityType}" && slug.current == $slug][0]{title, synopsis}`, { slug });

    if (!item) return {};
    return { title: item.title, description: item.synopsis || `Read the full ${type.slice(0, -1)} on EternalGames.` }
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
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]]{ "slug": slug.current, _type }`);
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
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    
    if (!config) notFound();

    const itemPromise = getCachedItem(config.query, { slug });
    const colorsPromise = client.fetch(colorDictionaryQuery);

    const [item, colorDictionaryData] = await Promise.all([
        itemPromise,
        colorsPromise
    ]);
    
    if (!item) notFound();

    const colorDictionary = colorDictionaryData?.autoColors || [];

    return (
        <ContentPageClient item={item} type={type as any} colorDictionary={colorDictionary}>
            <Suspense fallback={<div className="spinner" style={{margin: '4rem auto'}}></div>}>
                <CommentsLoader slug={slug} contentType={type} />
            </Suspense>
        </ContentPageClient>
    );
}