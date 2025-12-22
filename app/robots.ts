import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgamesweb.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // SECURITY: Keep bots out of admin/studio areas to save crawl budget
      disallow: [
        '/studio/',
        '/api/',
        '/admin/',
        '/private/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}