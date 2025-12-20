// components/filters/GameFilterPopover.tsx
'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SanityGame } from '@/types/sanity';
import styles from './Filters.module.css';

const popoverVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, y: -10, scale: 0.95 }, };
const itemVariants = { hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } };

export default function GameFilterPopover({ allGames, selectedGame, onGameSelect, onClose }: { allGames: SanityGame[], selectedGame: SanityGame | null, onGameSelect: (game: SanityGame | null) => void, onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const results = useMemo(() => {
    if (searchTerm.trim() === '') {
        return allGames;
    }
    return allGames.filter(game => 
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allGames]);


  return (
    <motion.div className={styles.filterPopover} variants={popoverVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
      <input type="search" placeholder="ابحث عن لعبة..." className={styles.popoverSearchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
      <div className={styles.popoverResultsList}>
        {results.map((game, index) => (
          <motion.button 
            key={game._id} 
            variants={itemVariants}
            initial={index < 10 ? "hidden" : "visible"} // <-- THE FIX IS HERE
            animate="visible" // Ensure all items are driven to the 'visible' state
            className={`${styles.popoverItemButton} ${selectedGame?._id === game._id ? styles.selected : ''}`} 
            onClick={() => { onGameSelect(game); onClose(); }}
          >
            {game.title}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}


