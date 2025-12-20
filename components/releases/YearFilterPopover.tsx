// components/releases/YearFilterPopover.tsx
'use client';
import { motion } from 'framer-motion';
import styles from '@/components/filters/Filters.module.css';

const popoverVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -10, scale: 0.95 }, };

export default function YearFilterPopover({ 
    availableYears, 
    selectedYear, 
    onSelect, 
    onClose 
}: { 
    availableYears: number[], 
    selectedYear: number | 'TBA', 
    onSelect: (year: number | 'TBA') => void, 
    onClose: () => void 
}) {
  return (
    <motion.div 
        className={styles.filterPopover} 
        style={{ width: '180px', maxHeight: '300px' }} 
        variants={popoverVariants} 
        initial="hidden" 
        animate="visible" 
        exit="exit" 
        onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.popoverResultsList}>
        {/* ADD TBA OPTION */}
        <motion.button 
            className={`${styles.popoverItemButton} ${selectedYear === 'TBA' ? styles.selected : ''}`} 
            onClick={() => { onSelect('TBA'); onClose(); }}
        >
            يُعلن لاحقاً
        </motion.button>
        
        {availableYears.map(year => (
          <motion.button 
            key={year} 
            className={`${styles.popoverItemButton} ${selectedYear === year ? styles.selected : ''}`} 
            onClick={() => { onSelect(year); onClose(); }}
          >
            {year}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}


