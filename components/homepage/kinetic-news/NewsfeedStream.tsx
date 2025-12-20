// components/homepage/kinetic-news/NewsfeedStream.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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
    
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.1 });

    useEffect(() => {
        setListItems(items);
    }, [items]);

    useEffect(() => {
        // Only scroll if: Not expanded, Not hovered, and IS in view
        // Reverted to 5
        if (!isExpanded && !isHovered && isInView && listItems.length > 5) {
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
    }, [isHovered, listItems.length, isExpanded, isInView]);

    const displayItems = useMemo(() => 
        // Reverted to 5
        isExpanded ? items.slice(0, 15) : listItems.slice(0, 5),
    [isExpanded, items, listItems]);

    return (
        <div 
            ref={containerRef}
            className={styles.streamContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ minHeight: isExpanded ? 'auto' : '400px' }}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {displayItems.map((item) => (
                    <motion.div
                        key={item.legacyId}
                        layout 
                        className={styles.streamItemWrapper}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 120, 
                            damping: 25, 
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


