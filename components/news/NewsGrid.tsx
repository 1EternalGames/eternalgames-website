// components/news/NewsGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import NewsGridCard from './NewsGridCard';
import { CardProps } from '@/types';
import React from 'react'; 
import styles from './NewsGrid.module.css';
import { useActiveCardStore } from '@/lib/activeCardStore';

export default function NewsGrid({ news }: { news: CardProps[] }) {
    const { activeCardId } = useActiveCardStore();

    return (
        // OPTIMIZATION: Removed 'layout' prop.
        // This prevents Framer Motion from calculating layout shifts for the entire grid
        // whenever an item changes state. This massively improves scrolling performance.
        <div className={`${styles.newsGrid} gpu-cull`}>
            <AnimatePresence mode="popLayout">
                {news.map((item, index) => (
                    <motion.div
                        key={item.legacyId}
                        // OPTIMIZATION: Removed 'layout' prop here too.
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ zIndex: 50 }} 
                        transition={{ 
                            type: 'spring' as const, 
                            stiffness: 400, 
                            damping: 30, 
                        }}
                        style={{ 
                            height: '100%', 
                            // Only use will-change for specific properties, not layout
                            willChange: 'transform, opacity',
                            zIndex: activeCardId === item.id ? 100 : 1
                        }}
                    >
                        <NewsGridCard 
                            item={item} 
                            isPriority={index < 4}
                            layoutIdPrefix="news-grid"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}