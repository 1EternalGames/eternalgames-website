// app/(content)/[...slug]/page.tsx

import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity.client';
// FIX: Corrected import names to match your sanity.queries.ts file
import { 
    articleBySlugQuery, 
    newsBySlugQuery, 
    reviewBySlugQuery, 
    latestArticlesFallbackQuery, 
    latestNewsFallbackQuery, 
    latestReviewsFallbackQuery 
} from '@/lib/sanity.queries';
import { unstable_cache, unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import { Suspense, cache } from 'react';
import { SanityAuthor } from '@/types/sanity';

// FIX: Moved contentConfig to the top-level scope where it belongs.
const contentConfig = {
    reviews: { query: reviewBySlugQuery, relatedProp: 'relatedReviews', fallbackQuery: latestReviewsFallbackQuery },
    articles: { query: articleBySlugQuery, relatedProp: 'relatedArticles', fallbackQuery: latestArticlesFallbackQuery },
    news: { query: newsBySlugQuery, relatedProp: 'relatedNews', fallbackQuery: latestNewsFallbackQuery },
};

// Caching for Sanity data (revalidated by webhook)
const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}) => {
        return client.fetch(query, params);
    },
    ['sanity-content-detail'],
    { tags: ['sanity-content'] }
);

// Batched & cached database query for creator details
const getCreatorsByIds = cache(async (prismaUserIds: string[]) => {
    if (prismaUserIds.length === 0) return new Map();
    try {
        const users = await prisma.user.findMany({
            where: { id: { in: prismaUserIds } },
            select: { id: true, name: true, image: true, username: true },
        });
        return new Map(users.map(user => [user.id, user]));
    } catch (error) {
        console.warn(`[CACHE WARNING] Database lookup failed for users.`, error);
        return new Map();
    }
});

// generateStaticParams is correct and should not be changed.
export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]]{ "slug": slug.current, _type }`);
        return allContent.map(c => {
            const type = c._type === 'review' ? 'reviews' : c._type === 'article' ? 'articles' : 'news';
            return { slug: [type, c.slug] };
        });
    } catch (error) {
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch slugs for generateStaticParams.`, error);
        throw error;
    }
}

// Async Server Component for comments to avoid client-side waterfall
async function Comments({ slug }: { slug: string }) {
    // FIX: Explicitly type initialComments to avoid implicit any
    let initialComments: any[] = [];
    try {
        initialComments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { 
                author: { select: { id: true, name: true, image: true, username: true } }, 
                votes: true, 
                _count: { select: { replies: true } }, 
                replies: { take: 2, include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } } }, orderBy: { createdAt: 'asc' } } 
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        console.warn(`[DATA WARNING] Database failed for comments on slug "${slug}".`);
    }
    return <CommentSection slug={slug} initialComments={initialComments} />;
}


export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    noStore(); // Opts into dynamic rendering for preview mode, but will still be static for builds.
    
    const { slug: slugArray } = params;
    // FIX: Corrected the logical typo in the length check.
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

    // FIX: Added explicit types to prevent implicit 'any' errors during map.
    const primaryCreators: SanityAuthor[] = (item.authors || item.reporters || []).filter(Boolean);
    const designers: SanityAuthor[] = (item.designers || []).filter(Boolean);
    
    const allCreatorIds = [...new Set([
        ...primaryCreators.map((c) => c.prismaUserId),
        ...designers.map((c) => c.prismaUserId)
    ])].filter(Boolean);

    const creatorDetailsMap = await getCreatorsByIds(allCreatorIds);

    const enrich = (creator: SanityAuthor) => ({ ...creator, ...creatorDetailsMap.get(creator.prismaUserId) });
    const enrichedPrimaryCreators = primaryCreators.map(enrich);
    const enrichedDesigners = designers.map(enrich);

    item = { ...item, [type === 'news' ? 'reporters' : 'authors']: enrichedPrimaryCreators, designers: enrichedDesigners };

    return (
        <ContentPageClient item={item} type={type as any}>
            <Suspense fallback={<div className="spinner" style={{ margin: '8rem auto' }} />}>
                <Comments slug={slug} />
            </Suspense>
        </ContentPageClient>
    );
}