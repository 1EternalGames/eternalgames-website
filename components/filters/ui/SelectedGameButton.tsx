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
            <button onClick={onOpenPopover} className={styles.filterButton}>اللعبة</button>
        );
    }

    // The root element is now a simple motion.div with the layout prop to prevent flickering.
    return (
        <motion.div layout className={`${styles.filterButton} ${styles.gameSelectedButton} ${styles.active}`} onClick={onOpenPopover}>
            {/* The animated highlight is now self-contained for consistency */}
            <motion.div layoutId="game-highlight" className={styles.filterHighlight} />
            <span style={{ marginRight: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 1, position: 'relative' }}>
                {selectedGame.title}
            </span>
            <motion.button
                className={styles.gameClearButton}
                onClick={(e) => {
                    e.stopPropagation();
                    onClearGame(null);
                }}
                whileTap={{ scale: 0.9 }}
            >
                {/* The SVG is now correctly styled to be visible against the cyan background */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </motion.button>
        </motion.div>
    );
}











