'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import KineticReleaseTimeline from '@/components/KineticReleaseTimeline';

export default function AnimatedReleases({ releases }: { releases: any[] }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.4 });
    const variants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };

    return (
        <motion.div 
            ref={ref} 
            variants={variants} 
            initial="hidden" 
            animate={isInView ? "visible" : "hidden"} 
            transition={{ duration: 0.8, ease: "easeOut" as const }}
        >
            <KineticReleaseTimeline releases={releases} />
        </motion.div>
    );
}


