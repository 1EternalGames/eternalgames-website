// app/sitemap.ts
import { MetadataRoute } from 'next';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

// OPTIMIZATION: Removed time-based revalidation.
// We now rely on On-Demand Revalidation via the 'content' tag.
// This sitemap will stay cached forever until a Sanity Webhook fires.

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com'; 

const sitemapQuery = groq`{
  "reviews": *[_type == "review" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "articles": *[_type == "article" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "news": *[_type == "news" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "games": *[_type == "game" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "tags": *[_type == "tag" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "developers": *[_type == "developer" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "publishers": *[_type == "publisher" && defined(slug.current)] { "slug": slug.current, _updatedAt }
}`;

const getPriority = (dateStr: string, basePriority: number) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) return Math.min(1.0, basePriority + 0.2);
    if (diffDays > 365) return Math.max(0.1, basePriority - 0.2);
    
    return basePriority;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // FIX: Use 'next: { tags: ['content'] }'.
  // This connects the sitemap to the global 'content' revalidation tag.
  const data = await client.fetch(sitemapQuery, {}, { 
      next: { tags: ['content'] } 
  });

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/releases`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/celestial-almanac`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/tools/upscaler`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/sitemap-html`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  (data.reviews || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/reviews/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'weekly',
      priority: getPriority(item._updatedAt, 0.8), 
    });
  });

  (data.articles || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/articles/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'monthly',
      priority: getPriority(item._updatedAt, 0.7),
    });
  });

  (data.news || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/news/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'never',
      priority: getPriority(item._updatedAt, 0.6), 
    });
  });

  (data.games || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/games/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  (data.tags || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/tags/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  });

  (data.developers || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/developers/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'monthly',
      priority: 0.4,
    });
  });

  (data.publishers || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/publishers/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'monthly',
      priority: 0.4,
    });
  });

  return routes;
}