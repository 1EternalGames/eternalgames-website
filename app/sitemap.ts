// app/sitemap.ts
import { MetadataRoute } from 'next';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';

// 1. Fetch ALL dynamic routes. 
// We explicitly exclude drafts and ensure slugs are defined.
const sitemapQuery = groq`{
  "reviews": *[_type == "review" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "articles": *[_type == "article" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "news": *[_type == "news" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "games": *[_type == "game" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "tags": *[_type == "tag" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "developers": *[_type == "developer" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "publishers": *[_type == "publisher" && defined(slug.current)] { "slug": slug.current, _updatedAt }
}`;

// Helper to determine priority based on content freshness
const getPriority = (dateStr: string, basePriority: number) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If updated in last 30 days, boost priority
    if (diffDays <= 30) return Math.min(1.0, basePriority + 0.2);
    // If older than a year, slightly lower priority (archive tier)
    if (diffDays > 365) return Math.max(0.1, basePriority - 0.2);
    
    return basePriority;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await client.fetch(sitemapQuery);

  // 1. Static Core Routes
  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/releases`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/celestial-almanac`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/tools/upscaler`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // 2. Dynamic Content Routes
  // Reviews: High priority, evergreen content
  (data.reviews || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/reviews/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'weekly',
      priority: getPriority(item._updatedAt, 0.8), 
    });
  });

  // Articles: Medium-High priority
  (data.articles || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/articles/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'monthly',
      priority: getPriority(item._updatedAt, 0.7),
    });
  });

  // News: High freshness priority, but decays quickly
  (data.news || []).forEach((item: any) => {
    routes.push({
      url: `${baseUrl}/news/${item.slug}`,
      lastModified: new Date(item._updatedAt),
      changeFrequency: 'never', // News rarely changes after publish
      priority: getPriority(item._updatedAt, 0.6), 
    });
  });

  // 3. Entity Routes (Hubs)
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