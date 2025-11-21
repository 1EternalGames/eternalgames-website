// lib/sanity.queries.ts

import {groq} from 'next-sanity'

// --- Base Fields ---
const mainImageFields = groq`asset, "url": asset->url, "blurDataURL": asset->metadata.lqip, alt`
const creatorFields = groq`_id, name, prismaUserId, image, bio`
const gameFields = groq`_id, title, "slug": slug.current`
const tagFields = groq`_id, title, "slug": slug.current`
const publishedFilter = groq`defined(publishedAt) && publishedAt < now()`

// --- Projections ---
const cardProjection = groq`
_id, _type, legacyId, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}}, score,
"authors": authors[]->{${creatorFields}},
"reporters": reporters[]->{${creatorFields}},
"designers": designers[]->{${creatorFields}}, 
"publishedAt": publishedAt, "game": game->{_id, title, "slug": slug.current}, "tags": tags[]->{${tagFields}}, "category": category->{title, "slug": slug.current}`

const cardListProjection = groq`
_id, _type, legacyId, title, "slug": slug.current, 
"mainImageRef": mainImage.asset, 
score,
"authors": authors[]->{${creatorFields}},
"reporters": reporters[]->{${creatorFields}},
"designers": designers[]->{${creatorFields}},
"publishedAt": publishedAt, "game": game->{_id, title, "slug": slug.current}, "tags": tags[]->{${tagFields}}, "category": category->{title, "slug": slug.current}
`

// --- Lists ---
const apiListProjection = groq`
_id, _type, legacyId, title, "slug": slug.current, 
"mainImageRef": mainImage.asset, 
score,
"authors": authors[]->{${creatorFields}},
"reporters": reporters[]->{${creatorFields}},
"designers": designers[]->{${creatorFields}},
"publishedAt": publishedAt, "game": game->{_id, title, "slug": slug.current}, "tags": tags[]->{${tagFields}}, "category": category->{title, "slug": slug.current}
`

// --- Standard Queries ---
export const newsHeroQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...4] { ${cardProjection}, synopsis }`
export const newsGridInitialQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...50] { ${cardListProjection} }`

// --- Content Queries ---
const contentProjection = groq`content[]{ ..., _type == "image" => { "asset": asset->{ _id, url, "lqip": metadata.lqip, "metadata": metadata } }, _type == "imageCompare" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}} }, _type == "twoImageGrid" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}} }, _type == "fourImageGrid" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}}, "image3": image3{..., asset->{_id, url}}, "image4": image4{..., asset->{_id, url}} }, _type == "table" => {..., rows[]{..., cells[]{..., content[]{...}}}}, _type == "gameDetails" => { ... }, _type == 'youtube' => { ... } }`
const relatedContentProjection = groq`{ _id, _type, legacyId, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}}, score, "authors": authors[]->{name, prismaUserId}, "reporters": reporters[]->{name, prismaUserId}, "publishedAt": publishedAt }`

export const reviewBySlugQuery = groq`*[_type == "review" && slug.current == $slug && ${publishedFilter}][0] {
  ..., "authors": authors[]->{${creatorFields}}, "designers": designers[]->{${creatorFields}},
  "game": game->{${gameFields}}, "mainImage": mainImage{${mainImageFields}}, "tags": tags[]->{${tagFields}},
  "relatedReviews": coalesce(
    relatedReviews[${publishedFilter}]->${relatedContentProjection},
    *[_type == "review" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}
  ),
  ${contentProjection}
}`

export const articleBySlugQuery = groq`*[_type == "article" && slug.current == $slug && ${publishedFilter}][0] {
  ..., "authors": authors[]->{${creatorFields}}, "designers": designers[]->{${creatorFields}},
  "game": game->{${gameFields}}, "mainImage": mainImage{${mainImageFields}}, "tags": tags[]->{_id, title, "slug": slug.current},
  "relatedArticles": coalesce(
    relatedArticles[${publishedFilter}]->${relatedContentProjection},
    *[_type == "article" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}
  ),
  ${contentProjection}
}`

export const newsBySlugQuery = groq`*[_type == "news" && slug.current == $slug && ${publishedFilter}][0] {
  ..., "reporters": reporters[]->{${creatorFields}}, "designers": designers[]->{${creatorFields}},
  "game": game->{${gameFields}}, "mainImage": mainImage{${mainImageFields}}, "category": category->{_id, title, "slug": slug.current},
  "relatedNews": coalesce(
    relatedNews[${publishedFilter}]->${relatedContentProjection},
    *[_type == "news" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}
  ),
  ${contentProjection}
}`

// --- OPTIMIZED SINGLE-PASS TAG QUERY ---
// This query resolves the Tag ID from the slug AND finds all referencing content in one go.
export const tagPageDataQuery = groq`{
  "tag": *[_type == "tag" && slug.current == $slug][0]{_id, title},
  "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && (
    references(*[_type == "tag" && slug.current == $slug][0]._id) || 
    category->slug.current == $slug
  )] | order(publishedAt desc) { ${cardListProjection} }
}`

