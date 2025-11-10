// app/(content)/[...slug]/page.tsx

import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity.client';
import { articleBySlugQuery, newsBySlugQuery, reviewBySlugQuery, relatedArticlesFallbackQuery, relatedNewsFallbackQuery, relatedReviewsFallbackQuery } from '@/lib/sanity.queries';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import { Suspense, cache } from 'react'; // <-- Import cache

// ... (contentConfig remains the same)

// This cache is perfect. It will cache "forever" until revalidated by your webhook.
const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}) => {
        return client.fetch(query, params);
    },
    ['sanity-content-detail'],
    {
        tags: ['sanity-content']
    }
);

// =============================================================================
// FIX #1: OPTIMIZE DATABASE QUERIES TO A SINGLE BATCHED CALL
// =============================================================================
// This function takes an array of user IDs and fetches them all in one go.
// We use React's `cache` to ensure this function only runs once per request,
// even if called multiple times with the same IDs.
const getCreatorsByIds = cache(async (prismaUserIds: string[]) => {
    if (prismaUserIds.length === 0) {
        return new Map();
    }
    try {
        const users = await prisma.user.findMany({
            where: { id: { in: prismaUserIds } },
            select: { id: true, name: true, image: true, username: true },
        });
        // Return a Map for easy O(1) lookups.
        return new Map(users.map(user => [user.id, user]));
    } catch (error) {
        console.warn(`[CACHE WARNING] Database lookup failed for users.`, error);
        return new Map();
    }
});


export async function generateStaticParams() {
    // This function is correct and essential. No changes needed.
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

// Your async Comments component from my previous suggestion is still the best
// practice for avoiding client-side waterfalls, but we'll focus on the main server issue first.
async function Comments({ slug }: { slug: string }) {
    // ... (This component remains a good idea for perceived performance)
    let initialComments = [];
    try {
        initialComments = await prisma.comment.findMany({ /* ... your query ... */ });
    } catch (error) {
        console.warn(`[DATA WARNING] DB failed for comments on slug "${slug}".`);
    }
    return <CommentSection slug={slug} initialComments={initialComments} />;
}

export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    const { slug: slugArray } = params;
    if (!slugArray || !slugArray.length !== 2) notFound();
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    if (!config) notFound();

    let item: any = await getCachedSanityData(config.query, { slug });
    if (!item) notFound();

    // Data enrichment logic
    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        const fallbackContent = await getCachedSanityData(config.fallbackQuery, { currentId: item._id });
        item[config.relatedProp] = fallbackContent;
    }

    // =============================================================================
    // FIX #2: USE THE BATCHED DATABASE QUERY
    // =============================================================================
    const primaryCreators = (item.authors || item.reporters || []).filter(Boolean);
    const designers = (item.designers || []).filter(Boolean);
    
    // 1. Collect all unique user IDs from the Sanity document.
    const allCreatorIds = [...new Set([
        ...primaryCreators.map(c => c.prismaUserId),
        ...designers.map(c => c.prismaUserId)
    ])].filter(Boolean);

    // 2. Fetch all of them in a single database call.
    const creatorDetailsMap = await getCreatorsByIds(allCreatorIds);

    // 3. Enrich the original Sanity objects with data from the Map.
    const enrich = (creator: any) => ({ ...creator, ...creatorDetailsMap.get(creator.prismaUserId) });
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