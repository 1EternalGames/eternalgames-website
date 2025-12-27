// app/manifest.ts
import { MetadataRoute } from 'next';

// FORCE STATIC: Prevents this from counting as a dynamic server request
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EternalGames',
    short_name: 'EternalGames',
    description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0B0F',
    theme_color: '#00FFF0',
    icons: [
      {
        // FIX: Point to the dynamic icon route, not a static file
        src: '/icon', 
        sizes: '32x32',
        type: 'image/png',
      },
      {
        // For larger sizes, we can reuse the same endpoint or rely on Next.js to handle scaling 
        // if using the generateImageMetadata API, but pointing to /icon is the safest quick fix 
        // if you don't have static files.
        src: '/icon', 
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    // Shortcuts removed or updated to use the same icon
    shortcuts: [
      {
        name: "المراجعات",
        short_name: "مراجعات",
        description: "أحدث مراجعات الألعاب",
        url: "/reviews",
        icons: [{ src: "/icon", sizes: "96x96" }]
      },
      {
        name: "الأخبار",
        short_name: "أخبار",
        description: "آخر أخبار الصناعة",
        url: "/news",
        icons: [{ src: "/icon", sizes: "96x96" }]
      }
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        // @ts-ignore
        form_factor: "narrow"
      },
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-ignore
        form_factor: "wide"
      }
    ]
  };
}