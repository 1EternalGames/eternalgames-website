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
        <div className={`${styles.newsGrid} gpu-cull`}>
            <AnimatePresence mode="popLayout">
                {news.map((item, index) => (
                    <motion.div
                        key={item.legacyId}
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ zIndex: 50 }} 
                        transition={{ 
                            duration: 0.2
                        }}
                        style={{ 
                            height: '100%', 
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