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
import { enrichCreators, enrichContentList } from '@/lib/enrichment';
import { Suspense } from 'react';

const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

const contentConfig = {
    reviews: {
        query: reviewBySlugQuery,
        relatedProp: 'relatedReviews',
        creatorProps: ['authors', 'designers'],
        sanityType: 'review',
    },
    articles: {
        query: articleBySlugQuery,
        relatedProp: 'relatedArticles',
        creatorProps: ['authors', 'designers'],
        sanityType: 'article',
    },
    news: {
        query: newsBySlugQuery,
        relatedProp: 'relatedNews',
        creatorProps: ['reporters', 'designers'],
        sanityType: 'news',
    },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug: slugArray } = await params;
    
    if (!slugArray || slugArray.length < 2) return {};

    const [type, slug] = slugArray;
    const sanityType = type === 'reviews' ? 'review' : type === 'articles' ? 'article' : type === 'news' ? 'news' : null;
    
    if (!sanityType) return {};
    
    const item = await client.fetch(`*[_type == "${sanityType}" && slug.current == $slug][0]{title, synopsis}`, { slug });

    if (!item) return {};

    return {
        title: item.title,
        description: item.synopsis || `Read the full ${type.slice(0, -1)} on EternalGames.`,
    }
}

// --- ASYNC COMPONENT FOR COMMENTS (Streaming) ---
// This isolates the slow DB call so the rest of the page loads first.
async function CommentsLoader({ slug, contentType }: { slug: string, contentType: string }) {
    try {
        const comments = await prisma.comment.findMany({
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
        return <CommentSection slug={slug} contentType={contentType} initialComments={comments} />;
    } catch (error) {
        console.error("Failed to fetch comments server-side:", error);
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
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch slugs for generateStaticParams.`, error);
        throw error;
    }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug: slugArray } = await params;
    
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    
    if (!config) notFound();

    // 1. Fetch Content from Sanity (Fast CDN)
    // We do NOT fetch comments here anymore to prevent waterfall blocking.
    const itemPromise = client.fetch(config.query, { slug });
    const colorsPromise = client.fetch(colorDictionaryQuery);

    const [item, colorDictionaryData] = await Promise.all([
        itemPromise,
        colorsPromise
    ]);
    
    if (!item) notFound();

    // 2. Enrich Creators (Usernames)
    // We keep this here as it's usually fast for a few IDs, 
    // but if this is still slow, we can move it to client side later.
    // For now, removing the massive Comment DB call is the priority fix.
    const enrichmentTasks = [];

    for (const prop of config.creatorProps) {
        if (item[prop]) {
            enrichmentTasks.push(
                enrichCreators(item[prop]).then(res => item[prop] = res)
            );
        }
    }

    if (item[config.relatedProp]) {
        enrichmentTasks.push(
            enrichContentList(item[config.relatedProp]).then(res => item[config.relatedProp] = res)
        );
    }

    await Promise.all(enrichmentTasks);
    
    const colorDictionary = colorDictionaryData?.autoColors || [];

    return (
        <ContentPageClient item={item} type={type as any} colorDictionary={colorDictionary}>
            {/* 
               We wrap the DB-heavy component in Suspense.
               This allows the page to be interactive immediately while comments load.
            */}
            <Suspense fallback={
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <div className="spinner" />
                </div>
            }>
                <CommentsLoader slug={slug} contentType={type} />
            </Suspense>
        </ContentPageClient>
    );
}