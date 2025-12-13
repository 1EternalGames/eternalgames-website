'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import Link from 'next/link';
import { CardProps } from '@/types';
import KineticGlyphs from '@/components/effects/KineticGlyphs';
import styles from './Feed.module.css';

const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

interface FeedProps {
    topSectionLabel: string;
    latestSectionLabel: string;
    topItems: CardProps[];
    latestItems?: CardProps[];
    viewAllLink?: string; // Made optional
    viewAllText: string;
    onViewAll?: () => void; // New prop for custom action
    topItemsContainerClassName?: string;
    renderTopItem: (item: CardProps, index: number) => React.ReactNode;
    renderListItem?: (item: CardProps, index: number) => React.ReactNode;
    listDividerClassName?: string;
    enableTopSectionHoverEffect?: boolean;
    latestSectionContent?: React.ReactNode;
    topSectionContent?: React.ReactNode;
}

const kineticCardVariant = {
    hidden: { 
        opacity: 0, 
        y: 50, 
        rotateX: -20
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] as const 
        }
    }
};

export default function Feed({
    topSectionLabel, latestSectionLabel, topItems, latestItems = [],
    viewAllLink, viewAllText, onViewAll, topItemsContainerClassName = '',
    renderTopItem, renderListItem, listDividerClassName = styles.listDivider,
    enableTopSectionHoverEffect = false, latestSectionContent, topSectionContent
}: FeedProps) {
    const [isTopSectionHovered, setIsTopSectionHovered] = useState(false);

    return (
        <div className={styles.feedContainer}>
            {topItems.length > 0 && (
                <div
                    className={styles.topSection}
                    onMouseEnter={() => { if (enableTopSectionHoverEffect) setIsTopSectionHovered(true); }}
                    onMouseLeave={() => { if (enableTopSectionHoverEffect) setIsTopSectionHovered(false); }}
                >
                    <AnimatePresence>{isTopSectionHovered && enableTopSectionHoverEffect && <KineticGlyphs />}</AnimatePresence>
                    <span className={styles.sectionLabel}>{topSectionLabel}</span>
                    <motion.div 
                        layout 
                        className={`${styles.topItemsContainer} ${topItemsContainerClassName}`} 
                        style={{ perspective: '800px' }}
                    >
                        {topSectionContent ? (
                            <motion.div variants={kineticCardVariant}>{topSectionContent}</motion.div>
                        ) : (
                            topItems.map((item, index) => (
                                <motion.div key={item.id} variants={kineticCardVariant} style={{ height: '100%' }}>
                                    {renderTopItem(item, index)}
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </div>
            )}

            <div className={styles.latestSection}>
                <span className={styles.sectionLabel} style={{ alignSelf: 'flex-start' }}>
                    <div className={styles.liveIndicator}></div>
                    <span>{latestSectionLabel}</span>
                </span>
                <motion.div className={styles.latestItemsList} variants={kineticCardVariant}>
                    {latestSectionContent ? (
                        latestSectionContent
                    ) : (
                        latestItems.map((item, index) => (
                            renderListItem && (
                                <React.Fragment key={item.id}>
                                    {renderListItem(item, index)}
                                    {index < latestItems.length - 1 && <div className={listDividerClassName} />}
                                </React.Fragment>
                            )
                        ))
                    )}
                </motion.div>
            </div>
            
            <motion.div variants={kineticCardVariant}>
                {onViewAll ? (
                    <button 
                        onClick={onViewAll} 
                        className={`${styles.viewAllLink} no-underline`}
                        style={{ width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 'inherit' }}
                    >
                         <ArrowIcon />
                         <span>{viewAllText}</span>
                    </button>
                ) : (
                    <Link href={viewAllLink || '#'} className={`${styles.viewAllLink} no-underline`} prefetch={false}>
                        <ArrowIcon />
                        <span>{viewAllText}</span>
                    </Link>
                )}
            </motion.div>
        </div>
    );
}