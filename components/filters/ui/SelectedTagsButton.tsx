// components/filters/ui/SelectedTagsButton.tsx
'use client';

import { motion } from 'framer-motion';
import styles from '../Filters.module.css';
import type { SanityTag } from '@/types/sanity';
import { translateTag } from '@/lib/translations';

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
        <motion.div
            layout
            className={`${styles.filterButton} ${styles.active}`}
            onClick={onOpenPopover}
        >
            <motion.div layoutId="tags-filter-highlight" className={styles.filterHighlight} />
            <span style={{ zIndex: 1, position: 'relative' }}>{label}</span>
        </motion.div>
    );
}