// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // SECURITY: Tell bots to stay away from Admin/API/Studio routes
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