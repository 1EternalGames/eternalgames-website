// components/filters/ui/PopoverTriggerButton.tsx
'use client';

import { motion } from 'framer-motion';
import styles from '../Filters.module.css';

interface PopoverTriggerButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    className?: string;
    layoutId?: string; // Prop is now used to pass a UNIQUE ID
}

export default function PopoverTriggerButton({ label, isActive, onClick, className = '', layoutId }: PopoverTriggerButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            className={`${styles.filterButton} ${isActive ? styles.active : ''} ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* The highlight is only rendered if a layoutId is provided */}
            {isActive && layoutId && <motion.div layoutId={layoutId} className={styles.filterHighlight} />}
            <span style={{ zIndex: 1, position: 'relative' }}>{label}</span>
        </motion.button>
    );
}











