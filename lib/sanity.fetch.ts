// lib/sanity.fetch.ts
import { cache } from 'react';
import { client } from './sanity.client';
import { 
    reviewBySlugQuery, 
    articleBySlugQuery, 
    newsBySlugQuery,
    tagPageDataQuery,
    gamePageDataQuery
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
    const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;
    
    return await client.fetch(colorDictionaryQuery, {}, {
        next: { tags: ['colorDictionary'] }
    });
});