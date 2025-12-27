// lib/sanity.queries.ts
import {groq} from 'next-sanity'

// EXPORT THIS FIELD
export const mainImageFields = groq`asset, "url": asset->url, "blurDataURL": asset->metadata.lqip, alt`

const creatorFields = groq`_id, name, prismaUserId, image, bio`
const gameFields = groq`_id, title, "slug": slug.current`
const tagFields = groq`_id, title, "slug": slug.current`
const publishedFilter = groq`defined(publishedAt) && publishedAt < now()`

// --- Projections ---
export const cardProjection = groq`
_id, _type, legacyId, title, "slug": slug.current, 
"mainImage": mainImage{${mainImageFields}}, 
"mainImageVertical": mainImageVertical{${mainImageFields}},
score,
"authors": authors[]->{${creatorFields}},
"reporters": reporters[]->{${creatorFields}},
"designers": designers[]->{${creatorFields}}, 
"publishedAt": publishedAt, "game": game->{_id, title, "slug": slug.current}, "tags": tags[]->{${tagFields}}, "category": category->{title, "slug": slug.current}, newsType`

export const cardListProjection = groq`
_id, _type, legacyId, title, "slug": slug.current, 
"mainImageRef": mainImage.asset, 
"mainImageVerticalRef": mainImageVertical.asset,
score,
"authors": authors[]->{${creatorFields}},
"reporters": reporters[]->{${creatorFields}},
"designers": designers[]->{${creatorFields}},
"publishedAt": publishedAt, "game": game->{_id, title, "slug": slug.current}, "tags": tags[]->{${tagFields}}, "category": category->{title, "slug": slug.current}, newsType
`

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
  
  // CONDITIONAL RELATED CONTENT
  _type == "review" => {
    "relatedReviews": coalesce(
      relatedReviews[]->{${cardListProjection}}, 
      *[_type == "review" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] {${cardListProjection}}
    )
  },
  _type == "article" => {
    "relatedArticles": coalesce(
      relatedArticles[]->{${cardListProjection}}, 
      *[_type == "article" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] {${cardListProjection}}
    )
  },
  _type == "news" => {
    "relatedNews": coalesce(
      relatedNews[]->{${cardListProjection}}, 
      *[_type == "news" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] {${cardListProjection}}
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
    "game": game->{ "slug": slug.current }, 
    "slug": game->slug.current, 
    "tags": tags[]->{${tagFields}}
`

// --- Queries ---

export const newsHeroQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...4] { ${fullDocProjection}, synopsis }`
export const newsGridInitialQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...20] { ${fullDocProjection} }`

const contentProjection = groq`content[]{ ..., _type == "image" => { "asset": asset->{ _id, url, "lqip": metadata.lqip, "metadata": metadata } }, _type == "imageCompare" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}} }, _type == "twoImageGrid" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}} }, _type == "fourImageGrid" => { "image1": image1{..., asset->{_id, url}}, "image2": image2{..., asset->{_id, url}}, "image3": image3{..., asset->{_id, url}}, "image4": image4{..., asset->{_id, url}} }, _type == "table" => {..., rows[]{..., cells[]{..., content[]{...}}}}, _type == "gameDetails" => { ... }, _type == 'youtube' => { ... } }`
const relatedContentProjection = groq`{ _id, _type, legacyId, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}}, score, "authors": authors[]->{name, prismaUserId}, "reporters": reporters[]->{name, prismaUserId}, "publishedAt": publishedAt, newsType }`

export const reviewBySlugQuery = groq`*[_type == "review" && slug.current == $slug && ${publishedFilter}][0] { ..., "authors": authors[]->{${creatorFields}}, "designers": designers[]->{${creatorFields}}, "game": game->{${gameFields}}, "mainImage": mainImage{${mainImageFields}}, "mainImageVertical": mainImageVertical{${mainImageFields}}, "tags": tags[]->{${tagFields}}, "relatedReviews": coalesce(relatedReviews[${publishedFilter}]->${relatedContentProjection}, *[_type == "review" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}), ${contentProjection} }`
export const articleBySlugQuery = groq`*[_type == "article" && slug.current == $slug && ${publishedFilter}][0] { ..., "authors": authors[]->{${creatorFields}}, "designers": designers[]->{${creatorFields}}, "game": game->{${gameFields}}, "mainImage": mainImage{${mainImageFields}}, "mainImageVertical": mainImageVertical{${mainImageFields}}, "tags": tags[]->{_id, title, "slug": slug.current}, "relatedArticles": coalesce(relatedArticles[${publishedFilter}]->${relatedContentProjection}, *[_type == "article" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}), ${contentProjection} }`
export const newsBySlugQuery = groq`*[_type == "news" && slug.current == $slug && ${publishedFilter}][0] { ..., "reporters": reporters[]->{${creatorFields}}, "designers": designers[]->{${creatorFields}}, "game": game->{${gameFields}}, "mainImage": mainImage{${mainImageFields}}, "mainImageVertical": mainImageVertical{${mainImageFields}}, "category": category->{_id, title, "slug": slug.current}, "relatedNews": coalesce(relatedNews[${publishedFilter}]->${relatedContentProjection}, *[_type == "news" && ${publishedFilter} && _id != ^._id] | order(publishedAt desc)[0...3] ${relatedContentProjection}), ${contentProjection} }`

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
    "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...24] { ${cardListProjection} }
  }
`

