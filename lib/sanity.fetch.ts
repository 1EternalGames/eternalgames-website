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
    minimalMetadataQuery 
} from './sanity.queries';
import { groq } from 'next-sanity';

const queryMap: Record<string, string> = {
    review: reviewBySlugQuery,
    article: articleBySlugQuery,
    news: newsBySlugQuery,
};

export const getCachedMetadata = cache(async (slug: string) => {
    // Only depends on the specific slug
    return await client.fetch(minimalMetadataQuery, { slug }, {
        next: { tags: [slug] }
    });
});

export const getCachedDocument = cache(async (type: string, slug: string) => {
    const query = queryMap[type];
    if (!query) return null;

    // --- THE FIX ---
    // Removed 'content' tag. 
    // Removed 'type' tag (so publishing a NEW review doesn't kill OLD review pages).
    // Now depends ONLY on the specific slug. 
    // This page will NEVER rebuild unless THIS SPECIFIC DOCUMENT changes.
    return await client.fetch(query, { slug }, {
        next: { 
            tags: [slug] 
        } 
    });
});

export const getCachedTagPageData = cache(async (slug: string) => {
    return await client.fetch(tagPageDataQuery, { slug }, {
        next: { 
            // Depends on the tag itself, but also needs 'content' 
            // because if a NEW review is added with this tag, this page needs to update.
            tags: ['tag', slug, 'content'], 
        }
    });
});

export const getCachedGamePageData = cache(async (slug: string) => {
    return await client.fetch(gamePageDataQuery, { slug }, {
        next: { 
            // Depends on the game itself, and 'content' for new items linked to it.
            tags: ['game', slug, 'content'], 
        }
    });
});

export const getCachedColorDictionary = cache(async () => {
    return await client.fetch(colorDictionaryQuery, {}, {
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

    // --- THE FIX ---
    // Removed generic 'content' tag.
    // Preserved 'colorDictionary' so global color updates propagate.
    return await client.fetch(combinedQuery, { slug }, {
        next: { tags: [slug, 'colorDictionary'] }
    });
});