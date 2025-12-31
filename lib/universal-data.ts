// lib/universal-data.ts
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
    homepageMetadataQuery,
    colorDictionaryQuery 
} from '@/lib/sanity.queries';
import { enrichContentList, enrichCreators } from '@/lib/enrichment';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { convertContentToHybridHtml } from './server/html-converter';

// OPTIMIZATION: Infinite Cache (revalidate: false).
const getCachedReviews = unstable_cache(async () => client.fetch(homepageReviewsQuery), ['homepage-reviews-fragment-v2'], { revalidate: false, tags: ['content', 'review'] });
const getCachedArticles = unstable_cache(async () => client.fetch(homepageArticlesQuery), ['homepage-articles-fragment-v2'], { revalidate: false, tags: ['content', 'article'] });
const getCachedNews = unstable_cache(async () => client.fetch(homepageNewsQuery), ['homepage-news-fragment-v2'], { revalidate: false, tags: ['content', 'news'] });
const getCachedReleases = unstable_cache(async () => client.fetch(homepageReleasesQuery), ['homepage-releases-fragment-v2'], { revalidate: false, tags: ['content', 'gameRelease'] });
const getCachedCredits = unstable_cache(async () => client.fetch(homepageCreditsQuery), ['homepage-credits-fragment-v2'], { revalidate: false, tags: ['creators'] });
const getCachedMetadata = unstable_cache(async () => client.fetch(homepageMetadataQuery), ['homepage-metadata-fragment-v2'], { revalidate: false, tags: ['studio-metadata'] });
const getCachedColors = unstable_cache(async () => client.fetch(colorDictionaryQuery), ['color-dictionary-fragment-v2'], { revalidate: false, tags: ['colorDictionary'] });

// Helper to strip heavy base64 strings from non-essential items
const stripHeavyMetadata = (item: any, keepBlur: boolean) => {
    if (!keepBlur) {
        if (item.mainImage) {
            delete item.mainImage.blurDataURL;
            if (item.mainImage.asset && item.mainImage.asset.metadata) {
                 delete item.mainImage.asset.metadata.lqip;
                 delete item.mainImage.asset.lqip; // Handle flat projection
            }
        }
        if (item.mainImageVertical) {
             delete item.mainImageVertical.blurDataURL;
             if (item.mainImageVertical.asset && item.mainImageVertical.asset.metadata) {
                 delete item.mainImageVertical.asset.metadata.lqip;
                 delete item.mainImageVertical.asset.lqip;
            }
        }
    }
    return item;
};

export async function fetchUniversalData() {
    try {
        const [reviews, articles, news, releases, credits, metadata, colorDict] = await Promise.all([
            getCachedReviews(),
            getCachedArticles(),
            getCachedNews(),
            getCachedReleases(),
            getCachedCredits(),
            getCachedMetadata(),
            getCachedColors()
        ]);
        
        const colorMappings = colorDict?.autoColors || [];
        
        const gameIds = new Set<string>();
        const tagIds = new Set<string>();
        const creatorIds = new Set<string>();

        const collectIds = (items: any[]) => {
            // Limit collection to first 5 items to reduce payload
            items.slice(0, 5).forEach(item => {
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
        
        if (releases && releases.length > 0) {
            const now = new Date();
            const currentMonth = now.getUTCMonth();
            const currentYear = now.getUTCFullYear();
            const releasesThisMonth = releases.filter((r: any) => {
                if (!r.releaseDate) return false;
                const d = new Date(r.releaseDate);
                return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
            });
            releasesThisMonth.forEach((r: any) => {
                if (r.game?._id) gameIds.add(r.game._id);
            });
        }
        
        const [gameHubs, tagHubs, creatorHubs] = await Promise.all([
            gameIds.size > 0 ? client.fetch(batchGameHubsQuery, { ids: Array.from(gameIds) }, { next: { revalidate: false, tags: ['content', 'game'] } }) : [],
            tagIds.size > 0 ? client.fetch(batchTagHubsQuery, { ids: Array.from(tagIds) }, { next: { revalidate: false, tags: ['content', 'tag'] } }) : [],
            creatorIds.size > 0 ? client.fetch(batchCreatorHubsQuery, { ids: Array.from(creatorIds) }, { next: { revalidate: false, tags: ['content', 'creators'] } }) : []
        ]);

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
        
        // --- OPTIMIZATION PIPELINE ---
        const optimizeItem = (item: any) => {
            if (item.content && Array.isArray(item.content) && item.content.length > 0) {
                // 1. Hybrid HTML Conversion
                item.content = convertContentToHybridHtml(item.content, colorMappings);
            }
            return item;
        };

        const contentMap = new Map(enrichedFlattened.map((i: any) => [i._id, optimizeItem(i)]));
        const enrichArray = (arr: any[]) => arr.map(i => contentMap.get(i._id) || i);
        
        // Strip BlurHash from non-hero items
        const processList = (list: any[], keepCount: number) => {
            const enriched = enrichArray(list || []);
            return enriched.map((item, index) => stripHeavyMetadata(item, index < keepCount));
        };

        const enrichedReviews = processList(reviews, 5);
        const enrichedArticles = processList(articles, 5);
        const enrichedNews = processList(news, 5);
        
        const enrichedGameHubs = gameHubs.map((g: any) => ({ ...g, linkedContent: processList(g.linkedContent, 0) })); // Hubs don't need blur
        const enrichedTagHubs = tagHubs.map((t: any) => ({ ...t, items: processList(t.items, 0) }));
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
                linkedContent: processList(c.linkedContent || [], 0) 
            };
        }));
        
        const enrichedCredits = await enrichCreators(credits || []);

        // Featured Review Logic
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