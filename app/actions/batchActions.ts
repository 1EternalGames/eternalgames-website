// app/actions/batchActions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { enrichContentList } from '@/lib/enrichment';

// We reuse the exact projections to ensure data consistency
const mainImageFields = groq`asset, "url": asset->url, "blurDataURL": asset->metadata.lqip, alt`;
const creatorFields = groq`_id, name, prismaUserId, image, bio`;
const tagFields = groq`_id, title, "slug": slug.current`;

const relatedContentProjection = groq`{ 
    _id, _type, legacyId, title, "slug": slug.current, 
    "mainImage": mainImage{${mainImageFields}}, 
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
  "relatedReviews": relatedReviews[]->${relatedContentProjection},
  "relatedArticles": relatedArticles[]->${relatedContentProjection},
  "relatedNews": relatedNews[]->${relatedContentProjection}
`;

export async function batchFetchFullContentAction(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  try {
    const query = groq`*[_id in $ids] { ${fullDocProjection} }`;
    const rawData = await client.fetch(query, { ids });
    
    // CRITICAL FIX: Enrich the data so "You Might Like" and Authors appear
    const enrichedData = await enrichContentList(rawData);
    
    return enrichedData;
  } catch (error) {
    console.error("Batch fetch failed", error);
    return [];
  }
}