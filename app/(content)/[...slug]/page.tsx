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

export const revalidate = 60;

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

// PERFORMANCE FIX: This function fetches details for multiple creators in a single batch query.
const getCachedBatchedCreatorDetails = unstable_cache(
    async (prismaUserIds: string[]) => {
        if (prismaUserIds.length === 0) {
            return new Map<string, { username: string | null; image: string | null; bio: string | null }>();
        }
        try {
            const users = await prisma.user.findMany({
                where: { id: { in: prismaUserIds } },
                select: { id: true, username: true, image: true, bio: true }
            });
            
            const userMap = new Map();
            users.forEach(user => {
                userMap.set(user.id, {
                    username: user.username || null,
                    image: user.image || null,
                    bio: user.bio || null,
                });
            });
            return userMap;
        } catch (error) {
            console.warn(`[CACHE WARNING] Database connection failed during batched creator enrichment. Skipping. Error:`, error);
            return new Map();
        }
    },
    ['batched-enriched-creator-details'],
    { revalidate: 3600 }
);

export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]]{ "slug": slug.current, _type }`);
        return allContent.filter(c => c.slug).map(c => {
            const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
            return { slug: [type, c.slug] };
        });
    } catch (error) {
        console.warn(`[BUILD WARNING] Failed to fetch slugs for generateStaticParams. This may be due to a network or API issue. Skipping static generation for content pages. Error:`, error);
        return [];
    }
}

async function Comments({ slug }: { slug: string }) {
    try {
        const comments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } }, replies: { take: 2, include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } } }, orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        return <CommentSection slug={slug} initialComments={comments} />;
    } catch (error) {
        console.warn(`[BUILD WARNING] Database connection failed while pre-rendering comments for slug "${slug}". Skipping.`, (error as any)?.digest || error);
        return <CommentSection slug={slug} initialComments={[]} />;
    }
}

export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    const { slug: slugArray } = await params;
    
    if (!slugArray || slugArray.length !== 2) {
        notFound();
    }
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];

    if (!config) {
        notFound();
    }

    let item: any = await client.fetch(config.query, { slug });
    if (!item) {
        notFound();
    }

    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        const fallbackContent = await client.fetch(config.fallbackQuery, { currentId: item._id });
        item[config.relatedProp] = fallbackContent;
    }

    // --- PERFORMANCE FIX: BATCHED CREATOR ENRICHMENT ---
    // 1. Collect all unique creator IDs from all relevant fields.
    const allCreatorIds = new Set<string>();
    for (const prop of config.creatorProps) {
        if (item[prop]) {
            item[prop].forEach((creator: any) => {
                if (creator && creator.prismaUserId) {
                    allCreatorIds.add(creator.prismaUserId);
                }
            });
        }
    }

    // 2. Fetch all creator details in a single batch query.
    const creatorDetailsMap = await getCachedBatchedCreatorDetails(Array.from(allCreatorIds));

    // 3. Enrich the original creator arrays using the pre-fetched map.
    for (const prop of config.creatorProps) {
        if (item[prop]) {
            item[prop] = item[prop].map((creator: any) => {
                if (creator && creator.prismaUserId && creatorDetailsMap.has(creator.prismaUserId)) {
                    return {
                        ...creator,
                        ...creatorDetailsMap.get(creator.prismaUserId),
                    };
                }
                return creator;
            });
        }
    }
    // --- END OF PERFORMANCE FIX ---

    return (
        <ContentPageClient item={item} type={type as any}>
            <Suspense fallback={<div className="spinner" style={{ margin: '8rem auto' }} />}> 
                <Comments slug={slug} />
            </Suspense>
        </ContentPageClient>
    );
}