// ... Existing queries ...
export const paginatedNewsQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'viral' = 'latest') => {
  let filter = `_type == "news" && ${publishedFilter} && defined(mainImage.asset)`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' || '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  const orderBy = sort === 'latest' ? 'publishedAt desc' : '_updatedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${apiListProjection} }`
}
export const paginatedReviewsQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, scoreRange?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'score' = 'latest') => {
  let filter = `_type == "review" && ${publishedFilter}`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' && '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  if (scoreRange) { if (scoreRange === '9-10') filter += ` && score >= 9 && score <= 10`; else if (scoreRange === '8-8.9') filter += ` && score >= 8 && score < 9`; else if (scoreRange === '7-7.9') filter += ` && score >= 7 && score < 8`; else if (scoreRange === '<7') filter += ` && score < 7` }
  const orderBy = sort === 'score' ? 'score desc, publishedAt desc' : 'publishedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${apiListProjection} }`
}
export const paginatedArticlesQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'viral' = 'latest') => {
  let filter = `_type == "article" && ${publishedFilter}`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' && '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  const orderBy = sort === 'latest' ? 'publishedAt desc' : '_updatedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${apiListProjection} }`
}
export const vanguardReviewsQuery = groq`*[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...10] { ${cardProjection} }`
export const featuredHeroReviewQuery = groq`*[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(score desc, publishedAt desc)[0] { ${cardProjection} }`
export const featuredShowcaseArticlesQuery = groq`*[_type == "article" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...7] { ${cardProjection} }`
export const allReviewsListQuery = groq`*[_type == "review" && ${publishedFilter}] | order(publishedAt desc) [0...20] { ${cardListProjection} }`
export const allArticlesListQuery = groq`*[_type == "article" && ${publishedFilter}] | order(publishedAt desc) [0...20] { ${cardListProjection} }`
export const allContentByCreatorListQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && references($creatorIds)] | order(publishedAt desc) { ${cardListProjection} }`
export const allContentByGameListQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && game->slug.current == $slug] | order(publishedAt desc) { ${cardListProjection} }`
export const allContentByTagListQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && ($slug in tags[]->slug.current || category->slug.current == $slug)] | order(publishedAt desc) { ${cardListProjection} }`
export const latestReviewsFallbackQuery = groq`*[_type == "review" && ${publishedFilter} && _id != $currentId] | order(publishedAt desc)[0...3] ${relatedContentProjection}`
export const latestArticlesFallbackQuery = groq`*[_type == "article" && ${publishedFilter} && _id != $currentId] | order(publishedAt desc)[0...3] ${relatedContentProjection}`
export const latestNewsFallbackQuery = groq`*[_type == "news" && ${publishedFilter} && _id != $currentId] | order(publishedAt desc)[0...3] ${relatedContentProjection}`
export const latestNewsQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...15] { _id, legacyId, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}}, "reporters": reporters[]->{name, prismaUserId}, publishedAt, "tags": tags[]->{${tagFields}} }`
export const heroContentQuery = groq`{ "featuredReview": *[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(score desc, publishedAt desc)[0] { ${cardProjection} }, "latestNews": *[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0] { ${cardProjection} }, "featuredArticle": *[_type == "article" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0] { ${cardProjection} } }`
export const featuredReviewsQuery = groq`*[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...10] {${cardProjection}}`
export const featuredArticlesQuery = groq`*[_type == "article" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...10] {${cardProjection}}`
export const searchQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && defined(slug.current) && (title match $searchTerm + "*" || pt::text(content) match $searchTerm)] | order(publishedAt desc) [0...10] { _id, _type, title, "slug": slug.current, "imageUrl": mainImage.asset->url + '?w=200&h=120&fit=crop&auto=format', publishedAt, "authors": authors[]->{name}, "reporters": reporters[]->{name}, "gameTitle": game->title, "tags": tags[]->{title} }`
export const contentByIdsQuery = groq`*[_type in ["review", "article", "news"] && legacyId in $ids && ${publishedFilter}] { ${cardProjection} }`
export const allReleasesQuery = groq`*[_type == "gameRelease" && defined(releaseDate)] | order(releaseDate asc) { _id, legacyId, title, releaseDate, platforms, synopsis, "mainImage": mainImage{${mainImageFields}}, "game": game->{ "slug": slug.current }, "slug": game->slug.current }`
export const allGamesForStudioQuery = groq`*[_type == "game"] | order(title asc){_id, title, "slug": slug.current}`
export const allTagsForStudioQuery = groq`*[_type == "tag"] | order(title asc){_id, title, category}`
export const allCreatorsForStudioQuery = groq`*[_type in ["reviewer", "author", "reporter", "designer"]] | order(name asc){_id, name, _type, prismaUserId}`
export const editorDocumentQuery = groq`*[_id in [$id, 'drafts.' + $id]] | order(_updatedAt desc)[0]{ ..., "authors": authors[]->{_id, name, prismaUserId}, "reporters": reporters[]->{_id, name, prismaUserId}, "designers": designers[]->{_id, name, prismaUserId}, "game": game->{_id, title}, "tags": tags[]->{_id, title}, "category": category->{_id, title}, "mainImage": mainImage.asset->{ "_ref": _id, "url": url, "metadata": metadata }, content[]{ ..., _type == "image" => { "asset": asset->{ _id, url, "lqip": metadata.lqip, "metadata": metadata } }, _type == "imageCompare" => { "image1": image1{..., asset->{_id, url, metadata}}, "image2": image2{..., asset->{_id, url, metadata}} }, _type == "twoImageGrid" => { "image1": image1{..., asset->{_id, url, metadata}}, "image2": image2{..., asset->{_id, url, metadata}} }, _type == "fourImageGrid" => { "image1": image1{..., asset->{_id, url, metadata}}, "image2": image2{..., asset->{_id, url, metadata}}, "image3": image3{..., asset->{_id, url, metadata}}, "image4": image4{..., asset->{_id, url, metadata}} }, _type == "table" => {..., rows[]{..., cells[]{..., content[]{...}}}}, _type == "gameDetails" => { ... }, _type == 'youtube' => { ... } } }`
export const homepageArticlesQuery = groq`*[_type == "article" && ${publishedFilter}] | order(publishedAt desc)[0...12] { ${cardListProjection} }`
export const homepageNewsQuery = groq`*[_type == "news" && ${publishedFilter}] | order(publishedAt desc)[0...18] { ${cardListProjection} }`