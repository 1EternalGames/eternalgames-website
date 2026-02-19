// app/feed.xml/route.ts
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';

// OPTIMIZATION: Removed 'export const revalidate'.
// We now rely on the 'content' tag below for infinite caching + on-demand purge.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';

export async function GET() {
  const query = groq`
    *[_type in ["review", "article", "news"] && defined(slug.current) && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] {
      title,
      "slug": slug.current,
      "description": synopsis,
      publishedAt,
      _type,
      "author": coalesce(authors[0]->name, reporters[0]->name, "EternalGames Team"),
      "mainImage": mainImage.asset->{
        _id,
        url,
        mimeType,
        size
      }
    }
  `;

  // FIX: Tag-based caching
  const posts = await client.fetch(query, {}, { 
      next: { tags: ['content'] } 
  });

  const itemsXml = posts.map((post: any) => {
    let section = 'news';
    if (post._type === 'review') section = 'reviews';
    if (post._type === 'article') section = 'articles';

    const url = `${siteUrl}/${section}/${post.slug}`;
    const date = new Date(post.publishedAt || new Date()).toUTCString();
    
    let mediaXml = '';
    if (post.mainImage?.url) {
        const imageUrl = urlFor(post.mainImage).width(1200).height(800).fit('crop').url();
        const mimeType = post.mainImage.mimeType || 'image/jpeg';
        const size = post.mainImage.size || 0;
        
        mediaXml = `
            <enclosure url="${imageUrl}" length="${size}" type="${mimeType}" />
            <media:content url="${imageUrl}" type="${mimeType}" medium="image" />
        `;
    }

    return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${date}</pubDate>
        <description><![CDATA[${post.description || ''}]]></description>
        <dc:creator><![CDATA[${post.author}]]></dc:creator>
        <category>${section}</category>
        ${mediaXml}
      </item>
    `;
  }).join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <title>EternalGames</title>
        <link>${siteUrl}</link>
        <description>عالمٌ يُنسيك ما سِواه - مراجعات، أخبار، ومقالات.</description>
        <language>ar</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
        <image>
            <url>${siteUrl}/icon.svg</url>
            <title>EternalGames</title>
            <link>${siteUrl}</link>
        </image>
        ${itemsXml}
      </channel>
    </rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      // Browser Cache: 1 hour (Client side only), Server Cache is handled by tags
      'Cache-Control': 'public, max-age=3600',
    },
  });
}