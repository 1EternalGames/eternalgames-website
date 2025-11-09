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
import { cache } from 'react'; // Import React's cache

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

const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}) => {
        return client.fetch(query, params);
    },
    ['sanity-content-detail'],
    {
        tags: ['sanity-content']
    }
);

const getCachedCreatorDetails = unstable_cache(
    async (prismaUserId: string) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: prismaUserId },
                select: { username: true, image: true, bio: true }
            });
            return {
                username: user?.username || null,
                image: user?.image || null,
                bio: user?.bio || null,
            };
        } catch (error) {
            console.warn(`[CACHE WARNING] Database connection failed for creator enrichment (ID: ${prismaUserId}). Skipping. Error:`, error);
            return { username: null, image: null, bio: null };
        }
    },
    ['enriched-creator-details'],
    { revalidate: 3600 }
);

async function enrichCreator(creator: any) {
    if (!creator || !creator.prismaUserId) return creator;
    const userDetails = await getCachedCreatorDetails(creator.prismaUserId);
    return { ...creator, ...userDetails };
}

export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]]{ "slug": slug.current, _type }`);
        return allContent.filter(c => c.slug).map(c => {
            const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
            return { slug: [type, c.slug] };
        });
    } catch (error) {
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch slugs for generateStaticParams. The build process cannot continue without a connection to the CMS.`, error);
        throw error;
    }
}

// REMOVED: The server-side getCachedComments function is no longer needed here.

// REMOVED: The async Comments component is no longer needed here.

export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    if (!config) notFound();

    let item: any = await getCachedSanityData(config.query, { slug });
    if (!item) notFound();

    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        const fallbackContent = await getCachedSanityData(config.fallbackQuery, { currentId: item._id });
        item[config.relatedProp] = fallbackContent;
    }

    for (const prop of config.creatorProps) {
        if (item[prop]) {
            item[prop] = await Promise.all(item[prop].map(enrichCreator));
        }
    }

    return (
        <ContentPageClient item={item} type={type as any}>
            {/* MODIFIED: We now pass the client-side CommentSection directly. */}
            {/* The Suspense boundary will show a fallback while it fetches data. */}
            <Suspense fallback={<div className="spinner" style={{ margin: '8rem auto' }} />}>
                <CommentSection slug={slug} />
            </Suspense>
        </ContentPageClient>
    );
}