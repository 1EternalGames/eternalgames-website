// components/filters/ScoreFilterPopover.tsx
'use client';
import { motion } from 'framer-motion';
import styles from './Filters.module.css';

export type ScoreFilter = 'All' | '9-10' | '8-8.9' | '7-7.9' | '<7';
const scoreFilters: { label: string; value: ScoreFilter }[] = [
    { label: 'كل التقييمات', value: 'All' },
    { label: 'تحفة فنية (9-10)', value: '9-10' },
    { label: 'رائعة (8-8.9)', value: '8-8.9' },
    { label: 'جيدة (7-7.9)', value: '7-7.9' },
    { label: 'متفاوتة (<7)', value: '<7' },
];
const popoverVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, y: -10, scale: 0.95 }, };
const itemVariants = { hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } }; // RTL: from right

export default function ScoreFilterPopover({ selectedScoreRange, onScoreSelect, onClose }: { selectedScoreRange: ScoreFilter, onScoreSelect: (score: ScoreFilter) => void, onClose: () => void }) {
  return (
    <motion.div className={styles.filterPopover} style={{ width: '220px' }} variants={popoverVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
      <div className={styles.popoverResultsList}>
        {scoreFilters.map(filter => (
          <motion.button key={filter.value} variants={itemVariants} className={`${styles.popoverItemButton} ${selectedScoreRange === filter.value ? styles.selected : ''}`} onClick={() => { onScoreSelect(filter.value); onClose(); }}>
            {filter.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}





