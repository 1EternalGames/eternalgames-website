// lib/sanity.fetch.ts
import { unstable_cache } from 'next/cache';
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
 * Wrapped in unstable_cache to persist data across requests on Vercel.
 */
export const getCachedDocument = async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;

    const getDocument = unstable_cache(
        async () => {
            return await client.fetch(query, { slug });
        },
        [`content-${type}-${slug}`], // Cache key
        { 
            tags: [type, 'content', slug], // Revalidation tags
            revalidate: 604800 // 1 week (revalidated via webhooks/ISR)
        }
    );

    return getDocument();
};

/**
 * Fetches Tag metadata and all associated content in a SINGLE pass.
 * Wrapped in unstable_cache.
 */
export const getCachedTagPageData = async (slug: string) => {
    const getTagData = unstable_cache(
        async () => {
            return await client.fetch(tagPageDataQuery, { slug });
        },
        [`tag-page-${slug}`], 
        { 
            tags: ['tag', slug],
            revalidate: 3600 // Revalidate every hour just in case
        }
    );

    return getTagData();
};

/**
 * Fetches the Color Dictionary singleton.
 */
export const getCachedColorDictionary = async () => {
    const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;
    
    const getColors = unstable_cache(
        async () => {
            return await client.fetch(colorDictionaryQuery);
        },
        ['color-dictionary'],
        {
            tags: ['colorDictionary'],
            revalidate: false // Never expire automatically, relies on webhook/revalidateTag
        }
    );

    return getColors();
}