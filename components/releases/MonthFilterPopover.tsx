// components/releases/MonthFilterPopover.tsx
'use client';
import { motion } from 'framer-motion';
import styles from '@/components/filters/Filters.module.css';

const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const popoverVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -10, scale: 0.95 }, };

export default function MonthFilterPopover({ 
    selectedMonth, 
    onSelect, 
    onClose 
}: { 
    selectedMonth: number | 'all', 
    onSelect: (month: number | 'all') => void, 
    onClose: () => void 
}) {
  return (
    <motion.div 
        className={styles.filterPopover} 
        style={{ width: '200px', maxHeight: '400px' }} 
        variants={popoverVariants} 
        initial="hidden" 
        animate="visible" 
        exit="exit" 
        onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.popoverResultsList}>
        <motion.button 
            className={`${styles.popoverItemButton} ${selectedMonth === 'all' ? styles.selected : ''}`} 
            onClick={() => { onSelect('all'); onClose(); }}
        >
            الكل
        </motion.button>
        {ARABIC_MONTHS.map((month, idx) => (
          <motion.button 
            key={idx} 
            className={`${styles.popoverItemButton} ${selectedMonth === idx ? styles.selected : ''}`} 
            onClick={() => { onSelect(idx); onClose(); }}
          >
            {month}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}