// components/PaginatedCarousel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import styles from './PaginatedCarousel.module.css'; // <-- IMPORT MODULE

type PaginatedCarouselProps = {
    items: any[];
    itemsPerPage: number;
    layoutIdPrefix: string;
};

export default function PaginatedCarousel({ items, itemsPerPage, layoutIdPrefix }: PaginatedCarouselProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const resetTimeout = () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); } };

    useEffect(() => {
        resetTimeout();
        if (!isHovered) {
            timeoutRef.current = setTimeout( () => setCurrentPage((prevPage) => (prevPage + 1) % totalPages), 5000 );
        }
        return () => resetTimeout();
    }, [currentPage, isHovered, totalPages]);

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return (
        <div className={styles.paginatedCarouselContainer} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div className={styles.paginatedCarouselContent}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        className={styles.twoColumnGrid} // <-- APPLIED NEW CLASS
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {currentItems.map((item) => (
                            <ArticleCard key={item.id} article={item} layoutIdPrefix={layoutIdPrefix} disableLivingEffect={true} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className={styles.paginationControls}>
                {Array.from({ length: totalPages }).map((_, index) => (
                    <motion.button
                        key={index}
                        className={`${styles.paginationDot} ${currentPage === index ? styles.active : ''}`}
                        onClick={() => setCurrentPage(index)}
                        aria-label={`Go to page ${index + 1}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                    />
                ))}
            </div>
        </div>
    );
}