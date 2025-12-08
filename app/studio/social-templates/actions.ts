'use server';

import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { getAuthenticatedSession } from '@/lib/auth';

// Shared projection for consistent data structure
// Added pros and cons for reviews
const templateProjection = `
  _id,
  _type,
  title,
  "slug": slug.current,
  "imageUrl": mainImage.asset->url,
  publishedAt,
  newsType,
  score,
  "verdict": verdict,
  "pros": pros,
  "cons": cons,
  "gameTitle": game->title,
  "synopsis": synopsis,
  // Ensure we get text even if it's just a raw block array
  "excerpt": pt::text(content)
`;

const searchContentQuery = groq`
  *[_type in ["news", "review", "article"] && (title match $query + "*" || pt::text(content) match $query + "*")] | order(publishedAt desc)[0...10] {
    ${templateProjection}
  }
`;

const latestContentQuery = groq`
  *[_type in ["news", "review", "article"]] | order(publishedAt desc)[0...10] {
    ${templateProjection}
  }
`;

export async function searchContentForTemplateAction(query: string) {
    await getAuthenticatedSession(); // Ensure auth

    try {
        if (!query || query.trim() === '') {
            const results = await client.fetch(latestContentQuery);
            return results;
        }

        const results = await client.fetch(searchContentQuery, { query });
        return results;
    } catch (error) {
        console.error("Smart Fill Search Error:", error);
        return [];
    }
}