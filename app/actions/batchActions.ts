// app/actions/batchActions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { enrichContentList } from '@/lib/enrichment';
import { extractHeadingsFromContent } from '@/lib/text-utils';

// We reuse the exact projections to ensure data consistency
const mainImageFields = groq`asset, "url": asset->url, "blurDataURL": asset->metadata.lqip, alt`;
const creatorFields = groq`_id, name, prismaUserId, image, bio`;
const tagFields = groq`_id, title, "slug": slug.current`;
const publishedFilter = "defined(publishedAt) && publishedAt < now()";

const cardListProjection = groq`
_id, _type, legacyId, title, "slug": slug.current, 
"mainImageRef": mainImage.asset, 
"mainImageVerticalRef": mainImageVertical.asset,
score,
"authors": authors[]->{${creatorFields}},
"reporters": reporters[]->{${creatorFields}},
"designers": designers[]->{${creatorFields}},
"publishedAt": publishedAt, "game": game->{_id, title, "slug": slug.current}, "tags": tags[]->{${tagFields}}, "category": category->{title, "slug": slug.current}, newsType
`;

const relatedContentProjection = groq`{ 
    _id, _type, legacyId, title, "slug": slug.current, 
    "mainImage": mainImage{${mainImageFields}}, 
    "mainImageVertical": mainImageVertical{${mainImageFields}}, 
    score, 
    "authors": authors[]->{${creatorFields}}, 
    "reporters": reporters[]->{${creatorFields}}, 
    publishedAt, 
    newsType 
}`;

const fullDocProjection = groq`
  _id, _type, legacyId, title, "slug": slug.current,
  "mainImage": mainImage{${mainImageFields}},
  "mainImageVertical": mainImageVertical{${mainImageFields}},
  score, verdict, pros, cons,
  "authors": authors[]->{${creatorFields}},
  "reporters": reporters[]->{${creatorFields}},
  "designers": designers[]->{${creatorFields}},
  publishedAt, 
  "game": game->{_id, title, "slug": slug.current}, 
  "tags": tags[]->{${tagFields}}, 
  "category": category->{title, "slug": slug.current}, 
  newsType,
  synopsis,
  
  // SPECIFIC FOR RELEASES / GAMES
  releaseDate, isTBA, platforms, price, 
  "developer": developer->{title, "slug": slug.current}, 
  "publisher": publisher->{title, "slug": slug.current}, 
  "onGamePass": coalesce(onGamePass, false), 
  "onPSPlus": coalesce(onPSPlus, false),
  "isPinned": coalesce(isPinned, false),
  "trailer": trailer,

  // Full Content for the reader
  content[]{ 
    ..., 
    _type == "image" => { "asset": asset->{ _id, url, "lqip": metadata.lqip, "metadata": metadata } }, 
    _type == "imageCompare" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}} }, 
    _type == "twoImageGrid" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}} }, 
    _type == "fourImageGrid" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}}, "image3": image3{..., asset->{_id, url}}, "image4": image4{..., asset->{_id, url}} }, 
    _type == "table" => {..., rows[]{..., cells[]{..., content[]{...}}}}, 
    _type == "gameDetails" => { ... }, 
    _type == 'youtube' => { ... } 
  },
  
  // CONDITIONAL RELATED CONTENT (Fallback Logic)
  _type == "review" => {
    "relatedReviews": coalesce(
      relatedReviews[]->${relatedContentProjection}, 
      *[_type == "review" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}
    )
  },
  _type == "article" => {
    "relatedArticles": coalesce(
      relatedArticles[]->${relatedContentProjection}, 
      *[_type == "article" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}
    )
  },
  _type == "news" => {
    "relatedNews": coalesce(
      relatedNews[]->${relatedContentProjection}, 
      *[_type == "news" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}
    )
  }
`;

// Queries for single fetchers
const allContentByGameListQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && game->slug.current == $slug] | order(publishedAt desc) { ${cardListProjection} }`;
const allContentByCreatorListQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && references($creatorIds)] | order(publishedAt desc) { ${cardListProjection} }`;

export async function batchFetchFullContentAction(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  try {
    const query = groq`*[_id in $ids] { ${fullDocProjection} }`;
    const rawData = await client.fetch(query, { ids });
    
    // ENRICHMENT: Add Prisma user data (avatars, usernames)
    const enrichedData = await enrichContentList(rawData);

    // --- GENERATE TABLE OF CONTENTS ---
    const dataWithToc = enrichedData.map((item: any) => {
        const tocHeadings = extractHeadingsFromContent(item.content);
        
        // For reviews, manually append the "Verdict" section if it exists
        if (item._type === 'review' && item.verdict) {
            tocHeadings.push({ id: 'verdict-summary', text: 'الخلاصة', level: 2 });
        }
        
        return {
            ...item,
            toc: tocHeadings
        };
    });
    
    return dataWithToc;
  } catch (error) {
    console.error("Batch fetch failed", error);
    return [];
  }
}

// NEW: Batch fetch for Tags (Hub Data)
export async function batchFetchTagsAction(slugs: string[]) {
    if (!slugs || slugs.length === 0) return [];

    try {
        const query = groq`*[_type == "tag" && slug.current in $slugs] {
            _id, title, "slug": slug.current,
            "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...12] { ${cardListProjection} }
        }`;
        
        const rawTags = await client.fetch(query, { slugs });
        
        // Enrich items inside each tag
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

// Single Fetch Actions for Store
export async function fetchGameContentAction(slug: string) {
    if (!slug) return [];
    try {
        const raw = await client.fetch(allContentByGameListQuery, { slug });
        return await enrichContentList(raw);
    } catch (e) {
        console.error("fetchGameContentAction error", e);
        return [];
    }
}

export async function fetchCreatorContentAction(creatorId: string) {
    if (!creatorId) return [];
    try {
        const raw = await client.fetch(allContentByCreatorListQuery, { creatorIds: [creatorId] });
        return await enrichContentList(raw);
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

// NEW: Fetch Single Full Content (For Overlay)
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