// components/homepage/kinetic-news/KineticSpotlightNews.tsx
'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CardProps } from '@/types';
import { Calendar03Icon } from '@/components/icons/index';
import { translateTag } from '@/lib/translations';
import styles from './KineticSpotlightNews.module.css';
import feedStyles from '../feed/Feed.module.css';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

const PinnedNewsCard = memo(({ item, isActive }: { item: CardProps, isActive: boolean }) => {
    const primaryTag = item.tags && item.tags.length > 0 ? translateTag(item.tags[0].title) : 'أخبار';
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = "homepage-pinned-news";
    const linkPath = `/news/${item.slug}`;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.ctrlKey || e.metaKey) return; // Allow new tab
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    return (
        <motion.a
            href={linkPath}
            onClick={handleClick}
            layoutId={`${layoutIdPrefix}-card-container-${item.legacyId}`}
            className={`${feedStyles.pinnedNewsItem} ${styles.spotlightItem} no-underline`}
        >
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        className={styles.kineticHighlightBar}
                        layoutId="kinetic-spotlight-highlight-bar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
            </AnimatePresence>
            <motion.div layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`} className={feedStyles.pinnedNewsThumbnail}>
                <Image 
                    src={item.imageUrl} 
                    alt={item.title} 
                    fill 
                    sizes="80px" 
                    placeholder="blur" 
                    blurDataURL={item.blurDataURL} 
                    style={{ objectFit: 'cover' }} 
                />
            </motion.div>
            <div className={feedStyles.pinnedNewsInfo}>
                <motion.h4 layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`} className={feedStyles.pinnedNewsTitle}>{item.title}</motion.h4>
                {item.date && (
                    <div className={feedStyles.pinnedNewsDate}>
                        <Calendar03Icon style={{width: '14px', height: '14px', color: 'var(--accent)'}} />
                        <span>{item.date.split(' - ')[0]}</span>
                    </div>
                )}
                <p className={feedStyles.pinnedNewsCategory}>{primaryTag}</p>
            </div>
        </motion.a>
    );
});
PinnedNewsCard.displayName = 'PinnedNewsCard';

export default function KineticSpotlightNews({ items }: { items: CardProps[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered || items.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [isHovered, items.length]);

    return (
        <div 
            className={styles.spotlightContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {items.map((item, index) => (
                <React.Fragment key={item.id}>
                    <PinnedNewsCard item={item} isActive={activeIndex === index} />
                    {index < items.length - 1 && <div className={feedStyles.pinnedNewsDivider} />}
                </React.Fragment>
            ))}
        </div>
    );
}