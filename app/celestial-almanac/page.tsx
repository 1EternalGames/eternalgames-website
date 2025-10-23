// app/celestial-almanac/page.tsx
import { client } from '@/lib/sanity.client';
import { allReleasesQuery } from '@/lib/sanity.queries';
import type { SanityGameRelease } from '@/types/sanity';
import CelestialAlmanacLoader from './CelestialAlmanacLoader';
import { unstable_noStore as noStore } from 'next/cache';

export const revalidate = 3600;

// NOTE: The CelestialAlmanacLoader already uses dynamic import internally.
// This file structure is correct and requires no changes. It already isolates the heavy component.
export default async function CelestialAlmanacPage() {
  noStore();

  const releases: SanityGameRelease[] = await client.fetch(allReleasesQuery);
  const sanitizedReleases = (releases || []).filter(item =>
    item?.mainImage?.url && item.releaseDate && item.title && item.slug
  );

  return (
    <div style={{ paddingTop: 'var(--nav-height-scrolled)' }}>
      <CelestialAlmanacLoader releases={sanitizedReleases} />
    </div>
  );
}








