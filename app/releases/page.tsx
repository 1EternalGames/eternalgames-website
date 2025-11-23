// app/releases/page.tsx

import { client } from '@/lib/sanity.client';
import { allReleasesQuery } from '@/lib/sanity.queries';
import type { SanityGameRelease } from '@/types/sanity';
import ReleasePageClient from './ReleasePageClient';

// THE FIX: Enforce static generation for the releases index.
export const dynamic = 'force-static';

export default async function ReleasesPage() {
  const releases: SanityGameRelease[] = await client.fetch(allReleasesQuery);

  const sanitizedReleases = (releases || []).filter(item =>
    item?.mainImage?.url && item.releaseDate && item.title && item.slug
  );

  return (
    <div className="container page-container" style={{ paddingTop: 'calc(var(--nav-height-scrolled) + 2rem)' }}>
      <ReleasePageClient releases={sanitizedReleases} />
    </div>
  );
}