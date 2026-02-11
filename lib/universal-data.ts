// lib/universal-data.ts
import { client } from '@/lib/sanity.client';
import { 
    batchGameHubsQuery, 
    batchTagHubsQuery, 
    homepageReleasesQuery,
    homepageCreditsQuery,
    homepageMetadataQuery,
    colorDictionaryQuery,
    fullDocProjection, 
    lightCardProjection,
    allCreatorsHubQuery
} from '@/lib/sanity.queries';
import { enrichContentList, enrichCreators } from '@/lib/enrichment';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { convertContentToHybridHtml } from './server/html-converter';
import { groq } from 'next-sanity';

// 1. REVIEWS: Depends on 'review' tag
const getCachedReviews = unstable_cache(async () => {
    const query = groq`{
        "full": *[_type == "review" && defined(publishedAt) && publishedAt < now() && defined(mainImage.asset)] | order(publishedAt desc)[0...10] { ${fullDocProjection} },
        "light": *[_type == "review" && defined(publishedAt) && publishedAt < now() && defined(mainImage.asset)] | order(publishedAt desc)[10...20] { ${lightCardProjection} }
    }`;
    return await client.fetch(query);
}, ['homepage-reviews-v4'], { revalidate: false, tags: ['universal-base', 'review'] });

// 2. ARTICLES: Depends on 'article' tag
const getCachedArticles = unstable_cache(async () => {
    const query = groq`{
        "full": *[_type == "article" && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[0...12] { ${fullDocProjection} },
        "light": *[_type == "article" && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[12...20] { ${lightCardProjection} }
    }`;
    return await client.fetch(query);
}, ['homepage-articles-v4'], { revalidate: false, tags: ['universal-base', 'article'] });

// 3. NEWS: Depends on 'news' tag
const getCachedNews = unstable_cache(async () => {
    const query = groq`{
        "full": *[_type == "news" && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[0...18] { ${fullDocProjection} },
        "light": *[_type == "news" && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[18...30] { ${lightCardProjection} }
    }`;
    return await client.fetch(query);
}, ['homepage-news-v4'], { revalidate: false, tags: ['universal-base', 'news'] });

const getCachedAllCreators = unstable_cache(async () => {
    return await client.fetch(allCreatorsHubQuery);
}, ['all-creators-hubs-v2'], { revalidate: false, tags: ['universal-base', 'creators'] });

const getCachedReleases = unstable_cache(async () => client.fetch(homepageReleasesQuery), ['homepage-releases-v2'], { revalidate: false, tags: ['universal-base', 'gameRelease'] });
const getCachedCredits = unstable_cache(async () => client.fetch(homepageCreditsQuery), ['homepage-credits-v2'], { revalidate: false, tags: ['universal-base', 'creators'] });
const getCachedMetadata = unstable_cache(async () => client.fetch(homepageMetadataQuery), ['homepage-metadata-v2'], { revalidate: false, tags: ['universal-base', 'studio-metadata'] });
const getCachedColors = unstable_cache(async () => client.fetch(colorDictionaryQuery), ['color-dictionary-v2'], { revalidate: false, tags: ['universal-base', 'colorDictionary'] });

// ... (Rest of the file helper functions stripHeavyMetadata, etc. remain unchanged)

export async function fetchUniversalData() {
    try {
        const [reviewsData, articlesData, newsData, releases, credits, metadata, colorDict, allCreatorsHubs] = await Promise.all([
            getCachedReviews(),
            getCachedArticles(),
            getCachedNews(),
            getCachedReleases(),
            getCachedCredits(),
            getCachedMetadata(),
            getCachedColors(),
            getCachedAllCreators()
        ]);
        
        // Destructure compound results
        const reviews = [...(reviewsData.full || []), ...(reviewsData.light || [])];
        const articles = [...(articlesData.full || []), ...(articlesData.light || [])];
        const news = [...(newsData.full || []), ...(newsData.light || [])];

        const colorMappings = colorDict?.autoColors || [];
        
        // ... (Logic for collecting IDs and fetching Game/Tag Hubs remains unchanged)
        // Ensure batch queries inside here use 'next: { tags: [...] }'
        
        // Example of internal batch update:
        const gameIds = new Set<string>();
        const tagIds = new Set<string>();
        
        // (ID collection logic...)
        const collectIds = (items: any[], limit: number) => {
             items.slice(0, limit).forEach(item => {
                if (item.game?._id) gameIds.add(item.game._id);
                if (item.tags) item.tags.forEach((t: any) => t._id && tagIds.add(t._id));
                if (item.category?._id) tagIds.add(item.category._id);
            });
        };
        collectIds(reviews, 10);
        collectIds(articles, 12);
        collectIds(news, 18);
        // ...releases check...
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

        const [gameHubs, tagHubs] = await Promise.all([
            // CACHE UPDATE: Use generic 'game' tag so editing a game title refreshes this
            gameIds.size > 0 ? client.fetch(batchGameHubsQuery, { ids: Array.from(gameIds) }, { next: { tags: ['game', 'universal-base'] } }) : [],
            tagIds.size > 0 ? client.fetch(batchTagHubsQuery, { ids: Array.from(tagIds) }, { next: { tags: ['tag', 'universal-base'] } }) : [],
        ]);

        // ... (Rest of processing, enrichment, and return logic remains identical)
        
        const allContentLists = [
            ...(gameHubs.map((g: any) => g.linkedContent)),
            ...(tagHubs.map((t: any) => t.items)),
            ...(allCreatorsHubs.map((c: any) => c.linkedContent)), 
            reviews, 
            articles, 
            news,
        ];
        
        const flattenedContent = allContentLists.flat().filter(Boolean);
        const enrichedFlattened = await enrichContentList(flattenedContent);

        const optimizeItem = (item: any) => {
            if (item.content && Array.isArray(item.content) && item.content.length > 0) {
                item.content = convertContentToHybridHtml(item.content, colorMappings);
            }
            return item;
        };

        const contentMap = new Map(enrichedFlattened.map((i: any) => [i._id, optimizeItem(i)]));
        const enrichArray = (arr: any[]) => arr.map(i => contentMap.get(i._id) || i);
        
        const processList = (list: any[], keepCount: number) => {
            const enriched = enrichArray(list || []);
            // Helper logic for stripping metadata...
            if (list === reviews) return enriched.map((item, index) => stripHeavyMetadata(item, index < keepCount));
            return enriched.map((item, index) => stripHeavyMetadata(item, index < keepCount));
        };
        
        // ... (Rest of function)

        const enrichedReviews = processList(reviews, 5);
        const enrichedArticles = processList(articles, 5);
        const enrichedNews = processList(news, 5);
        
        const enrichedGameHubs = gameHubs.map((g: any) => ({ ...g, linkedContent: processList(g.linkedContent, 0) })); 
        const enrichedTagHubs = tagHubs.map((t: any) => ({ ...t, items: processList(t.items, 0) }));

        const enrichedCreatorHubs = await Promise.all(allCreatorsHubs.map(async (c: any) => {
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

// Helper to strip heavy base64 strings (re-included for context)
const stripHeavyMetadata = (item: any, keepBlur: boolean) => {
    if (!keepBlur) {
        if (item.mainImage) {
            delete item.mainImage.blurDataURL;
            if (item.mainImage.asset && item.mainImage.asset.metadata) {
                 delete item.mainImage.asset.metadata.lqip;
                 delete item.mainImage.asset.lqip; 
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