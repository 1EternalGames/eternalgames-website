// components/homepage/PaginatedLatestArticles.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CardProps } from '@/types';
import CreatorCredit from '@/components/CreatorCredit';
import { Calendar03Icon } from '@/components/icons/index';
import styles from './PaginatedLatestArticles.module.css';
import feedStyles from './feed/Feed.module.css';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

const LatestArticleListItem = memo(({ article }: { article: CardProps }) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = "homepage-latest-articles";
    const linkPath = `/articles/${article.slug}`;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.ctrlKey || e.metaKey) return;
        if ((e.target as HTMLElement).closest('a[href^="/creators"]')) return;
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    return (
        <motion.a
            href={linkPath}
            onClick={handleClick}
            layoutId={`${layoutIdPrefix}-card-container-${article.legacyId}`} 
            className={`${feedStyles.latestArticleItem} no-underline`}
            style={{ display: 'grid' }}
        >
            <motion.div layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`} className={feedStyles.latestArticleThumbnail}>
                <Image 
                    src={article.imageUrl} 
                    alt={article.title} 
                    fill 
                    sizes="120px" 
                    placeholder="blur" 
                    blurDataURL={article.blurDataURL} 
                    style={{ objectFit: 'cover' }} 
                />
            </motion.div>
            <div className={feedStyles.latestArticleInfo}>
                <motion.h4 layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`} className={feedStyles.latestArticleTitle}>{article.title}</motion.h4>
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
        </motion.a>
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
                3500
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