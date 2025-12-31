// lib/sanity.queries.ts
import {groq} from 'next-sanity'

// EXPORT THIS FIELD
export const mainImageFields = groq`asset, "url": asset->url, "blurDataURL": asset->metadata.lqip, alt`

const creatorFields = groq`_id, name, prismaUserId, image, bio, username`
const gameFields = groq`_id, title, "slug": slug.current`
const tagFields = groq`_id, title, "slug": slug.current`
const publishedFilter = groq`defined(publishedAt) && publishedAt < now()`

// --- 1. LIGHT PROJECTION (For Lists/Cards) ---
export const lightCardProjection = groq`
  _id, 
  _type, 
  legacyId, 
  title, 
  "slug": slug.current,
  "mainImage": mainImage{${mainImageFields}},
  "mainImageVertical": mainImageVertical{${mainImageFields}},
  score, 
  verdict, 
  "authors": authors[]->{${creatorFields}},
  "reporters": reporters[]->{${creatorFields}},
  "designers": designers[]->{${creatorFields}},
  publishedAt, 
  "game": game->{_id, title, "slug": slug.current}, 
  "tags": tags[]->{${tagFields}}, 
  "category": category->{title, "slug": slug.current}, 
  newsType,
  synopsis,
  
  releaseDate, isTBA, platforms, price, 
  "developer": developer->{title, "slug": slug.current}, 
  "publisher": publisher->{title, "slug": slug.current}, 
  "onGamePass": coalesce(onGamePass, false), 
  "onPSPlus": coalesce(onPSPlus, false),
  "isPinned": coalesce(isPinned, false),
  "trailer": trailer,
  datePrecision
`;

// --- 2. FULL PROJECTION (For Single Page Views & Editor & Instant Click) ---
export const fullDocProjection = groq`
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
  
  releaseDate, isTBA, platforms, price, 
  "developer": developer->{title, "slug": slug.current}, 
  "publisher": publisher->{title, "slug": slug.current}, 
  "onGamePass": coalesce(onGamePass, false), 
  "onPSPlus": coalesce(onPSPlus, false),
  "isPinned": coalesce(isPinned, false),
  "trailer": trailer,
  datePrecision,

  // Full Content
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
  
  // Related Content
  _type == "review" => {
    "relatedReviews": select(
      defined(relatedReviews) && count(relatedReviews) > 0 => relatedReviews[]->{${lightCardProjection}},
      *[_type == "review" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] {${lightCardProjection}}
    )
  },
  _type == "article" => {
    "relatedArticles": select(
      defined(relatedArticles) && count(relatedArticles) > 0 => relatedArticles[]->{${lightCardProjection}},
      *[_type == "article" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] {${lightCardProjection}}
    )
  },
  _type == "news" => {
    "relatedNews": select(
      defined(relatedNews) && count(relatedNews) > 0 => relatedNews[]->{${lightCardProjection}},
      *[_type == "news" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] {${lightCardProjection}}
    )
  }
`;

const gameReleaseProjection = groq`
    _id, legacyId, title, releaseDate, isTBA, platforms, synopsis, price, 
    "isPinned": coalesce(isPinned, false),
    "trailer": trailer,
    "datePrecision": datePrecision, 
    "onGamePass": coalesce(onGamePass, false),
    "onPSPlus": coalesce(onPSPlus, false),
    "developer": developer->{title, "slug": slug.current}, 
    "publisher": publisher->{title, "slug": slug.current}, 
    "mainImage": mainImage{${mainImageFields}}, 
    "game": game->{ _id, "slug": slug.current }, 
    "slug": game->slug.current, 
    "tags": tags[]->{${tagFields}}
`

// --- Queries ---

export const newsHeroQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...4] { ${fullDocProjection}, synopsis }`
export const newsGridInitialQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...20] { ${fullDocProjection} }`

