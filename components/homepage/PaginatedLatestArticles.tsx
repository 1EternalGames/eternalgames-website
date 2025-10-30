// components/homepage/PaginatedLatestArticles.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CardProps } from '@/types';
import CreatorCredit from '@/components/CreatorCredit';
import styles from './PaginatedLatestArticles.module.css';
import feedStyles from './feed/Feed.module.css';

// Re-defining the list item here to keep it co-located with the carousel that uses it.
const LatestArticleListItem = memo(({ article }: { article: CardProps }) => {
    return (
        <Link href={`/articles/${article.slug}`} className={`${feedStyles.latestArticleItem} no-underline`}>
            <div className={feedStyles.latestArticleThumbnail}>
                <Image 
                    src={article.imageUrl} 
                    alt={article.title} 
                    fill 
                    sizes="120px" 
                    placeholder="blur" 
                    blurDataURL={article.blurDataURL} 
                    style={{ objectFit: 'cover' }} 
                />
            </div>
            <div className={feedStyles.latestArticleInfo}>
                <h4 className={feedStyles.latestArticleTitle}>{article.title}</h4>
                <div className={feedStyles.latestArticleMeta}>
                    <CreatorCredit label="بقلم" creators={article.authors} />
                </div>
            </div>
        </Link>
    );
});
LatestArticleListItem.displayName = "LatestArticleListItem";

type PaginatedLatestArticlesProps = {
    items: CardProps[];
    itemsPerPage?: number;
};

export default function PaginatedLatestArticles({ items, itemsPerPage = 3 }: PaginatedLatestArticlesProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const resetTimeout = () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); } };

    useEffect(() => {
        resetTimeout();
        if (!isHovered && totalPages > 1) {
            timeoutRef.current = setTimeout(
                () => setCurrentPage((prevPage) => (prevPage + 1) % totalPages),
                5000
            );
        }
        return () => resetTimeout();
    }, [currentPage, isHovered, totalPages]);

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return (
        <div 
            className={styles.paginatedContainer}
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={styles.paginatedContent}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className={styles.itemList}
                    >
                        {currentItems.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <LatestArticleListItem article={item} />
                                {index < currentItems.length - 1 && <div className={feedStyles.listDivider} />}
                            </React.Fragment>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
            {totalPages > 1 && (
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
            )}
        </div>
    );
}