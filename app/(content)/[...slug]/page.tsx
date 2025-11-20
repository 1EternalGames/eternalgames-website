// app/(content)/[...slug]/page.tsx
import { unstable_cache } from 'next/cache';
import { client } from '@/lib/sanity.client';
import {
    reviewBySlugQuery, latestReviewsFallbackQuery,
    articleBySlugQuery, latestArticlesFallbackQuery,
    newsBySlugQuery, latestNewsFallbackQuery
} from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import { Suspense } from 'react';
import { groq } from 'next-sanity';
import type { Metadata } from 'next';
import { enrichCreators, enrichContentList } from '@/lib/enrichment';

const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

const contentConfig = {
    reviews: {
        query: reviewBySlugQuery,
        fallbackQuery: latestReviewsFallbackQuery,
        relatedProp: 'relatedReviews',
        creatorProps: ['authors', 'designers'],
        sanityType: 'review',
    },
    articles: {
        query: articleBySlugQuery,
        fallbackQuery: latestArticlesFallbackQuery,
        relatedProp: 'relatedArticles',
        creatorProps: ['authors', 'designers'],
        sanityType: 'article',
    },
    news: {
        query: newsBySlugQuery,
        fallbackQuery: latestNewsFallbackQuery,
        relatedProp: 'relatedNews',
        creatorProps: ['reporters', 'designers'],
        sanityType: 'news',
    },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug: slugArray } = await params;
    
    // THE FIX: Validate slug array length and content to prevent 400 Errors on static assets
    if (!slugArray || slugArray.length < 2) {
        return {};
    }

    const [type, slug] = slugArray;

    // Validate type to prevent default "news" fallthrough for garbage URLs
    const sanityType = type === 'reviews' ? 'review' : type === 'articles' ? 'article' : type === 'news' ? 'news' : null;
    
    if (!sanityType) return {};
    
    const item = await client.fetch(`*[_type == "${sanityType}" && slug.current == $slug][0]{title, mainImage, synopsis}`, { slug });

    if (!item) return {};

    return {
        title: item.title,
        description: item.synopsis || `Read the full ${type.slice(0, -1)} on EternalGames.`,
    }
}

const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}, tags: string[]) => {
        return client.fetch(query, params);
    },
    ['sanity-content-detail'],
);

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
    
    // Strict validation for the page component as well
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    
    if (!config) notFound();
    
    const tags = [config.sanityType];

    let [item, colorDictionaryData, comments] = await Promise.all([
        getCachedSanityData(config.query, { slug }, tags),
        getCachedSanityData(colorDictionaryQuery, {}, ['colorDictionary']),
        getComments(slug)
    ]);
    
    if (!item) notFound();

    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        const fallbackContent = await getCachedSanityData(config.fallbackQuery, { currentId: item._id }, tags);
        item[config.relatedProp] = fallbackContent;
    }

    for (const prop of config.creatorProps) {
        if (item[prop]) {
            item[prop] = await enrichCreators(item[prop]);
        }
    }

    if (item[config.relatedProp]) {
        item[config.relatedProp] = await enrichContentList(item[config.relatedProp]);
    }
    
    const colorDictionary = colorDictionaryData?.autoColors || [];

    return (
        <ContentPageClient item={item} type={type as any} colorDictionary={colorDictionary}>
            <CommentSection slug={slug} contentType={type} initialComments={comments} /> 
        </ContentPageClient>
    );
}