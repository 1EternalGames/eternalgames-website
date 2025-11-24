// app/sitemap.ts
import { MetadataRoute } from 'next';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';

// Fetch all PUBLISHED content (excluding drafts)
const sitemapQuery = groq`{
  "reviews": *[_type == "review" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "articles": *[_type == "article" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "news": *[_type == "news" && defined(slug.current) && !(_id in path("drafts.**"))] { "slug": slug.current, _updatedAt },
  "games": *[_type == "game" && defined(slug.current)] { "slug": slug.current, _updatedAt },
  "tags": *[_type == "tag" && defined(slug.current)] { "slug": slug.current, _updatedAt }
}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await client.fetch(sitemapQuery);

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/releases`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/celestial-almanac`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/tools/upscaler`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Add dynamic routes
  (data.reviews || []).forEach((item: any) => {
    routes.push({ url: `${baseUrl}/reviews/${item.slug}`, lastModified: new Date(item._updatedAt), changeFrequency: 'weekly', priority: 0.9 });
  });

  (data.articles || []).forEach((item: any) => {
    routes.push({ url: `${baseUrl}/articles/${item.slug}`, lastModified: new Date(item._updatedAt), changeFrequency: 'weekly', priority: 0.9 });
  });

  (data.news || []).forEach((item: any) => {
    routes.push({ url: `${baseUrl}/news/${item.slug}`, lastModified: new Date(item._updatedAt), changeFrequency: 'daily', priority: 0.8 });
  });

  (data.games || []).forEach((item: any) => {
    routes.push({ url: `${baseUrl}/games/${item.slug}`, lastModified: new Date(item._updatedAt), changeFrequency: 'weekly', priority: 0.6 });
  });

  (data.tags || []).forEach((item: any) => {
    routes.push({ url: `${baseUrl}/tags/${item.slug}`, lastModified: new Date(item._updatedAt), changeFrequency: 'weekly', priority: 0.5 });
  });

  return routes;
}