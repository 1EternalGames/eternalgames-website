// components/AnimatedReleases.tsx
'use client';

import KineticReleaseTimeline from '@/components/KineticReleaseTimeline';

export default function AnimatedReleases({ releases }: { releases: any[] }) {
    // REMOVED: Parent-level useInView and opacity styles.
    // The children (TimelineCards) now handle their own entrance animations individually.
    // This prevents the parent from hiding the first card's slide effect.
    
    return (
        <div>
            <KineticReleaseTimeline releases={releases} />
        </div>
    );
}