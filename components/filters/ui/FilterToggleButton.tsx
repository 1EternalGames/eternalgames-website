// components/filters/ui/FilterToggleButton.tsx
'use client';

import { motion } from 'framer-motion';
import { FilterHorizontalIcon } from '@/components/icons';
import styles from '../Filters.module.css';

export default function FilterToggleButton({ onClick, hasActiveFilters }: { onClick: () => void, hasActiveFilters: boolean }) {
    return (
        <motion.button
            onClick={onClick}
            className={`${styles.filterButton} ${hasActiveFilters ? styles.active : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, zIndex: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span style={{ zIndex: 1, position: 'relative' }}>الفلاتر</span>
            <FilterHorizontalIcon height={20} width={20} />
        </motion.button>
    );
}


