// components/PaginatedCarousel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { CardProps } from '@/types';
import styles from './PaginatedCarousel.module.css';
import NewsGridCard from '@/components/news/NewsGridCard';
import { useActiveCardStore } from '@/lib/activeCardStore';

type PaginatedCarouselProps = {
    items: CardProps[];
    itemsPerPage?: number;
};

export default function PaginatedCarousel({ items, itemsPerPage = 5 }: PaginatedCarouselProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    const { activeCardId } = useActiveCardStore();

    // Intersection observer to prevent flipping when not visible
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.1 });

    const resetTimeout = () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); } };

    useEffect(() => {
        resetTimeout();
        // Only flip if: Not hovered, IS in view, and has more than 1 page
        if (!isHovered && isInView && totalPages > 1) {
            timeoutRef.current = setTimeout(
                () => setCurrentPage((prevPage) => (prevPage + 1) % totalPages),
                3800
            );
        }
        return () => resetTimeout();
    }, [currentPage, isHovered, totalPages, isInView]);

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    
    const interactionHandlers = {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        onTouchStart: () => setIsHovered(true),
        onTouchEnd: () => setIsHovered(false),
        onTouchCancel: () => setIsHovered(false),
    };

    return (
        <div 
            ref={containerRef}
            className={styles.paginatedContainer}
            {...interactionHandlers}
        >
            <div className={styles.paginatedContent}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }} 
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={styles.itemList}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        {currentItems.map((item) => (
                            <motion.div
                                key={item.legacyId}
                                style={{ 
                                    height: 'auto', 
                                    position: 'relative', 
                                    zIndex: activeCardId === item.id ? 100 : 1 
                                }}
                                whileHover={{ zIndex: 100 }}
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