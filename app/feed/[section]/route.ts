// app/feed/[section]/route.ts
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';

const typeMap: Record<string, string> = {
    'reviews': 'review',
    'articles': 'article',
    'news': 'news',
};

const titleMap: Record<string, string> = {
    'reviews': 'مراجعات EternalGames',
    'articles': 'مقالات EternalGames',
    'news': 'أخبار EternalGames',
};

export async function GET(request: Request, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const sanityType = typeMap[section];

  if (!sanityType) {
    return new Response('Invalid feed section', { status: 404 });
  }

  const query = groq`
    *[_type == $type && defined(slug.current) && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] {
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
  const posts = await client.fetch(query, { type: sanityType }, { 
      next: { tags: ['content'] } 
  });

  const itemsXml = posts.map((post: any) => {
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
        <title>${titleMap[section]}</title>
        <link>${siteUrl}/${section}</link>
        <description>أحدث ${titleMap[section]} من منصة EternalGames.</description>
        <language>ar</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${siteUrl}/feed/${section}" rel="self" type="application/rss+xml" />
        <image>
            <url>${siteUrl}/icon.svg</url>
            <title>${titleMap[section]}</title>
            <link>${siteUrl}/${section}</link>
        </image>
        ${itemsXml}
      </channel>
    </rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}