// app/actions/batchActions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { enrichContentList } from '@/lib/enrichment';
import { extractHeadingsFromContent } from '@/lib/text-utils';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { 
    fullDocProjection, 
    paginatedReviewsQuery, 
    paginatedArticlesQuery, 
    paginatedNewsQuery,
    cardListProjection,
    batchGameHubsQuery 
} from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';

// ... (Other batch actions remain unchanged) ...

export async function batchFetchFullContentAction(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  try {
    const query = groq`*[_id in $ids] { ${fullDocProjection} }`;
    const rawData = await client.fetch(query, { ids });
    const enrichedData = await enrichContentList(rawData);
    const dataWithToc = enrichedData.map((item: any) => {
        const tocHeadings = extractHeadingsFromContent(item.content);
        if (item._type === 'review' && item.verdict) {
            tocHeadings.push({ id: 'verdict-summary', text: 'الخلاصة', level: 2 });
        }
        return { ...item, toc: tocHeadings };
    });
    return dataWithToc;
  } catch (error) {
    console.error("Batch fetch failed", error);
    return [];
  }
}

export async function batchFetchTagsAction(slugs: string[]) {
    if (!slugs || slugs.length === 0) return [];
    try {
        const query = groq`*[_type == "tag" && slug.current in $slugs] {
            _id, title, "slug": slug.current,
            "items": *[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...12] { ${cardListProjection} }
        }`;
        const rawTags = await client.fetch(query, { slugs });
        const enrichedTags = await Promise.all(rawTags.map(async (tag: any) => {
            const items = await enrichContentList(tag.items || []);
            return { ...tag, items };
        }));
        return enrichedTags;
    } catch (error) {
        console.error("Batch tag fetch failed", error);
        return [];
    }
}

export async function batchFetchCreatorsAction(creatorIds: string[]) {
    if (!creatorIds || creatorIds.length === 0) return [];
    try {
        const query = groq`*[_type in ["reviewer", "author", "reporter", "designer"] && (_id in $ids || prismaUserId in $ids)] {
            _id, name, prismaUserId, username, image, bio,
            "linkedContent": *[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && references(^._id)] | order(publishedAt desc)[0...12] { ${cardListProjection} }
        }`;
        const rawCreators = await client.fetch(query, { ids: creatorIds });
        const enrichedCreators = await Promise.all(rawCreators.map(async (c: any) => {
            const items = await enrichContentList(c.linkedContent || []);
            return { ...c, linkedContent: items };
        }));
        return enrichedCreators;
    } catch (error) {
        console.error("Batch creator fetch failed", error);
        return [];
    }
}

export const fetchCreatorByUsernameAction = unstable_cache(
    async (username: string) => {
        if (!username) return null;
        
        try {
            const user = await prisma.user.findUnique({
                where: { username },
                select: { id: true, name: true, username: true, image: true, bio: true }
            });
            
            if (!user) return null;

            const creatorDocs = await client.fetch<{ _id: string }[]>(
                `*[_type in ["author", "reviewer", "reporter", "designer"] && prismaUserId == $prismaUserId]{_id}`,
                { prismaUserId: user.id }
            );
            
            const creatorIds = creatorDocs.map(d => d._id);
            
            let enrichedContent: any[] = [];
            
            if (creatorIds.length > 0) {
                const query = groq`*[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && references($creatorIds)] | order(publishedAt desc)[0...12] { ${cardListProjection} }`;
                const rawContent = await client.fetch(query, { creatorIds });
                enrichedContent = await enrichContentList(rawContent);
            }

            return {
                _id: creatorIds[0] || `prisma-${user.id}`,
                prismaUserId: user.id,
                name: user.name,
                username: user.username,
                image: user.image, 
                bio: user.bio,
                linkedContent: enrichedContent,
                contentLoaded: true
            };

        } catch (error) {
            console.error("fetchCreatorByUsernameAction failed", error);
            return null;
        }
    },
    ['creator-profile-by-username-v2'],
    { tags: ['creator-profile'] }
);

export async function fetchGameContentAction(slug: string) {
    if (!slug) return [];
    try {
        const query = groq`*[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && game->slug.current == $slug] | order(publishedAt desc) { ${cardListProjection} }`;
        const raw = await client.fetch(query, { slug });
        const enriched = await enrichContentList(raw);
        return enriched.map((i: any) => adaptToCardProps(i, { width: 600 })).filter(Boolean);
    } catch (e) {
        console.error("fetchGameContentAction error", e);
        return [];
    }
}