export const reviewBySlugQuery = groq`*[_type == "review" && slug.current == $slug && ${publishedFilter}][0] { ${fullDocProjection} }`
export const articleBySlugQuery = groq`*[_type == "article" && slug.current == $slug && ${publishedFilter}][0] { ${fullDocProjection} }`
export const newsBySlugQuery = groq`*[_type == "news" && slug.current == $slug && ${publishedFilter}][0] { ${fullDocProjection} }`

export const minimalMetadataQuery = groq`
  *[_type in ["review", "article", "news"] && slug.current == $slug][0] {
    title,
    synopsis,
    "mainImage": mainImage.asset->{ url }
  }
`

export const tagPageDataQuery = groq`
  *[_type == "tag" && slug.current == $slug][0] {
    _id, title,
    "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...24] { ${lightCardProjection} }
  }
`

export const gamePageDataQuery = groq`
  *[_type == "game" && slug.current == $slug][0] {
    _id, title, "mainImage": mainImage{${mainImageFields}},
    "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && game._ref == ^._id] | order(publishedAt desc)[0...24] { ${lightCardProjection} }
  }
`

export const creatorContentQuery = groq`
  *[_type in ["review", "article", "news"] && ${publishedFilter} && references(*[_type in ["reviewer", "author", "reporter", "designer"] && prismaUserId == $prismaUserId]._id)] | order(publishedAt desc) { ${lightCardProjection} }
`

export const batchGameHubsQuery = groq`
  *[_type == "game" && _id in $ids] {
    _id, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}},
    "linkedContent": *[_type in ["review", "article", "news"] && ${publishedFilter} && game._ref == ^._id] | order(publishedAt desc)[0...24] { ${lightCardProjection} }
  }
`

export const batchTagHubsQuery = groq`
  *[_type == "tag" && _id in $ids] {
    _id, title, "slug": slug.current,
    "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...24] { ${lightCardProjection} }
  }
`

export const batchCreatorHubsQuery = groq`
  *[_type in ["reviewer", "author", "reporter", "designer"] && _id in $ids] {
     _id, name, prismaUserId, image, bio, username,
     "linkedContent": *[_type in ["review", "article", "news"] && ${publishedFilter} && references(^._id)] | order(publishedAt desc)[0...24] { ${lightCardProjection} }
  }
`

export const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`

const editorDocProjection = fullDocProjection; 
export const editorDocumentQuery = groq`*[_id in [$id, 'drafts.' + $id]] | order(_updatedAt desc)[0]{ ${editorDocProjection} }`

export const studioMetadataQuery = groq`{
  "games": *[_type == "game"] | order(title asc){_id, title},
  "tags": *[_type == "tag"] | order(title asc){_id, title, category},
  "creators": *[_type in ["reviewer", "author", "reporter", "designer"]] | order(name asc){_id, name, _type, prismaUserId},
  "developers": *[_type == "developer"] | order(title asc){_id, title},
  "publishers": *[_type == "publisher"] | order(title asc){_id, title}
}`

export const editorDataQuery = groq`{
  "document": ${editorDocumentQuery},
  "dictionary": ${colorDictionaryQuery},
  "metadata": ${studioMetadataQuery}
}`

export const aboutPageQuery = groq`*[_id == "aboutPageSettings"][0] {
  ceo->{_id, name, image, bio, prismaUserId},
  headOfCommunication->{_id, name, image, bio, prismaUserId},
  headOfReviews->{_id, name, image, bio, prismaUserId},
  editorInChief->{_id, name, image, bio, prismaUserId},
  headOfVisuals->{_id, name, image, bio, prismaUserId},
  reportersSection[]->{_id, name, image, bio, prismaUserId},
  authorsSection[]->{_id, name, image, bio, prismaUserId},
  designersSection[]->{_id, name, image, bio, prismaUserId}
}`

// --- OPTIMIZED HOMEPAGE QUERIES (Using lightCardProjection) ---
export const homepageReviewsQuery = groq`*[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...20] { ${lightCardProjection} }`
export const homepageArticlesQuery = groq`*[_type == "article" && ${publishedFilter}] | order(publishedAt desc)[0...20] { ${lightCardProjection} }`
export const homepageNewsQuery = groq`*[_type == "news" && ${publishedFilter}] | order(publishedAt desc)[0...30] { ${lightCardProjection} }`
export const homepageReleasesQuery = groq`*[_type == "gameRelease" && (isTBA == true || (defined(releaseDate) && releaseDate >= "2023-01-01"))] | order(isTBA asc, releaseDate asc) { ${gameReleaseProjection} }`

export const homepageCreditsQuery = groq`*[_id == "homepageSettings"][0].releasesCredits[]->{_id, name, image, prismaUserId}`

export const homepageMetadataQuery = groq`{
    "games": *[_type == "game"] | order(title asc) {_id, title, "slug": slug.current},
    "gameTags": *[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current, category},
    "newsTags": *[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current, category},
    "articleTags": *[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current, category}
}`

// FIX: Added 'projection' parameter with default
export const paginatedNewsQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'viral' = 'latest', projection: string = lightCardProjection) => {
  let filter = `_type == "news" && ${publishedFilter} && defined(mainImage.asset)`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' || '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  const orderBy = sort === 'latest' ? 'publishedAt desc' : '_updatedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${projection} }`
}

