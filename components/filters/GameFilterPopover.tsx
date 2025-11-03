// components/filters/GameFilterPopover.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { searchGamesAction } from '@/app/studio/actions';
import type { SanityGame } from '@/types/sanity';
import styles from './Filters.module.css';

const popoverVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, y: -10, scale: 0.95 }, };
const itemVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } };

export default function GameFilterPopover({ allGames, selectedGame, onGameSelect, onClose }: { allGames: SanityGame[], selectedGame: SanityGame | null, onGameSelect: (game: SanityGame | null) => void, onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<(SanityGame | { _id: string; title: string; })[]>(allGames);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  useEffect(() => {
    if (debouncedSearchTerm.length > 1) {
      searchGamesAction(debouncedSearchTerm).then(setResults);
    } else {
      setResults(allGames);
    }
  }, [debouncedSearchTerm, allGames]);

  return (
    <motion.div className={styles.filterPopover} variants={popoverVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
      <input type="search" placeholder="Search for a game..." className={styles.popoverSearchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
      <div className={styles.popoverResultsList}>
        {results.map(game => (
          <motion.button key={game._id} variants={itemVariants} className={`${styles.popoverItemButton} ${selectedGame?._id === game._id ? styles.selected : ''}`} onClick={() => { onGameSelect(game as SanityGame); onClose(); }}>
            {game.title}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}


