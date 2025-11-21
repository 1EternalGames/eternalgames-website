// lib/enrichment.ts
import prisma from '@/lib/prisma';
import { SanityAuthor } from '@/types/sanity';
import { unstable_cache } from 'next/cache';

// 1. Cache the Database Lookup
// This ensures we don't open a slow DB connection every time a user views a page.
export const getCachedEnrichedCreators = unstable_cache(
    async (creatorIds: string[]): Promise<[string, string | null][]> => {
        if (creatorIds.length === 0) return [];
        
        try {
            const users = await prisma.user.findMany({
                where: { id: { in: creatorIds } },
                select: { id: true, username: true },
            });
            
            return users.map((u: any) => [u.id, u.username || null]);
        } catch (error) {
            console.warn(`[CACHE WARNING] Database connection failed during cached creator enrichment. Skipping. Error:`, error);
            return [];
        }
    },
    ['enriched-creators'], // Cache Key
    { 
        tags: ['enriched-creators'], // Revalidation Tag
        revalidate: 60 * 60 * 24 // Cache for 24 hours (usernames rarely change)
    }
);

export async function enrichCreators(creators: SanityAuthor[] | undefined): Promise<SanityAuthor[]> {
    if (!creators || creators.length === 0) return [];
    
    const userIds = creators.map(c => c.prismaUserId).filter(Boolean);
    if (userIds.length === 0) return creators;

    // Use the cached function instead of direct prisma call
    const usernameArray = await getCachedEnrichedCreators(userIds);
    const usernameMap = new Map(usernameArray);

    return creators.map(creator => ({
        ...creator,
        username: usernameMap.get(creator.prismaUserId) || creator.username || null,
    }));
}

export async function enrichContentList(items: any[]) {
    if (!items || items.length === 0) return [];
    
    // Process enrichment in parallel
    return Promise.all(items.map(async (item) => {
        const newItem = { ...item };
        
        // Enrich Authors/Reporters using the cached function
        if (newItem.authors) newItem.authors = await enrichCreators(newItem.authors);
        if (newItem.reporters) newItem.reporters = await enrichCreators(newItem.reporters);
        if (newItem.designers) newItem.designers = await enrichCreators(newItem.designers);
        
        return newItem;
    }));
}