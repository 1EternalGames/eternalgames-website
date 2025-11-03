// app/celestial-almanac/page.tsx
'use client'; // This page is now a client component boundary

import { client } from '@/lib/sanity.client';
import { allReleasesQuery } from '@/lib/sanity.queries';
import type { SanityGameRelease } from '@/types/sanity';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// The loader component is removed. We now handle the dynamic import directly here.
const CelestialAlmanac = dynamic(() => import('@/app/celestial-almanac'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: '60px', height: '60px' }} />
    </div>
  ),
});

export default function CelestialAlmanacPage() {
  const [releases, setReleases] = useState<SanityGameRelease[]>([]);

  useEffect(() => {
    const fetchReleases = async () => {
      const fetchedReleases: SanityGameRelease[] = await client.fetch(allReleasesQuery);
      const sanitizedReleases = (fetchedReleases || []).filter(item =>
        item?.mainImage?.url && item.releaseDate && item.title && item.slug
      );
      setReleases(sanitizedReleases);
    };
    fetchReleases();
  }, []);

  return (
    <div style={{ paddingTop: 'var(--nav-height-scrolled)' }}>
      <CelestialAlmanac releases={releases} />
    </div>
  );
}


