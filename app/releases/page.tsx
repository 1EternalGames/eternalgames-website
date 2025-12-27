// app/releases/page.tsx
import React from 'react';
import ReleasePageClient from './ReleasePageClient';
import { getUniversalBaseData } from '@/app/actions/layoutActions';

export const dynamic = 'force-static';

export default async function ReleasesPage() {
  const data = await getUniversalBaseData();
  const releases = data.releases || [];

  const sanitizedReleases = releases.filter((item: any) =>
    item?.mainImage?.url && item.title
  );

  return (
    <div className="container page-container" style={{ paddingTop: 'calc(var(--nav-height-scrolled) + 2rem)' }}>
      <ReleasePageClient releases={sanitizedReleases} />
    </div>
  );
}