export const paginatedReviewsQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, scoreRange?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'score' = 'latest', projection: string = lightCardProjection) => {
  let filter = `_type == "review" && ${publishedFilter}`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' && '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  if (scoreRange) { if (scoreRange === '9-10') filter += ` && score >= 9 && score <= 10`; else if (scoreRange === '8-8.9') filter += ` && score >= 8 && score < 9`; else if (scoreRange === '7-7.9') filter += ` && score >= 7 && score < 8`; else if (scoreRange === '<7') filter += ` && score < 7` }
  const orderBy = sort === 'score' ? 'score desc, publishedAt desc' : 'publishedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${projection} }`
}

export const paginatedArticlesQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'viral' = 'latest', projection: string = lightCardProjection) => {
  let filter = `_type == "article" && ${publishedFilter}`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' && '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  const orderBy = sort === 'latest' ? 'publishedAt desc' : '_updatedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${projection} }`
}

export const cardListProjection = lightCardProjection; 
export const cardProjection = lightCardProjection; 
export const relatedContentProjection = groq`{ ${lightCardProjection} }`
export const allContentByCreatorListQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && references($creatorIds)] | order(publishedAt desc) { ${lightCardProjection} }`
export const contentByIdsQuery = groq`*[_type in ["review", "article", "news"] && legacyId in $ids && ${publishedFilter}] { ${lightCardProjection} }`
export const searchQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && defined(slug.current) && (title match $searchTerm + "*" || pt::text(content) match $searchTerm)] | order(publishedAt desc) [0...10] { ${lightCardProjection} }`

export const allGameTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current, category}`
export const allArticleTypeTagsQuery = groq`*[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current, category}`
export const allNewsTagsQuery = groq`*[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current, category}`
export const allGamesForStudioQuery = groq`*[_type == "game"] | order(title asc){_id, title, "slug": slug.current}`
export const allTagsForStudioQuery = groq`*[_type == "tag"] | order(title asc){_id, title, category}`
export const allCreatorsForStudioQuery = groq`*[_type in ["reviewer", "author", "reporter", "designer"]] | order(name asc){_id, name, _type, prismaUserId}`
export const homepageArticlesQueryDeprecated = groq`*[_type == "article" && ${publishedFilter}] | order(publishedAt desc)[0...12] { ${lightCardProjection} }`
export const homepageNewsQueryDeprecated = groq`*[_type == "news" && ${publishedFilter}] | order(publishedAt desc)[0...18] { ${lightCardProjection} }`