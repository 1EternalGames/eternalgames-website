// app/actions/layoutActions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { 
    batchGameHubsQuery, 
    batchTagHubsQuery, 
    batchCreatorHubsQuery,
    homepageReviewsQuery,
    homepageArticlesQuery,
    homepageNewsQuery,
    homepageReleasesQuery,
    homepageCreditsQuery,
    homepageMetadataQuery
} from '@/lib/sanity.queries';
import { enrichContentList, enrichCreators } from '@/lib/enrichment';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// --- FRAGMENTED CACHED FETCHERS (To stay under 2MB limit) ---

const getCachedReviews = unstable_cache(
    async () => client.fetch(homepageReviewsQuery),
    ['homepage-reviews-fragment'],
    { revalidate: 3600, tags: ['content', 'review'] }
);

const getCachedArticles = unstable_cache(
    async () => client.fetch(homepageArticlesQuery),
    ['homepage-articles-fragment'],
    { revalidate: 3600, tags: ['content', 'article'] }
);

const getCachedNews = unstable_cache(
    async () => client.fetch(homepageNewsQuery),
    ['homepage-news-fragment'],
    { revalidate: 3600, tags: ['content', 'news'] }
);

const getCachedReleases = unstable_cache(
    async () => client.fetch(homepageReleasesQuery),
    ['homepage-releases-fragment'],
    { revalidate: 3600, tags: ['content', 'gameRelease'] }
);

const getCachedCredits = unstable_cache(
    async () => client.fetch(homepageCreditsQuery),
    ['homepage-credits-fragment'],
    { revalidate: 3600, tags: ['creators'] }
);

const getCachedMetadata = unstable_cache(
    async () => client.fetch(homepageMetadataQuery),
    ['homepage-metadata-fragment'],
    { revalidate: 3600, tags: ['studio-metadata'] }
);

// --- MAIN ORCHESTRATOR ---

export async function getUniversalBaseData() {
    try {
        // 1. MAIN FETCH: Parallel requests to split payload size
        // Each of these calls hits a separate cache entry, bypassing the 2MB limit for the aggregate.
        const [
            reviews,
            articles,
            news,
            releases,
            credits,
            metadata
        ] = await Promise.all([
            getCachedReviews(),
            getCachedArticles(),
            getCachedNews(),
            getCachedReleases(),
            getCachedCredits(),
            getCachedMetadata()
        ]);
        
        // 2. EXTRACTION: Collect IDs for Hubs
        const gameIds = new Set<string>();
        const tagIds = new Set<string>();
        const creatorIds = new Set<string>();

        const collectIds = (items: any[]) => {
            items.forEach(item => {
                if (item.game?._id) gameIds.add(item.game._id);
                if (item.tags) item.tags.forEach((t: any) => t._id && tagIds.add(t._id));
                if (item.category?._id) tagIds.add(item.category._id);
                
                const creators = [...(item.authors || []), ...(item.reporters || []), ...(item.designers || [])];
                creators.forEach((c: any) => {
                    const id = c.prismaUserId || c._id;
                    if(id) creatorIds.add(id); 
                    if(c._id) creatorIds.add(c._id); 
                });
            });
        };

        collectIds(reviews || []);
        collectIds(articles || []);
        collectIds(news || []);
        collectIds(releases || []);
        
        // 3. HUB FETCH: Parallel Batch Request (Cached dynamically based on IDs is tricky, so we fetch live here but query is optimized)
        // Note: We don't unstable_cache this dynamic ID query easily without generating infinite keys.
        // However, Sanity client usage with useCdn: true already handles edge caching for these GET requests.
        const [gameHubs, tagHubs, creatorHubs] = await Promise.all([
            gameIds.size > 0 ? client.fetch(batchGameHubsQuery, { ids: Array.from(gameIds) }, { next: { revalidate: 3600, tags: ['content', 'game'] } }) : [],
            tagIds.size > 0 ? client.fetch(batchTagHubsQuery, { ids: Array.from(tagIds) }, { next: { revalidate: 3600, tags: ['content', 'tag'] } }) : [],
            creatorIds.size > 0 ? client.fetch(batchCreatorHubsQuery, { ids: Array.from(creatorIds) }, { next: { revalidate: 3600, tags: ['content', 'creators'] } }) : []
        ]);

        // 4. ENRICHMENT: Prisma User Data
        // Enrichment logic remains same, but operates on fresh data arrays.
        // Important: enrichContentList uses its own unstable_cache for DB lookups, so it is efficient.
        const allContentLists = [
            ...(gameHubs.map((g: any) => g.linkedContent)),
            ...(tagHubs.map((t: any) => t.items)),
            ...(creatorHubs.map((c: any) => c.linkedContent)),
            reviews, 
            articles, 
            news,
        ];
        
        const flattenedContent = allContentLists.flat().filter(Boolean);
        const enrichedFlattened = await enrichContentList(flattenedContent);
        
        const contentMap = new Map(enrichedFlattened.map((i: any) => [i._id, i]));
        
        const enrichArray = (arr: any[]) => arr.map(i => contentMap.get(i._id) || i);
        
        const enrichedReviews = enrichArray(reviews || []);
        const enrichedArticles = enrichArray(articles || []);
        const enrichedNews = enrichArray(news || []);
        
        const enrichedGameHubs = gameHubs.map((g: any) => ({ ...g, linkedContent: enrichArray(g.linkedContent || []) }));
        const enrichedTagHubs = tagHubs.map((t: any) => ({ ...t, items: enrichArray(t.items || []) }));
        const enrichedCreatorHubs = await Promise.all(creatorHubs.map(async (c: any) => {
            let username = c.username;
            let name = c.name;
            let image = c.image;
            
            if (c.prismaUserId) {
                    const u = await prisma.user.findUnique({ where: { id: c.prismaUserId }, select: { username: true, name: true, image: true }});
                    if (u) { username = u.username; name = u.name; image = u.image; }
            }
            
            return { 
                ...c, 
                username, name, image,
                linkedContent: enrichArray(c.linkedContent || []) 
            };
        }));
        
        const enrichedCredits = await enrichCreators(credits || []);

        if (enrichedReviews.length > 0) {
            const topRatedIndex = enrichedReviews.reduce((topIndex: number, current: any, index: number) => {
                return (current.score ?? 0) > (enrichedReviews[topIndex].score ?? 0) ? index : topIndex;
            }, 0);
            if (topRatedIndex > 0) {
                const [best] = enrichedReviews.splice(topRatedIndex, 1);
                enrichedReviews.unshift(best);
            }
        }

        return {
            reviews: enrichedReviews,
            articles: enrichedArticles,
            news: enrichedNews,
            releases: releases || [],
            credits: enrichedCredits,
            metadata: metadata || {},
            hubs: {
                games: enrichedGameHubs,
                tags: enrichedTagHubs,
                creators: enrichedCreatorHubs
            }
        };
    } catch (error) {
        console.error("Critical: Failed to fetch Universal Base Data", error);
        return { reviews: [], articles: [], news: [], releases: [], credits: [], metadata: {}, hubs: { games: [], tags: [], creators: [] } };
    }
}