export const gamePageDataQuery = groq`
  *[_type == "game" && slug.current == $slug][0] {
    _id, title, "mainImage": mainImage{${mainImageFields}},
    "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && game._ref == ^._id] | order(publishedAt desc)[0...24] { ${cardListProjection} }
  }
`

export const creatorContentQuery = groq`
  *[_type in ["review", "article", "news"] && ${publishedFilter} && references(*[_type in ["reviewer", "author", "reporter", "designer"] && prismaUserId == $prismaUserId]._id)] | order(publishedAt desc) { ${cardListProjection} }
`

export const batchGameHubsQuery = groq`
  *[_type == "game" && _id in $ids] {
    _id, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}},
    "linkedContent": *[_type in ["review", "article", "news"] && ${publishedFilter} && game._ref == ^._id] | order(publishedAt desc)[0...24] { ${cardListProjection} }
  }
`

export const batchTagHubsQuery = groq`
  *[_type == "tag" && _id in $ids] {
    _id, title, "slug": slug.current,
    "items": *[_type in ["review", "article", "news"] && ${publishedFilter} && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...24] { ${cardListProjection} }
  }
`

export const batchCreatorHubsQuery = groq`
  *[_type in ["reviewer", "author", "reporter", "designer"] && _id in $ids] {
     _id, name, prismaUserId, image, bio, username,
     "linkedContent": *[_type in ["review", "article", "news"] && ${publishedFilter} && references(^._id)] | order(publishedAt desc)[0...24] { ${cardListProjection} }
  }
`

export const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`

const editorDocProjection = groq`
  ..., 
  "authors": authors[]->{_id, name, prismaUserId}, 
  "reporters": reporters[]->{_id, name, prismaUserId}, 
  "designers": designers[]->{_id, name, prismaUserId}, 
  "game": game->{_id, title}, 
  "tags": tags[]->{_id, title}, 
  "category": category->{_id, title}, 
  "developer": developer->{_id, title}, 
  "publisher": publisher->{_id, title},
  "mainImage": mainImage.asset->{ "_ref": _id, "url": url, "metadata": metadata }, 
  "mainImageVertical": mainImageVertical.asset->{ "_ref": _id, "url": url, "metadata": metadata },
  content[]{ 
    ..., 
    _type == "image" => { "asset": asset->{ _id, url, "lqip": metadata.lqip, "metadata": metadata } }, 
    _type == "imageCompare" => { "image1": image1{..., asset->{_id, url, metadata}}, "image2": image2{..., asset->{_id, url, metadata}} }, 
    _type == "twoImageGrid" => { "image1": image1{..., asset->{_id, url, metadata}}, "image2": image2{..., asset->{_id, url, metadata}} }, 
    _type == "fourImageGrid" => { "image1": image1{..., asset->{_id, url, metadata}}, "image2": image2{..., asset->{_id, url, metadata}}, "image3": image3{..., asset->{_id, url, metadata}}, "image4": image4{..., asset->{_id, url, metadata}} }, 
    _type == "table" => {..., rows[]{..., cells[]{..., content[]{...}}}}, 
    _type == "gameDetails" => { ... }, 
    _type == 'youtube' => { ... } 
  }
