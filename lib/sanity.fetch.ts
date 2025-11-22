// lib/sanity.fetch.ts
import { cache } from 'react';
import { client } from './sanity.client';
import { 
    reviewBySlugQuery, 
    articleBySlugQuery, 
    newsBySlugQuery,
    tagPageDataQuery,
    gamePageDataQuery,
    colorDictionaryQuery
} from './sanity.queries';
import { groq } from 'next-sanity';

// Map content types to their respective queries
const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;

    return await client.fetch(query, { slug }, {
        // We pass 'tags' to allow on-demand revalidation via API routes
        next: { tags: [type, 'content', slug] } 
    });
});

export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug }, {
        next: { tags: ['tag', slug] }
    });
});

export const getCachedGamePageData = cache(async (slug: string) => {
    return await client.fetch(gamePageDataQuery, { slug }, {
        next: { tags: ['game', slug] }
    });
});

export const getCachedColorDictionary = cache(async () => {
    return await client.fetch(colorDictionaryQuery, {}, {
        next: { tags: ['colorDictionary'] }
    });
});

// NEW: Batched fetcher for content + dictionary
export const getCachedContentAndDictionary = cache(async (type: string, slug: string) => {
    const docQuery = queryMap[type];
    if (!docQuery) return { item: null, dictionary: null };

    // Combine the specific document query and the global color dictionary query
    const combinedQuery = groq`{
        "item": ${docQuery},
        "dictionary": ${colorDictionaryQuery}
    }`;

    return await client.fetch(combinedQuery, { slug }, {
        // Revalidate if the specific doc changes OR if the dictionary changes
        next: { tags: [type, 'content', slug, 'colorDictionary'] }
    });
});