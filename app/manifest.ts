// app/manifest.ts
import { MetadataRoute } from 'next';

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
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/opengraph-image.png',
        sizes: '1200x630',
        type: 'image/png',
      },
    ],
  };
}