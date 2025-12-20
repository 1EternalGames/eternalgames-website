// components/HubFilters.tsx
'use client';

import { motion } from 'framer-motion';
import styles from './filters/Filters.module.css';

export type HubTypeFilter = 'all' | 'review' | 'article' | 'news';
export type HubSortOrder = 'latest' | 'viral';

const typeFilters: { label: string, value: HubTypeFilter }[] = [
    { label: 'الكل', value: 'all' },
    { label: 'مراجعات', value: 'review' },
    { label: 'مقالات', value: 'article' },
    { label: 'أخبار', value: 'news' },
];

const sortOrders: { label: string, value: HubSortOrder }[] = [
    { label: 'الأحدث', value: 'latest' },
    { label: 'الأكثر رواجًا', value: 'viral' },
];

interface HubFiltersProps {
    activeTypeFilter: HubTypeFilter;
    onTypeFilterChange: (filter: HubTypeFilter) => void;
    activeSort: HubSortOrder;
    onSortChange: (sort: HubSortOrder) => void;
}

export default function HubFilters({
    activeTypeFilter,
    onTypeFilterChange,
    activeSort,
    onSortChange
}: HubFiltersProps) {
    return (
        <div className={styles.filtersContainer} style={{ marginBottom: '3rem' }}>
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>نوع المحتوى:</span>
                <div className={styles.filterButtonsGroup}>
                    {typeFilters.map(filter => (
                        <motion.button
                            key={filter.value}
                            onClick={() => onTypeFilterChange(filter.value)}
                            className={`${styles.filterButton} ${activeTypeFilter === filter.value ? styles.active : ''}`}
                        >
                            {filter.label}
                            {activeTypeFilter === filter.value && <motion.div layoutId="hub-type-highlight" className={styles.filterHighlight} />}
                        </motion.button>
                    ))}
                </div>
            </div>
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>الفرز حسب:</span>
                <div className={styles.filterButtonsGroup}>
                    {sortOrders.map(sort => (
                        <motion.button
                            key={sort.value}
                            onClick={() => onSortChange(sort.value)}
                            className={`${styles.filterButton} ${activeSort === sort.value ? styles.active : ''}`}
                        >
                            {sort.label}
                            {activeSort === sort.value && <motion.div layoutId="hub-sort-highlight" className={styles.filterHighlight} />}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}








