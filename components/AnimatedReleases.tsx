// components/AnimatedReleases.tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import KineticReleaseTimeline from '@/components/KineticReleaseTimeline';

export default function AnimatedReleases({ releases }: { releases: any[] }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <div 
            ref={ref}
            style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translateY(0)' : 'translateY(50px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
            }}
        >
            <KineticReleaseTimeline releases={releases} />
        </div>
    );
}