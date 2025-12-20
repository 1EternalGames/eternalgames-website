// components/effects/KineticGlyphs.tsx
'use client';

import { motion, Variants } from 'framer-motion';
import styles from './KineticGlyphs.module.css';

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", duration: 1.5, bounce: 0 },
      opacity: { duration: 0.01 }
    }
  },
  exit: {
    pathLength: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeInOut" }
  }
};

export default function KineticGlyphs() {
    return (
        <div className={styles.glyphContainer}>
            <motion.svg 
                className={styles.glyphSvg} 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
            >
                <defs>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Animated Glowing Frame */}
                <motion.rect
                    x="0" y="0" width="100" height="100" rx="3" ry="3"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                    variants={draw}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ filter: 'url(#neon-glow)' }}
                />
            </motion.svg>
        </div>
    );
}


