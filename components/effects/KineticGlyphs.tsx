// components/effects/KineticGlyphs.tsx
'use client';

import { motion } from 'framer-motion';
import styles from './KineticGlyphs.module.css';

const pathVariants = {
    hidden: { pathLength: 0, pathOffset: 1 },
    visible: { 
        pathLength: 1, 
        pathOffset: 0,
        transition: { duration: 0.6, ease: 'easeInOut' }
    },
    exit: { 
        pathLength: 0, 
        pathOffset: -1,
        transition: { duration: 0.3, ease: 'easeInOut' }
    }
};

export default function KineticGlyphs() {
    return (
        <div className={styles.glyphContainer}>
            <motion.svg className={styles.glyphSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                    className={styles.glyphPath}
                    d="M1,1 H99 V99 H1 Z"
                    variants={pathVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                />
            </motion.svg>
        </div>
    );
}