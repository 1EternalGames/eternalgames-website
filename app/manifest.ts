// app/manifest.ts
import { MetadataRoute } from 'next';

// FORCE STATIC: Prevents this from counting as a dynamic server request
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EternalGames',
    short_name: 'EG',
    description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0B0F',
    theme_color: '#00FFF0',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: "المراجعات",
        short_name: "مراجعات",
        description: "أحدث مراجعات الألعاب",
        url: "/reviews",
        icons: [{ src: "/icon.svg", sizes: "any", type: 'image/svg+xml' }]
      },
      {
        name: "الأخبار",
        short_name: "أخبار",
        description: "آخر أخبار الصناعة",
        url: "/news",
        icons: [{ src: "/icon.svg", sizes: "any", type: 'image/svg+xml' }]
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