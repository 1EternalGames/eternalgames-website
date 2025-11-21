// lib/sanity.fetch.ts
import { cache } from 'react';
import { client } from './sanity.client';
import { 
    reviewBySlugQuery, 
    articleBySlugQuery, 
    newsBySlugQuery,
    tagPageDataQuery 
} from './sanity.queries';

// Map content types to their respective queries
const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

/**
 * Fetches the full document for a given slug and type.
 * Uses React cache to deduplicate requests between generateMetadata and the Page component.
 */
export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;
    
    // Sanity fetch with revalidation tag could go here if fine-grained control is needed
    return await client.fetch(query, { slug });
});

/**
 * Fetches Tag metadata and all associated content in a SINGLE pass.
 * Uses React cache to deduplicate requests between generateMetadata and the Page component.
 */
export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug });
});