`
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

export const paginatedNewsQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'viral' = 'latest', projection: string = cardListProjection) => {
  let filter = `_type == "news" && ${publishedFilter} && defined(mainImage.asset)`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' || '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  const orderBy = sort === 'latest' ? 'publishedAt desc' : '_updatedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${projection} }`
}

export const paginatedReviewsQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, scoreRange?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'score' = 'latest', projection: string = cardListProjection) => {
  let filter = `_type == "review" && ${publishedFilter}`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' && '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  if (scoreRange) { if (scoreRange === '9-10') filter += ` && score >= 9 && score <= 10`; else if (scoreRange === '8-8.9') filter += ` && score >= 8 && score < 9`; else if (scoreRange === '7-7.9') filter += ` && score >= 7 && score < 8`; else if (scoreRange === '<7') filter += ` && score < 7` }
  const orderBy = sort === 'score' ? 'score desc, publishedAt desc' : 'publishedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${projection} }`
}

export const paginatedArticlesQuery = (gameSlug?: string, tagSlugs?: string[], searchTerm?: string, offset: number = 0, limit: number = 20, sort: 'latest' | 'viral' = 'latest', projection: string = cardListProjection) => {
  let filter = `_type == "article" && ${publishedFilter}`
  if (gameSlug) filter += ` && game->slug.current == "${gameSlug}"`
  if (tagSlugs && tagSlugs.length > 0) { const tagFilter = tagSlugs.map((slug) => `"${slug}" in tags[]->slug.current`).join(' && '); filter += ` && (${tagFilter})` }
  if (searchTerm) filter += ` && title match "${searchTerm}*"`
  const orderBy = sort === 'latest' ? 'publishedAt desc' : '_updatedAt desc'
  return groq`*[${filter}] | order(${orderBy}) [${offset}...${offset + limit}] { ${projection} }`
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
export const latestNewsQuery = groq`*[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...15] { _id, legacyId, title, "slug": slug.current, "mainImage": mainImage{${mainImageFields}}, "reporters": reporters[]->{name, prismaUserId}, publishedAt, "tags": tags[]->{${tagFields}}, newsType }`
export const heroContentQuery = groq`{ "featuredReview": *[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(score desc, publishedAt desc)[0] { ${cardProjection}, synopsis }, "latestNews": *[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0] { ${cardProjection} }, "featuredArticle": *[_type == "article" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0] { ${cardProjection} } }`
export const featuredReviewsQuery = groq`*[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...10] {${cardProjection}}`
export const featuredArticlesQuery = groq`*[_type == "article" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...10] {${cardProjection}}`
export const searchQuery = groq`*[_type in ["review", "article", "news"] && ${publishedFilter} && defined(slug.current) && (title match $searchTerm + "*" || pt::text(content) match $searchTerm)] | order(publishedAt desc) [0...10] { _id, _type, title, "slug": slug.current, "imageUrl": mainImage.asset->url + '?w=200&h=120&fit=crop&auto=format', publishedAt, "authors": authors[]->{name}, "reporters": reporters[]->{name}, "gameTitle": game->title, "tags": tags[]->{title} }`
export const contentByIdsQuery = groq`*[_type in ["review", "article", "news"] && legacyId in $ids && ${publishedFilter}] { ${cardProjection} }`
export const allReleasesQuery = groq`*[_type == "gameRelease" && (isTBA == true || (defined(releaseDate) && releaseDate >= "2023-01-01"))] | order(isTBA asc, releaseDate asc) { ${gameReleaseProjection} }`

// NEW: Consolidated queries have been removed. We now fetch separate parts in parallel.

// NEW: Fragmented queries for parallel fetching to bypass 2MB cache limit
export const homepageReviewsQuery = groq`*[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...20] { ${fullDocProjection} }`
export const homepageArticlesQuery = groq`*[_type == "article" && ${publishedFilter}] | order(publishedAt desc)[0...20] { ${fullDocProjection} }`
export const homepageNewsQuery = groq`*[_type == "news" && ${publishedFilter}] | order(publishedAt desc)[0...30] { ${fullDocProjection} }`
export const homepageReleasesQuery = groq`*[_type == "gameRelease" && (isTBA == true || (defined(releaseDate) && releaseDate >= "2023-01-01"))] | order(isTBA asc, releaseDate asc) { ${gameReleaseProjection} }`
export const homepageCreditsQuery = groq`*[_id == "homepageSettings"][0].releasesCredits[]->{_id, name, image, prismaUserId}`

// Metadata query kept monolithic as it's usually smaller than content blobs, but can be split if needed.
export const homepageMetadataQuery = groq`{
    "games": *[_type == "game"] | order(title asc) {_id, title, "slug": slug.current},
    "gameTags": *[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current, category},
    "newsTags": *[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current, category},
    "articleTags": *[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current, category}
}`


// MODIFIED: Use fullDocProjection for index pages
export const newsIndexQuery = groq`{
  "hero": *[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...4] { ${fullDocProjection}, synopsis },
  "grid": *[_type == "news" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc, _updatedAt desc)[0...20] { ${fullDocProjection} },
  "games": *[_type == "game"] | order(title asc) {_id, title, "slug": slug.current},
  "tags": *[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current, category}
}`

export const reviewsIndexQuery = groq`{
  "hero": *[_type == "review" && ${publishedFilter} && defined(mainImage.asset)] | order(score desc, publishedAt desc)[0] { ${fullDocProjection}, synopsis },
  "grid": *[_type == "review" && ${publishedFilter}] | order(publishedAt desc) [0...20] { ${fullDocProjection} },
  "games": *[_type == "game"] | order(title asc) {_id, title, "slug": slug.current},
  "tags": *[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current}
}`

export const articlesIndexQuery = groq`{
  "featured": *[_type == "article" && ${publishedFilter} && defined(mainImage.asset)] | order(publishedAt desc)[0...7] { ${fullDocProjection} },
  "grid": *[_type == "article" && ${publishedFilter}] | order(publishedAt desc) [0...20] { ${fullDocProjection} },
  "games": *[_type == "game"] | order(title asc) {_id, title, "slug": slug.current},
  "gameTags": *[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current, category},
  "typeTags": *[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current, category}
}`

export const allGameTagsQuery = groq`*[_type == "tag" && category == "Game"] | order(title asc) {_id, title, "slug": slug.current, category}`
export const allArticleTypeTagsQuery = groq`*[_type == "tag" && category == "Article"] | order(title asc) {_id, title, "slug": slug.current, category}`
export const allNewsTagsQuery = groq`*[_type == "tag" && category == "News"] | order(title asc) {_id, title, "slug": slug.current, category}`
export const allGamesForStudioQuery = groq`*[_type == "game"] | order(title asc){_id, title, "slug": slug.current}`
export const allTagsForStudioQuery = groq`*[_type == "tag"] | order(title asc){_id, title, category}`
export const allCreatorsForStudioQuery = groq`*[_type in ["reviewer", "author", "reporter", "designer"]] | order(name asc){_id, name, _type, prismaUserId}`
export const homepageArticlesQueryDeprecated = groq`*[_type == "article" && ${publishedFilter}] | order(publishedAt desc)[0...12] { ${cardListProjection} }`
export const homepageNewsQueryDeprecated = groq`*[_type == "news" && ${publishedFilter}] | order(publishedAt desc)[0...18] { ${cardListProjection} }`