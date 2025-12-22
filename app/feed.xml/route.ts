// app/feed.xml/route.ts
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgamesweb.com';

export async function GET() {
  const query = groq`
    *[_type in ["review", "article", "news"] && defined(slug.current) && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] {
      title,
      "slug": slug.current,
      "description": synopsis,
      publishedAt,
      _type,
      "author": coalesce(authors[0]->name, reporters[0]->name, "EternalGames Team")
    }
  `;

  const posts = await client.fetch(query);

  const itemsXml = posts.map((post: any) => {
    let section = 'news';
    if (post._type === 'review') section = 'reviews';
    if (post._type === 'article') section = 'articles';

    const url = `${siteUrl}/${section}/${post.slug}`;
    const date = new Date(post.publishedAt || new Date()).toUTCString();

    return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${date}</pubDate>
        <description><![CDATA[${post.description || ''}]]></description>
        <author>${post.author}</author>
      </item>
    `;
  }).join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>EternalGames</title>
        <link>${siteUrl}</link>
        <description>حيث لا تُفنى الألعاب - مراجعات، أخبار، ومقالات.</description>
        <language>ar</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
        ${itemsXml}
      </channel>
    </rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}