// components/filters/TagFilterPopover.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SanityTag } from '@/types/sanity';
import { translateTag } from '@/lib/translations'; // Import the translator
import styles from './Filters.module.css';

const popoverVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -10, scale: 0.95 }, };

export default function TagFilterPopover({ allTags, selectedTags, onTagToggle }: { allTags: SanityTag[], selectedTags: SanityTag[], onTagToggle: (tag: SanityTag) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedTagIds = new Set(selectedTags.map(t => t._id));

  // DEFINITIVE FIX: Search both the original English title and the translated Arabic title.
  const filteredTags = allTags.filter(tag => 
    tag.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    translateTag(tag.title).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div className={styles.filterPopover} variants={popoverVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
      <input type="search" placeholder="ابحث عن وسم..." className={styles.popoverSearchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
      <div className={styles.popoverResultsList}>
        {filteredTags.map(tag => (
          <motion.button key={tag._id} className={`${styles.popoverItemButton} ${selectedTagIds.has(tag._id) ? styles.selected : ''}`} onClick={() => onTagToggle(tag)}>
            {translateTag(tag.title)}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}








