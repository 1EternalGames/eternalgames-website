// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // UPDATE: Changed base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // UPDATED: Removed '/*?*' to allow pagination crawling (?offset=20)
      // We rely on Canonical Tags (implemented in Phase 3) to prevent duplicate content penalties.
      disallow: [
        '/studio/',
        '/api/',
        '/admin/',
        '/private/',
        '/search', // Internal search results pages should still be blocked
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}