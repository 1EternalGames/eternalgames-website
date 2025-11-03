// components/effects/KineticGlyphs.tsx
'use client';

import { motion } from 'framer-motion';
import styles from './KineticGlyphs.module.css';

const pathVariants = {
    hidden: { pathLength: 0, pathOffset: 1 },
    visible: { 
        pathLength: 1, 
        pathOffset: 0,
        transition: { duration: 0.6, ease: 'easeInOut' as const }
    },
    exit: { 
        pathLength: 0, 
        pathOffset: -1,
        transition: { duration: 0.3, ease: 'easeInOut' as const }
    }
};

export default function KineticGlyphs() {
    return (
        <div className={styles.glyphContainer}>
            <motion.svg className={styles.glyphSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                    className={styles.glyphPath}
                    // --- THE DEFINITIVE FIX ---
                    // The radius of the arc commands has been reduced from 4 to 3.
                    // This ensures the path's corners are smaller than the container's
                    // CSS border-radius, preventing them from being clipped by overflow:hidden.
                    d="M 3.5,0.5 H 96.5 A 3,3 0 0 1 99.5,3.5 V 96.5 A 3,3 0 0 1 96.5,99.5 H 3.5 A 3,3 0 0 1 0.5,96.5 V 3.5 A 3,3 0 0 1 3.5,0.5 Z"
                    variants={pathVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                />
            </motion.svg>
        </div>
    );
}


