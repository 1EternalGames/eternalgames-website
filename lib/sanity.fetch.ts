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
        next: { 
            tags: [type, 'content', slug],
            // Use a shorter revalidation time to ensure freshness without breaking static
            revalidate: 60 
        } 
    });
});

export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug }, {
        next: { tags: ['tag', slug], revalidate: 60 }
    });
});

export const getCachedGamePageData = cache(async (slug: string) => {
    return await client.fetch(gamePageDataQuery, { slug }, {
        next: { tags: ['game', slug], revalidate: 60 }
    });
});

export const getCachedColorDictionary = cache(async () => {
    return await client.fetch(colorDictionaryQuery, {}, {
        next: { tags: ['colorDictionary'], revalidate: 86400 }
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
        next: { tags: [type, 'content', slug, 'colorDictionary'], revalidate: 60 }
    });
});