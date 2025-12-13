// components/PaginatedCarousel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardProps } from '@/types';
import styles from './PaginatedCarousel.module.css';
import NewsGridCard from '@/components/news/NewsGridCard';

type PaginatedCarouselProps = {
    items: CardProps[];
    itemsPerPage?: number;
};

export default function PaginatedCarousel({ items, itemsPerPage = 3 }: PaginatedCarouselProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const resetTimeout = () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); } };

    useEffect(() => {
        resetTimeout();
        if (!isHovered && totalPages > 1) {
            // Increased from 3500 to 3800ms
            timeoutRef.current = setTimeout(
                () => setCurrentPage((prevPage) => (prevPage + 1) % totalPages),
                3800
            );
        }
        return () => resetTimeout();
    }, [currentPage, isHovered, totalPages]);

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    
    const hoverHandlers = isMobile ? {} : {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
    };

    return (
        <div 
            className={styles.paginatedContainer}
            {...hoverHandlers}
        >
            <div className={styles.paginatedContent}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        // ENTER: Faded and shifted left
                        initial={{ opacity: 0, x: -50 }}
                        // CENTER: Fully visible
                        animate={{ opacity: 1, x: 0 }}
                        // EXIT: Fade out moving right
                        exit={{ opacity: 0, x: 50 }} 
                        // Consistent easing for both opacity and transform
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={styles.itemList}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        {currentItems.map((item, index) => (
                            <motion.div
                                key={item.legacyId}
                                style={{ height: 'auto', position: 'relative', zIndex: 1 }}
                                whileHover={{ zIndex: 20 }}
                            >
                                <NewsGridCard 
                                    item={item} 
                                    layoutIdPrefix="homepage-latest-articles"
                                    variant="compact"
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
            {totalPages > 1 && (
                <div className={styles.paginationControls}>
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.paginationDot} ${currentPage === index ? styles.active : ''}`}
                            onClick={() => setCurrentPage(index)}
                            aria-label={`Go to page ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}