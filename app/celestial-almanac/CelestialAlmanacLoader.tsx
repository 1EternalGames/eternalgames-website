// app/celestial-almanac/CelestialAlmanacLoader.tsx

'use client';

import dynamic from 'next/dynamic';
import type { SanityGameRelease } from '@/types/sanity';

// Dynamic import of the main client component containing the Three.js canvas.
// This is critical for performance and to avoid SSR errors with browser-only APIs.
const CelestialAlmanac = dynamic(() => import('@/app/celestial-almanac'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: '60px', height: '60px' }} />
    </div>
  ),
});

// This simple wrapper component passes the server-fetched data to the client component.
export default function CelestialAlmanacLoader({ releases }: { releases: SanityGameRelease[] }) {
  return <CelestialAlmanac releases={releases} />;
}


















