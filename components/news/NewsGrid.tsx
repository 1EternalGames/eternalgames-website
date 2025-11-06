// components/news/NewsGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import NewsGridCard from './NewsGridCard';
import { CardProps } from '@/types';
import React from 'react'; 

const gridContainerVariants = {
    visible: { transition: { staggerChildren: 0.05 } },
    exit: {
        opacity: 0,
    }
};

const kineticCardVariant = {
    hidden: { 
        opacity: 0, 
        y: 60, 
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] as const,
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.8 
    }
};

export default function NewsGrid({ news, isLoading }: { news: CardProps[], isLoading: boolean }) {
    return (
        <motion.div 
            layout 
            className="content-grid" 
            variants={gridContainerVariants} 
            initial="hidden" 
            animate="visible"
            exit="exit"
            style={{ 
                opacity: isLoading && news.length === 0 ? 0.5 : 1, 
                transition: 'opacity 0.3s',
            }}
        >
            <AnimatePresence mode="popLayout">
                {news.map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        variants={kineticCardVariant}
                        transition={{ 
                            type: 'spring' as const, 
                            stiffness: 400, 
                            damping: 30, 
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