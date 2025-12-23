// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgamesweb.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // SECURITY & SEO: Prevent crawling of admin areas and infinite filter parameters
      disallow: [
        '/studio/',
        '/api/',
        '/admin/',
        '/private/',
        '/*?*',
        '/search',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}