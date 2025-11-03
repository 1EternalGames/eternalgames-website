// components/homepage/PaginatedLatestArticles.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CardProps } from '@/types';
import CreatorCredit from '@/components/CreatorCredit';
import { Calendar03Icon } from '@/components/icons/index';
import styles from './PaginatedLatestArticles.module.css';
import feedStyles from './feed/Feed.module.css';

const LatestArticleListItem = memo(({ article }: { article: CardProps }) => {
    // This component is the source of the hydration error.
    // The main container is now a <div> instead of a <Link>.
    // The image and title are wrapped in their own separate <Link>s.
    // This resolves the nested <a> tag issue caused by CreatorCredit rendering its own link.
    return (
        <div className={feedStyles.latestArticleItem}>
            <Link href={`/articles/${article.slug}`} className="no-underline" style={{ display: 'block' }}>
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
            </Link>
            <div className={feedStyles.latestArticleInfo}>
                <Link href={`/articles/${article.slug}`} className="no-underline">
                    <h4 className={feedStyles.latestArticleTitle}>{article.title}</h4>
                </Link>
                <div className={feedStyles.latestArticleMeta}>
                    <CreatorCredit label="بقلم" creators={article.authors} />
                    {article.date && (
                        <div className={feedStyles.latestArticleDate}>
                            <Calendar03Icon style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
                            <span>{article.date}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
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


