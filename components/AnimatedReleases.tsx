'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ContentBlock } from '@/components/ContentBlock';
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
            <ContentBlock title="إصدارات هذا الشهر">
                <p style={{textAlign: 'center', maxWidth: '600px', margin: '-2rem auto 4rem auto', color: 'var(--text-secondary)'}}>نظرة على الألعاب التي ترى النور هذا الشهر. ما صدر منها قد وُسِمَ بعلامة.</p>
                <KineticReleaseTimeline releases={releases} />
            </ContentBlock>
        </motion.div>
    );
}