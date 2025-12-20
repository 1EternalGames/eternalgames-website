// components/filters/ui/SelectedTagsButton.tsx
'use client';

import { motion } from 'framer-motion';
import styles from '../Filters.module.css';
import type { SanityTag } from '@/types/sanity';

interface SelectedTagsButtonProps {
    selectedTags: SanityTag[];
    onOpenPopover: () => void;
}

export default function SelectedTagsButton({ selectedTags, onOpenPopover }: SelectedTagsButtonProps) {
    const isActive = selectedTags.length > 0;
    const label = isActive ? `الوسوم (${selectedTags.length})` : "الوسوم";

    if (!isActive) {
        return (
            <button onClick={onOpenPopover} className={styles.filterButton}>
                {label}
            </button>
        );
    }
    
    return (
        <motion.button
            layout
            className={`${styles.filterButton} ${styles.active}`}
            onClick={onOpenPopover}
            whileHover={{ scale: 1.05 }}
        >
            <motion.div layoutId="tags-highlight" className={styles.filterHighlight} />
            <span style={{ zIndex: 1, position: 'relative' }}>{label}</span>
        </motion.button>
    );
}








