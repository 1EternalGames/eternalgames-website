// components/homepage/kinetic-news/KineticSpotlightNews.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardProps } from '@/types';
import styles from './KineticSpotlightNews.module.css';
import NewsGridCard from '@/components/news/NewsGridCard';

interface KineticSpotlightNewsProps {
    items: CardProps[];
    layoutIdPrefix?: string; // Add prop
}

export default function KineticSpotlightNews({ items, layoutIdPrefix = "homepage-spotlight" }: KineticSpotlightNewsProps) {
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
                        // Use dynamic prefix + ID for uniqueness
                        layoutIdPrefix={`${layoutIdPrefix}-${item.legacyId}`}
                        variant="compact"
                    />
                </motion.div>
            ))}
        </div>
    );
}