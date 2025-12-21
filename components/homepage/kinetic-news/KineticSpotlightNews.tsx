// components/homepage/kinetic-news/KineticSpotlightNews.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardProps } from '@/types';
import styles from './KineticSpotlightNews.module.css';
import NewsGridCard from '@/components/news/NewsGridCard';

export default function KineticSpotlightNews({ items }: { items: CardProps[] }) {
    if (!items || items.length === 0) return null;

    return (
        <div className={`${styles.spotlightGrid} gpu-cull`}>
            {items.map((item, index) => (
                <motion.div
                    key={item.legacyId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                    <NewsGridCard 
                        item={item} 
                        isPriority={index === 0} 
                        layoutIdPrefix="homepage-spotlight"
                        variant="compact" // Changed from default to compact
                    />
                </motion.div>
            ))}
        </div>
    );
}