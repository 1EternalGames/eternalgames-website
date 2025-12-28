// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // UPDATE: Ensure base URL is correct
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';

  return {
    rules: {
      userAgent: '*',
      allow: [
          '/', 
          '/api/og/*' // SPECIFICALLY ALLOW the image generator
      ],
      disallow: [
        '/studio/',
        '/admin/',
        '/private/',
        '/search',
        // SPECIFIC API BLOCKS (Instead of blocking all /api/)
        '/api/auth/',       // Block login endpoints
        '/api/cron/',       // Block cron jobs
        '/api/revalidate',  // Block cache revalidation
        '/api/user/',       // Block user data endpoints
        // Note: We REMOVED '/api/' from here to let /api/og pass through
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}