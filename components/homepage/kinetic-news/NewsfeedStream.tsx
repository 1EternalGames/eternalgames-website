// components/homepage/kinetic-news/NewsfeedStream.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CardProps } from '@/types';
import { Calendar03Icon } from '@/components/icons/index';
import styles from './NewsfeedStream.module.css';
import feedStyles from '../feed/Feed.module.css';

const LatestNewsListItem = memo(({ item }: { item: CardProps }) => (
    <Link href={`/news/${item.slug}`} className={`${feedStyles.newsListItem} no-underline`}>
        <div className={feedStyles.newsListThumbnail}>
            <Image 
                src={item.imageUrl} 
                alt={item.title} 
                fill 
                sizes="60px" 
                placeholder="blur" 
                blurDataURL={item.blurDataURL} 
                style={{ objectFit: 'cover' }} 
            />
        </div>
        <div className={feedStyles.newsListInfo}>
            <p className={feedStyles.newsListCategory}>{item.category}</p>
            <h5 className={feedStyles.newsListTitle}>{item.title}</h5>
            {item.date && (
                <div style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar03Icon style={{width: '14px', height: '14px', color: 'var(--accent)'}} />
                    <span>{item.date.split(' - ')[0]}</span>
                </div>
            )}
        </div>
    </Link>
));
LatestNewsListItem.displayName = "LatestNewsListItem";

export default function NewsfeedStream({ items }: { items: CardProps[] }) {
    const [listItems, setListItems] = useState(items);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isHovered && items.length > 5) { // Only cycle if there are enough items
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
            className={styles.streamContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false}>
                {listItems.slice(0, 5).map((item, index) => ( // Display a fixed number of items
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


