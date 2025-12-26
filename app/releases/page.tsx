// app/releases/page.tsx

import { client } from '@/lib/sanity.client';
import { allReleasesQuery } from '@/lib/sanity.queries';
import type { SanityGameRelease } from '@/types/sanity';
import ReleasePageClient from './ReleasePageClient';
import { unstable_cache } from 'next/cache';
import DirectHydrator from '@/components/kinetic/DirectHydrator'; // <--- ADDED

// THE FIX: Enforce static generation for the releases index but allow revalidation.
export const dynamic = 'force-static';

const getCachedReleases = unstable_cache(
    async () => {
        return await client.fetch(allReleasesQuery);
    },
    ['all-releases-data'],
    {
        revalidate: false,
        tags: ['gameRelease', 'content']
    }
);

export default async function ReleasesPage() {
  const releases: SanityGameRelease[] = await getCachedReleases();

  const sanitizedReleases = (releases || []).filter(item =>
    item?.mainImage?.url && item.title
  );

  return (
    <>
      {/* THE FIX: Hydrate store so items open in Overlay (Top) instead of navigating */}
      <DirectHydrator items={sanitizedReleases} />
      
      <div className="container page-container" style={{ paddingTop: 'calc(var(--nav-height-scrolled) + 2rem)' }}>
        <ReleasePageClient releases={sanitizedReleases} />
      </div>
    </>
  );
}