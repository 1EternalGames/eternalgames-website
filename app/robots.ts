// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';

  return {
    rules: {
      userAgent: '*',
      allow: [
          '/', 
          '/api/og/*' // Explicitly ALLOW OG image generation
      ],
      disallow: [
        '/studio/',
        '/admin/',
        '/private/',
        '/search',
        // BLOCK ALL API ROUTES by default to save CPU/Bandwidth
        // Bots do not need to consume your JSON endpoints directly
        '/api/', 
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}