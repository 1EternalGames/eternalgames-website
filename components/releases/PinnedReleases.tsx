// components/releases/PinnedReleases.tsx
'use client';

import { motion } from 'framer-motion';
import type { SanityGameRelease } from '@/types/sanity';
import TimelineCard from '@/components/TimelineCard';
import styles from './PinnedReleases.module.css';

const PinIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } as const }
};

interface PinnedReleasesProps {
    items: SanityGameRelease[];
    showAdminControls?: boolean; // Added Prop
}

export default function PinnedReleases({ items, showAdminControls = false }: PinnedReleasesProps) {
    if (items.length === 0) return null;

    return (
        <div className={styles.pinnedContainer}>
            <div className={styles.sectionHeader}>
                <div className={styles.pinIcon}><PinIcon /></div>
                <h2 className={styles.sectionTitle}>أهم الإصدارات</h2>
            </div>
            
            <motion.div 
                className={styles.pinnedGrid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {items.map((release) => (
                    <motion.div 
                        key={release._id} 
                        className={styles.pinnedItem}
                        variants={itemVariants}
                    >
                        {/* Pass showAdminControls down to TimelineCard */}
                        <TimelineCard 
                            release={release} 
                            autoHeight={true} 
                            showAdminControls={showAdminControls} 
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}


