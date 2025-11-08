// components/ui/ScrollToTopButton.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useScrolled } from '@/hooks/useScrolled';
import styles from './ScrollToTopButton.module.css';

const ArrowUpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);

export default function ScrollToTopButton() {
    const isScrolled = useScrolled(400); // Show button after scrolling 400px

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isScrolled && (
                <motion.button
                    className={styles.scrollToTopButton}
                    onClick={scrollToTop}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Scroll to top"
                >
                    <ArrowUpIcon />
                </motion.button>
            )}
        </AnimatePresence>
    );
}