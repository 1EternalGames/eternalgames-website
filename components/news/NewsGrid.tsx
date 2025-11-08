// components/news/NewsGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import NewsGridCard from './NewsGridCard';
import { CardProps } from '@/types';
import React from 'react'; 
import styles from './NewsGrid.module.css';

export default function NewsGrid({ news }: { news: CardProps[] }) {
    return (
        <motion.div 
            layout 
            className={styles.newsGrid}
        >
            <AnimatePresence mode="popLayout">
                {news.map((item, index) => (
                    <motion.div
                        key={item.legacyId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                            type: 'spring' as const, 
                            stiffness: 400, 
                            damping: 30, 
                        }}
                        style={{ height: '100%', willChange: 'transform, opacity' }}
                    >
                        <NewsGridCard 
                            item={item} 
                            isPriority={index < 4}
                            layoutIdPrefix="news-grid"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}