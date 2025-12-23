// components/filters/ui/SelectedGameButton.tsx
'use client';

import { motion } from 'framer-motion';
import styles from '../Filters.module.css';
import type { SanityGame } from '@/types/sanity';

interface SelectedGameButtonProps {
    selectedGame: SanityGame | null;
    onClearGame: (game: null) => void;
    onOpenPopover: () => void;
}

export default function SelectedGameButton({ selectedGame, onClearGame, onOpenPopover }: SelectedGameButtonProps) {
    if (!selectedGame) {
        return (
            <button onClick={onOpenPopover} className={styles.filterButton}>
                اللعبة
            </button>
        );
    }
    
    return (
        <motion.div layout className={`${styles.filterButton} ${styles.gameSelectedButton} ${styles.active}`} onClick={onOpenPopover}>
            <motion.div layoutId="game-filter-highlight" className={styles.filterHighlight} />
            <span style={{ zIndex: 1, position: 'relative', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: '1.5rem' }}>
                {selectedGame.title}
            </span>
            {/* FIX: Changed button to motion.button to support whileTap */}
            <motion.button 
                className={styles.gameClearButton}
                onClick={(e) => {
                    e.stopPropagation(); 
                    onClearGame(null);
                }}
                whileTap={{ scale: 0.9 }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </motion.button>
        </motion.div>
    );
}