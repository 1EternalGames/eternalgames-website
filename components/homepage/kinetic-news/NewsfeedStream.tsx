// components/homepage/kinetic-news/NewsfeedStream.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardProps } from '@/types';
import styles from './NewsfeedStream.module.css';
import NewsGridCard from '@/components/news/NewsGridCard';

interface NewsfeedStreamProps {
    items: CardProps[];
    isExpanded?: boolean;
}

export default function NewsfeedStream({ items, isExpanded = false }: NewsfeedStreamProps) {
    const [listItems, setListItems] = useState(items);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync state with props
    useEffect(() => {
        setListItems(items);
    }, [items]);

    // Auto-scroll logic (Active only when NOT expanded and NOT hovered)
    useEffect(() => {
        if (!isExpanded && !isHovered && listItems.length > 5) {
            intervalRef.current = setInterval(() => {
                setListItems((prevItems) => {
                    const newItems = [...prevItems];
                    const firstItem = newItems.shift();
                    if (firstItem) {
                        newItems.push(firstItem);
                    }
                    return newItems;
                });
            }, 3500);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovered, listItems.length, isExpanded]);

    // Display logic:
    // If expanded, show 15 items.
    // If collapsed, show top 5 items (which rotate).
    const displayItems = isExpanded ? items.slice(0, 15) : listItems.slice(0, 5);

    return (
        <div 
            className={styles.streamContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 
               Use LayoutGroup or AnimatePresence mode="popLayout" 
               popLayout is crucial for the stack effect when items leave the DOM 
            */}
            <AnimatePresence mode="popLayout" initial={false}>
                {displayItems.map((item) => (
                    <motion.div
                        key={item.legacyId}
                        layout // Animate layout changes for smooth reordering
                        className={styles.streamItemWrapper}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.3 } }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 120, // Smoother, less snap
                            damping: 20, 
                            mass: 1
                        }}
                    >
                        <NewsGridCard 
                            item={item} 
                            layoutIdPrefix="homepage-stream"
                            variant="mini"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}