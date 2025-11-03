// components/homepage/kinetic-news/KineticSpotlightNews.tsx
'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CardProps } from '@/types';
import { Calendar03Icon } from '@/components/icons/index';
import styles from './KineticSpotlightNews.module.css';
import feedStyles from '../feed/Feed.module.css';

const PinnedNewsCard = memo(({ item, isActive }: { item: CardProps, isActive: boolean }) => (
    <Link href={`/news/${item.slug}`} className={`${feedStyles.pinnedNewsItem} ${styles.spotlightItem} no-underline`}>
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
        <div className={feedStyles.pinnedNewsThumbnail}>
            <Image 
                src={item.imageUrl} 
                alt={item.title} 
                fill 
                sizes="80px" 
                placeholder="blur" 
                blurDataURL={item.blurDataURL} 
                style={{ objectFit: 'cover' }} 
            />
        </div>
        <div className={feedStyles.pinnedNewsInfo}>
            <h4 className={feedStyles.pinnedNewsTitle}>{item.title}</h4>
            {item.date && (
                <div className={feedStyles.pinnedNewsDate}>
                    <Calendar03Icon style={{width: '14px', height: '14px', color: 'var(--accent)'}} />
                    <span>{item.date.split(' - ')[0]}</span>
                </div>
            )}
            <p className={feedStyles.pinnedNewsCategory}>{item.category}</p>
        </div>
    </Link>
));
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


