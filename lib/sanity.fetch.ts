// lib/sanity.fetch.ts
import { cache } from 'react';
import { client } from './sanity.client';
import { 
    reviewBySlugQuery, 
    articleBySlugQuery, 
    newsBySlugQuery,
    tagPageDataQuery,
    gamePageDataQuery,
    colorDictionaryQuery,
    minimalMetadataQuery // <-- IMPORT NEW QUERY
} from './sanity.queries';
import { groq } from 'next-sanity';

// Map content types to their respective queries
const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

// NEW: Lightweight Fetcher for Metadata
export const getCachedMetadata = cache(async (slug: string) => {
    return await client.fetch(minimalMetadataQuery, { slug }, {
        next: { tags: ['content', slug] } // Use consistent tag for invalidation
    });
});

export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;

    return await client.fetch(query, { slug }, {
        next: { 
            tags: [type, 'content', slug],
            // THE FIX: Removed 'revalidate: 60'. 
            // Defaulting to infinite cache. Only updates via Webhook.
        } 
    });
});

export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug }, {
        next: { 
            tags: ['tag', slug], 
            // THE FIX: Removed 'revalidate: 60'.
        }
    });
});

export const getCachedGamePageData = cache(async (slug: string) => {
    return await client.fetch(gamePageDataQuery, { slug }, {
        next: { 
            tags: ['game', slug], 
            // THE FIX: Removed 'revalidate: 60'.
        }
    });
});

export const getCachedColorDictionary = cache(async () => {
    return await client.fetch(colorDictionaryQuery, {}, {
        // Dictionary is rarely updated, infinite cache is perfect here.
        next: { tags: ['colorDictionary'] }
    });
});

export const getCachedContentAndDictionary = cache(async (type: string, slug: string) => {
    const docQuery = queryMap[type];
    if (!docQuery) return { item: null, dictionary: null };

    const combinedQuery = groq`{
        "item": ${docQuery},
        "dictionary": ${colorDictionaryQuery}
    }`;

    return await client.fetch(combinedQuery, { slug }, {
        // THE FIX: Removed 'revalidate: 60'. 
        // Now this data is cached forever until you edit it in the Studio.
        next: { tags: [type, 'content', slug, 'colorDictionary'] }
    });
});


