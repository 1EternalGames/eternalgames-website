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

// Fetch ALL core data for the application in one shot.
// This serves as the "OS Boot" data.
// NO 'unstable_cache' wrapper here - we use individual fetch caching to stay under 2MB/entry.
export async function getUniversalBaseData() {
    try {
        // 1. MAIN FETCH: Parallel requests to split payload size
        const [
            reviews,
            articles,
            news,
            releases,
            credits,
            metadata
        ] = await Promise.all([
            client.fetch(homepageReviewsQuery, {}, { next: { revalidate: 3600, tags: ['content', 'review'] } }),
            client.fetch(homepageArticlesQuery, {}, { next: { revalidate: 3600, tags: ['content', 'article'] } }),
            client.fetch(homepageNewsQuery, {}, { next: { revalidate: 3600, tags: ['content', 'news'] } }),
            client.fetch(homepageReleasesQuery, {}, { next: { revalidate: 3600, tags: ['content', 'gameRelease'] } }),
            client.fetch(homepageCreditsQuery, {}, { next: { revalidate: 3600, tags: ['creators'] } }),
            client.fetch(homepageMetadataQuery, {}, { next: { revalidate: 3600, tags: ['studio-metadata'] } })
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
                    if(id) creatorIds.add(id); // For Prisma enrichment
                    if(c._id) creatorIds.add(c._id); // For Sanity Hub fetching
                });
            });
        };

        collectIds(reviews || []);
        collectIds(articles || []);
        collectIds(news || []);
        
        // 3. HUB FETCH: Parallel Batch Request
        // We cache these fetches as well based on their input IDs
        const [gameHubs, tagHubs, creatorHubs] = await Promise.all([
            gameIds.size > 0 ? client.fetch(batchGameHubsQuery, { ids: Array.from(gameIds) }, { next: { revalidate: 3600, tags: ['content', 'game'] } }) : [],
            tagIds.size > 0 ? client.fetch(batchTagHubsQuery, { ids: Array.from(tagIds) }, { next: { revalidate: 3600, tags: ['content', 'tag'] } }) : [],
            creatorIds.size > 0 ? client.fetch(batchCreatorHubsQuery, { ids: Array.from(creatorIds) }, { next: { revalidate: 3600, tags: ['content', 'creators'] } }) : []
        ]);

        // 4. ENRICHMENT: Prisma User Data
        // We enrich both the main content lists AND the hub content lists
        // CRITICAL: We put the Hubs (slim content) FIRST and Main Lists (full content) LAST.
        // When creating the Map for deduplication, the LAST item with the same ID wins.
        const allContentLists = [
            ...(gameHubs.map((g: any) => g.linkedContent)),
            ...(tagHubs.map((t: any) => t.items)),
            ...(creatorHubs.map((c: any) => c.linkedContent)),
            reviews, 
            articles, 
            news,
        ];
        
        // Optimization: Enrich unique set of items to avoid duplicate DB calls
        const flattenedContent = allContentLists.flat().filter(Boolean);
        const enrichedFlattened = await enrichContentList(flattenedContent);
        
        // Re-distribute enriched items
        // The Map constructor uses the last occurrence of a key.
        // Since reviews/articles/news are at the end of flattenedContent, their Full Docs will win.
        const contentMap = new Map(enrichedFlattened.map((i: any) => [i._id, i]));
        
        const enrichArray = (arr: any[]) => arr.map(i => contentMap.get(i._id) || i);
        
        const enrichedReviews = enrichArray(reviews || []);
        const enrichedArticles = enrichArray(articles || []);
        const enrichedNews = enrichArray(news || []);
        
        // Enrich Hubs
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

        // Sort Reviews by score for the hero logic
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