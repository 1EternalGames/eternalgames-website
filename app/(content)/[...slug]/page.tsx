// app/(content)/[...slug]/page.tsx
import { unstable_cache } from 'next/cache';
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
    
    // This now uses useCdn: true via the global client, so it's fast.
    const item = await client.fetch(`*[_type == "${sanityType}" && slug.current == $slug][0]{title, synopsis}`, { slug });

    if (!item) return {};
    return { title: item.title, description: item.synopsis || `Read the full ${type.slice(0, -1)} on EternalGames.` }
}

// THE FIX: Make the cache key dynamic based on the query arguments
const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}) => {
        return client.fetch(query, params);
    },
    // The key must be generated dynamically by Next.js based on the arguments passed.
    // Since we can't pass a function here, we simply trust client.fetch + useCdn: true
    // But since we MUST use unstable_cache to dedupe database enrichment later (not here),
    // let's just use the specific slug in the tags.
    ['content-page-data'], 
    { tags: ['content-page'] } 
);
// Note: We are now relying on Sanity's CDN (useCdn: true) for the fetch speed. 
// The unstable_cache wrapper is actually redundant for the raw fetch if useCdn is true, 
// but we keep it if you want Next.js Data Cache control. 
// Ideally, just call client.fetch directly.

async function getComments(slug: string) {
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
        return comments;
    } catch (error) {
        console.error("Failed to fetch comments server-side:", error);
        return [];
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

    // 1. Parallel Fetching: Content, Colors, Comments
    // Note: We call client.fetch directly here. It uses useCdn: true (fast).
    // We rely on Sanity's Edge CDN rather than Next.js Data Cache for the main doc, reducing overhead.
    const itemPromise = client.fetch(config.query, { slug });
    const colorsPromise = client.fetch(colorDictionaryQuery);
    const commentsPromise = getComments(slug);

    const [item, colorDictionaryData, comments] = await Promise.all([
        itemPromise,
        colorsPromise,
        commentsPromise
    ]);
    
    if (!item) notFound();

    // 2. Parallel Enrichment
    // We no longer need to check for fallback content here; GROQ handles it.
    // We just need to enrich creators (DB) and related content creators (DB).
    
    // We create an array of promises for enrichment tasks
    const enrichmentTasks = [];

    // Enrich Main Creators
    for (const prop of config.creatorProps) {
        if (item[prop]) {
            enrichmentTasks.push(
                enrichCreators(item[prop]).then(res => item[prop] = res)
            );
        }
    }

    // Enrich Related Content
    if (item[config.relatedProp]) {
        enrichmentTasks.push(
            enrichContentList(item[config.relatedProp]).then(res => item[config.relatedProp] = res)
        );
    }

    // Wait for all DB enrichments to finish in parallel
    await Promise.all(enrichmentTasks);
    
    const colorDictionary = colorDictionaryData?.autoColors || [];

    return (
        <ContentPageClient item={item} type={type as any} colorDictionary={colorDictionary}>
            <CommentSection slug={slug} contentType={type} initialComments={comments} /> 
        </ContentPageClient>
    );
}