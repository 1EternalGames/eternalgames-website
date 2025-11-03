// components/news/NewsGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import NewsGridCard from './NewsGridCard';
import { CardProps } from '@/types';
import React from 'react'; 

const gridContainerVariants = {
    visible: { transition: { staggerChildren: 0.05 } },
};

export default function NewsGrid({ news, isLoading }: { news: CardProps[], isLoading: boolean }) {
    // NOTE: This component is purely for presentation.
    // The incoming 'news' array is assumed to be correctly filtered and sorted
    // by the parent NewsPageClient component. All sorting logic has been removed from here.

    return (
        <motion.div 
            layout 
            className="content-grid" 
            variants={gridContainerVariants} 
            initial="hidden" 
            animate="visible"
            style={{ 
                opacity: isLoading && news.length === 0 ? 0.5 : 1, 
                transition: 'opacity 0.3s'
            }}
        >
            <AnimatePresence mode="popLayout">
                {news.map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 150, 
                            damping: 20, 
                            duration: 0.5 
                        }}
                        style={{ height: '100%', willChange: 'transform, opacity' }}
                    >
                        <NewsGridCard item={item} isPriority={index < 3} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}


