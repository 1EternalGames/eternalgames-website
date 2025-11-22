// lib/enrichment.ts
import prisma from '@/lib/prisma';
import { SanityAuthor } from '@/types/sanity';
import { unstable_cache } from 'next/cache';

// 1. Cache the Database Lookup
export const getCachedEnrichedCreators = unstable_cache(
    async (creatorIds: string[]): Promise<[string, string | null][]> => {
        if (creatorIds.length === 0) return [];
        
        try {
            // Batch fetch all requested users in one query
            const users = await prisma.user.findMany({
                where: { id: { in: creatorIds } },
                select: { id: true, username: true },
            });
            
            return users.map((u: any) => [u.id, u.username || null]);
        } catch (error) {
            console.warn(`[CACHE WARNING] Database connection failed during cached creator enrichment.`, error);
            return [];
        }
    },
    ['enriched-creators-batch'],
    { tags: ['enriched-creators'] }
);

// New Helper: Process a single item's creators using a pre-fetched map
function enrichItemCreators(creators: SanityAuthor[] | undefined, usernameMap: Map<string, string | null>): SanityAuthor[] {
    if (!creators || creators.length === 0) return [];
    return creators.map(creator => ({
        ...creator,
        username: (creator.prismaUserId && usernameMap.get(creator.prismaUserId)) || creator.username || null,
    }));
}

export async function enrichContentList(items: any[]) {
    if (!items || items.length === 0) return [];
    
    // 1. Collect ALL unique Prisma User IDs from ALL items
    const allUserIds = new Set<string>();
    
    items.forEach(item => {
        item.authors?.forEach((c: any) => c.prismaUserId && allUserIds.add(c.prismaUserId));
        item.reporters?.forEach((c: any) => c.prismaUserId && allUserIds.add(c.prismaUserId));
        item.designers?.forEach((c: any) => c.prismaUserId && allUserIds.add(c.prismaUserId));
    });

    // 2. Fetch them all in ONE go (cached)
    const uniqueIdsArray = Array.from(allUserIds);
    const usernameEntries = await getCachedEnrichedCreators(uniqueIdsArray);
    const usernameMap = new Map(usernameEntries);

    // 3. Map back to items synchronously (CPU only, no more DB calls)
    return items.map(item => {
        const newItem = { ...item };
        if (newItem.authors) newItem.authors = enrichItemCreators(newItem.authors, usernameMap);
        if (newItem.reporters) newItem.reporters = enrichItemCreators(newItem.reporters, usernameMap);
        if (newItem.designers) newItem.designers = enrichItemCreators(newItem.designers, usernameMap);
        return newItem;
    });
}

// Keep this for single-item pages (like Review Page) which doesn't have a list
export async function enrichCreators(creators: SanityAuthor[] | undefined): Promise<SanityAuthor[]> {
    if (!creators || creators.length === 0) return [];
    const userIds = creators.map(c => c.prismaUserId).filter(Boolean);
    if (userIds.length === 0) return creators;
    const usernameArray = await getCachedEnrichedCreators(userIds);
    const usernameMap = new Map(usernameArray);
    return enrichItemCreators(creators, usernameMap);
}