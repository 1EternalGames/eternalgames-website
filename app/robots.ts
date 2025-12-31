// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';

  return {
    rules: {
      userAgent: '*',
      allow: [
          '/', 
          '/api/og/*' 
      ],
      disallow: [
        '/studio/',
        '/admin/',
        '/private/',
        '/search',
        '/api/', 
        // SECURITY: Block all query parameters to prevent "Fast Origin Transfer" attacks / cache bust attempts.
        // Canonical URLs on this site do not use query params for static content.
        '/*?*', 
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}