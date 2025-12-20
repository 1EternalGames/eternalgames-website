// components/AnimatedReleases.tsx
'use client';

import KineticReleaseTimeline from '@/components/KineticReleaseTimeline';

// MODIFIED: Accept credits
export default function AnimatedReleases({ releases, credits }: { releases: any[], credits?: any[] }) {
    return (
        <div>
            <KineticReleaseTimeline releases={releases} credits={credits} />
        </div>
    );
}


