// lib/enrichment.ts
import prisma from '@/lib/prisma';
import { SanityAuthor } from '@/types/sanity';

// REMOVED: unstable_cache entirely.
// Direct DB lookup for IDs is highly optimized and prevents cache explosion
// caused by storing every permutation of creator IDs.
export async function getCachedEnrichedCreators(creatorIds: string[]): Promise<[string, string | null][]> {
    if (!creatorIds || creatorIds.length === 0) return [];
    
    try {
        const users = await prisma.user.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, username: true },
        });
        
        return users.map((u: any) => [u.id, u.username || null]);
    } catch (error) {
        console.warn(`[Enrichment] Database connection failed during creator lookup.`, error);
        return [];
    }
}

function enrichItemCreators(creators: SanityAuthor[] | undefined, usernameMap: Map<string, string | null>): SanityAuthor[] {
    if (!creators || creators.length === 0) return [];
    return creators.map(creator => ({
        ...creator,
        username: (creator.prismaUserId && usernameMap.get(creator.prismaUserId)) || creator.username || null,
    }));
}

// Helper to collect IDs from a single item
function collectUserIdsFromItem(item: any, idSet: Set<string>) {
    item.authors?.forEach((c: any) => c.prismaUserId && idSet.add(c.prismaUserId));
    item.reporters?.forEach((c: any) => c.prismaUserId && idSet.add(c.prismaUserId));
    item.designers?.forEach((c: any) => c.prismaUserId && idSet.add(c.prismaUserId));
}

// Helper to apply enrichment to a single item
function applyEnrichmentToItem(item: any, usernameMap: Map<string, string | null>) {
    const newItem = { ...item };
    if (newItem.authors) newItem.authors = enrichItemCreators(newItem.authors, usernameMap);
    if (newItem.reporters) newItem.reporters = enrichItemCreators(newItem.reporters, usernameMap);
    if (newItem.designers) newItem.designers = enrichItemCreators(newItem.designers, usernameMap);
    return newItem;
}

export async function enrichContentList(items: any[]) {
    if (!items || items.length === 0) return [];
    
    const allUserIds = new Set<string>();
    
    // 1. Collect IDs from main items AND nested related content
    items.forEach(item => {
        collectUserIdsFromItem(item, allUserIds);

        // Recursively check related arrays
        if (item.relatedReviews) item.relatedReviews.forEach((r: any) => collectUserIdsFromItem(r, allUserIds));
        if (item.relatedArticles) item.relatedArticles.forEach((a: any) => collectUserIdsFromItem(a, allUserIds));
        if (item.relatedNews) item.relatedNews.forEach((n: any) => collectUserIdsFromItem(n, allUserIds));
    });

    if (allUserIds.size === 0) {
        return items;
    }

    const uniqueIdsArray = Array.from(allUserIds).sort();
    
    // Direct DB call now
    const usernameEntries = await getCachedEnrichedCreators(uniqueIdsArray);
    const usernameMap = new Map(usernameEntries);

    // 2. Map usernames back to items AND nested related content
    return items.map(item => {
        let enrichedItem = applyEnrichmentToItem(item, usernameMap);

        if (enrichedItem.relatedReviews) {
            enrichedItem.relatedReviews = enrichedItem.relatedReviews.map((r: any) => applyEnrichmentToItem(r, usernameMap));
        }
        if (enrichedItem.relatedArticles) {
            enrichedItem.relatedArticles = enrichedItem.relatedArticles.map((a: any) => applyEnrichmentToItem(a, usernameMap));
        }
        if (enrichedItem.relatedNews) {
            enrichedItem.relatedNews = enrichedItem.relatedNews.map((n: any) => applyEnrichmentToItem(n, usernameMap));
        }

        return enrichedItem;
    });
}

export async function enrichCreators(creators: SanityAuthor[] | undefined): Promise<SanityAuthor[]> {
    if (!creators || creators.length === 0) return [];
    
    const userIds = creators.map(c => c.prismaUserId).filter(Boolean).sort();
    
    if (userIds.length === 0) return creators;
    
    const usernameArray = await getCachedEnrichedCreators(userIds);
    const usernameMap = new Map(usernameArray);
    return enrichItemCreators(creators, usernameMap);
}