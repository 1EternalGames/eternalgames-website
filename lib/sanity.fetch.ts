// lib/sanity.fetch.ts
import { cache } from 'react';
import { client } from './sanity.client';
import { 
    reviewBySlugQuery, 
    articleBySlugQuery, 
    newsBySlugQuery,
    tagPageDataQuery 
} from './sanity.queries';
import { groq } from 'next-sanity';

// Map content types to their respective queries
const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

/**
 * Fetches the full document for a given slug and type.
 * Wrapped in React.cache to deduplicate requests within a single render pass.
 * 
 * We removed unstable_cache to allow the native Sanity Client fetch 
 * to handle caching via Next.js HTTP Data Cache, exactly like the /games/ page.
 */
export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;

    return await client.fetch(query, { slug }, {
        // We pass 'tags' to allow on-demand revalidation via API routes
        next: { tags: [type, 'content', slug] } 
    });
});

/**
 * Fetches Tag metadata and all associated content in a SINGLE pass.
 * Wrapped in React.cache to deduplicate.
 */
export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug }, {
        next: { tags: ['tag', slug] }
    });
});

/**
 * Fetches the Color Dictionary singleton.
 * Wrapped in React.cache to deduplicate.
 */
export const getCachedColorDictionary = cache(async () => {
    const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;
    
    return await client.fetch(colorDictionaryQuery, {}, {
        next: { tags: ['colorDictionary'] }
    });
});