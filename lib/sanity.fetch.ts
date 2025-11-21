import { cache } from 'react';
import { client } from './sanity.client';
import { reviewBySlugQuery, articleBySlugQuery, newsBySlugQuery } from './sanity.queries';

// Map content types to their respective queries
const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

/**
 * Fetches the full document for a given slug and type.
 * Cached per request to allow sharing between generateMetadata and Page.
 */
export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;
    
    return await client.fetch(query, { slug });
});