export async function fetchCreatorContentAction(creatorId: string) {
    if (!creatorId) return [];
    try {
        const query = groq`*[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && references($creatorIds)] | order(publishedAt desc) { ${cardListProjection} }`;
        const raw = await client.fetch(query, { creatorIds: [creatorId] });
        const enriched = await enrichContentList(raw);
        return enriched.map((i: any) => adaptToCardProps(i, { width: 600 })).filter(Boolean);
    } catch (e) {
        console.error("fetchCreatorContentAction error", e);
        return [];
    }
}

export async function fetchTagContentAction(slug: string) {
    if (!slug) return null;
    try {
        const tags = await batchFetchTagsAction([slug]);
        return tags.length > 0 ? tags[0] : null;
    } catch (e) {
        console.error("fetchTagContentAction error", e);
        return null;
    }
}

export async function fetchSingleContentAction(slug: string) {
    if (!slug) return null;
    try {
        const query = groq`*[_type in ["review", "article", "news"] && slug.current == $slug][0] { ${fullDocProjection} }`;
        const rawData = await client.fetch(query, { slug });
        if (!rawData) return null;
        const enrichedList = await enrichContentList([rawData]);
        const item = enrichedList[0];
        if (item) {
             const tocHeadings = extractHeadingsFromContent(item.content);
             if (item._type === 'review' && item.verdict) {
                tocHeadings.push({ id: 'verdict-summary', text: 'الخلاصة', level: 2 });
             }
             item.toc = tocHeadings;
        }
        return item;
    } catch (error) {
        console.error("Single content fetch failed", error);
        return null;
    }
}

// FIX: Pass fullDocProjection to ensure items loaded via scrolling are clickable instantly
export async function loadMoreReviews(params: { offset: number, limit: number, sort: 'latest' | 'score', scoreRange?: string, gameSlug?: string, tagSlugs?: string[], searchTerm?: string }) {
    const query = paginatedReviewsQuery(
        params.gameSlug, 
        params.tagSlugs, 
        params.searchTerm, 
        params.scoreRange, 
        params.offset, 
        params.limit, 
        params.sort, 
        fullDocProjection // <--- THE FIX
    );
    const rawData = await client.fetch(query);
    return await processUnifiedResponse(rawData, params.limit, params.offset);
}

export async function loadMoreArticles(params: { offset: number, limit: number, sort: 'latest' | 'viral', gameSlug?: string, tagSlugs?: string[], searchTerm?: string }) {
    const query = paginatedArticlesQuery(
        params.gameSlug, 
        params.tagSlugs, 
        params.searchTerm, 
        params.offset, 
        params.limit, 
        params.sort, 
        fullDocProjection // <--- THE FIX
    );
    const rawData = await client.fetch(query);
    return await processUnifiedResponse(rawData, params.limit, params.offset);
}

export async function loadMoreNews(params: { offset: number, limit: number, sort: 'latest' | 'viral', gameSlug?: string, tagSlugs?: string[], searchTerm?: string }) {
    const query = paginatedNewsQuery(
        params.gameSlug, 
        params.tagSlugs, 
        params.searchTerm, 
        params.offset, 
        params.limit, 
        params.sort, 
        fullDocProjection // <--- THE FIX
    );
    const rawData = await client.fetch(query);
    return await processUnifiedResponse(rawData, params.limit, params.offset);
}

async function processUnifiedResponse(rawData: any[], limit: number, offset: number) {
    const enrichedData = await enrichContentList(rawData);
    
    const gameIds = new Set<string>();
    rawData.forEach(item => {
        if (item.game && item.game._id) {
            gameIds.add(item.game._id);
        }
    });

    let enrichedHubs: any[] = [];
    
    if (gameIds.size > 0) {
        try {
            const gameHubs = await client.fetch(batchGameHubsQuery, { ids: Array.from(gameIds) });
            enrichedHubs = await Promise.all(gameHubs.map(async (hub: any) => {
                if (hub.linkedContent && hub.linkedContent.length > 0) {
                    hub.linkedContent = await enrichContentList(hub.linkedContent);
                }
                return { ...hub, contentLoaded: true };
            }));
        } catch (error) {
            console.error("Failed to pre-fetch game hubs in loadMore:", error);
        }
    }

    const fullContent = enrichedData.map((item: any) => {
        const tocHeadings = extractHeadingsFromContent(item.content);
        if (item._type === 'review' && item.verdict) {
            tocHeadings.push({ id: 'verdict-summary', text: 'الخلاصة', level: 2 });
        }
        return { 
            ...item, 
            toc: tocHeadings,
            contentLoaded: true // Explicitly mark as loaded since we used fullDocProjection
        };
    });
    
    const cards = fullContent.map((item: any) => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[];
    const nextOffset = rawData.length === limit ? offset + limit : null;
    
    return { 
        cards, 
        fullContent, 
        hubs: enrichedHubs, 
        nextOffset 
    };
}