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

// OPTIMIZATION: Added 'revalidate: 3600' (1 hour).
// This allows Next.js to serve 'stale' content instantly while updating in the background,
// preventing the user from waiting on the Sanity API response.
// The 'tags' allow us to force-update immediately when you click 'Publish' in Studio.

export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;

    return await client.fetch(query, { slug }, {
        next: { 
            tags: [type, 'content', slug],
            revalidate: 3600 // 1 hour background revalidation
        } 
    });
});

export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug }, {
        next: { 
            tags: ['tag', slug],
            revalidate: 3600
        }
    });
});

export const getCachedGamePageData = cache(async (slug: string) => {
    return await client.fetch(gamePageDataQuery, { slug }, {
        next: { 
            tags: ['game', slug],
            revalidate: 3600
        }
    });
});

export const getCachedColorDictionary = cache(async () => {
    return await client.fetch(colorDictionaryQuery, {}, {
        next: { 
            tags: ['colorDictionary'],
            revalidate: 86400 // 24 hours (rarely changes)
        }
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
        next: { 
            tags: [type, 'content', slug, 'colorDictionary'],
            revalidate: 3600 
        }
    });
});