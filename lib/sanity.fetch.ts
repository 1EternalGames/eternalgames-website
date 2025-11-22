// lib/sanity.fetch.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache'; // Import Data Cache wrapper
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

// 1. Internal fetcher for documents to be used inside unstable_cache
const fetchDocument = async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;
    return client.fetch(query, { slug });
};

// 2. Internal fetcher for tags
const fetchTagData = async (slug: string) => {
    return client.fetch(tagPageDataQuery, { slug });
};

// 3. Internal fetcher for colors
const fetchColors = async () => {
    const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;
    return client.fetch(colorDictionaryQuery, {});
};

/**
 * Fetches the full document for a given slug and type.
 * Wrapped in React.cache (Request Memoization) AND unstable_cache (Data Cache).
 */
export const getCachedDocument = cache(async (type: string, slug: string) => {
    const cachedFetcher = unstable_cache(
        async () => fetchDocument(type, slug),
        [`content-${type}-${slug}`], // Unique Cache Key
        { 
            tags: [type, 'content', slug], // Revalidation Tags
            revalidate: 60 * 60 * 24 // Fallback revalidation (24 hours)
        }
    );
    return cachedFetcher();
});

/**
 * Fetches Tag metadata and all associated content.
 * Wrapped in React.cache AND unstable_cache.
 */
export const getCachedTagPageData = cache(async (slug: string) => {
    const cachedFetcher = unstable_cache(
        async () => fetchTagData(slug),
        [`tag-page-${slug}`],
        { 
            tags: ['tag', slug],
            revalidate: 60 * 60 // Revalidate tags every hour
        }
    );
    return cachedFetcher();
});

/**
 * Fetches the Color Dictionary singleton.
 * Wrapped in React.cache AND unstable_cache.
 */
export const getCachedColorDictionary = cache(async () => {
    const cachedFetcher = unstable_cache(
        async () => fetchColors(),
        ['color-dictionary-singleton'],
        { 
            tags: ['colorDictionary'],
            revalidate: 60 * 60 * 24 
        }
    );
    return cachedFetcher();
});