// components/filters/ui/FilterGroup.tsx
import React from 'react';
import styles from '../Filters.module.css';

interface FilterGroupProps {
    label?: string;
    children: React.ReactNode;
}

export default function FilterGroup({ label, children }: FilterGroupProps) {
    return (
        <div className={styles.filterGroup}>
            {label && <span className={styles.filterLabel}>{label}</span>}
            <div className={styles.filterButtonsGroup}>
                {children}
            </div>
        </div>
    );
}