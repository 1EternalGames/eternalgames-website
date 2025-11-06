// components/homepage/kinetic-news/NewsfeedStream.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardProps } from '@/types';
import { Calendar03Icon } from '@/components/icons/index';
import { translateTag } from '@/lib/translations';
import styles from './NewsfeedStream.module.css';
import feedStyles from '../feed/Feed.module.css';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import Image from 'next/image';

const LatestNewsListItem = memo(({ item }: { item: CardProps }) => {
    const primaryTag = item.tags && item.tags.length > 0 ? translateTag(item.tags[0].title) : 'أخبار';
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = "homepage-news-stream";
    
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(`/news/${item.slug}`, { scroll: false });
    };

    return (
        <motion.div 
            layoutId={`${layoutIdPrefix}-card-container-${item.legacyId}`}
            onClick={handleClick}
            className={`${feedStyles.newsListItem} no-underline`}
        >
            <motion.div layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`} className={feedStyles.newsListThumbnail}>
                <Image 
                    src={item.imageUrl} 
                    alt={item.title} 
                    fill 
                    sizes="60px" 
                    placeholder="blur" 
                    blurDataURL={item.blurDataURL} 
                    style={{ objectFit: 'cover' }} 
                />
            </motion.div>
            <div className={feedStyles.newsListInfo}>
                <p className={feedStyles.newsListCategory}>{primaryTag}</p>
                <motion.h5 layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`} className={feedStyles.newsListTitle}>{item.title}</motion.h5>
                {item.date && (
                    <div style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar03Icon style={{width: '14px', height: '14px', color: 'var(--accent)'}} />
                        <span>{item.date.split(' - ')[0]}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
});
LatestNewsListItem.displayName = "LatestNewsListItem";

export default function NewsfeedStream({ items }: { items: CardProps[] }) {
    const [listItems, setListItems] = useState(items);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isHovered && items.length > 5) {
            intervalRef.current = setInterval(() => {
                setListItems(prevItems => {
                    const newItems = [...prevItems];
                    const firstItem = newItems.shift();
                    if (firstItem) {
                        newItems.push(firstItem);
                    }
                    return newItems;
                });
            }, 3000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isHovered, items.length]);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false}>
                {listItems.slice(0, 5).map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                    >
                        <LatestNewsListItem item={item} />
                        {index < 4 && <div className={feedStyles.newsListDivider} />}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}