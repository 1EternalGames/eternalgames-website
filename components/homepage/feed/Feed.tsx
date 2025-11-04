'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import Link from 'next/link';
import { CardProps } from '@/types';
import KineticGlyphs from '@/components/effects/KineticGlyphs';
import styles from './Feed.module.css';

const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><polyline points="15 18 9 12 15 6"></polyline></svg>;

interface FeedProps {
    topSectionLabel: string;
    latestSectionLabel: string;
    topItems: CardProps[];
    latestItems?: CardProps[];
    viewAllLink: string;
    viewAllText: string;
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
        rotateX: -20,
        clipPath: "inset(100% 0% 0% 0%)"
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] as const 
        }
    }
};

export default function Feed({
    topSectionLabel, latestSectionLabel, topItems, latestItems = [],
    viewAllLink, viewAllText, topItemsContainerClassName = '',
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
                    <div className={`${styles.topItemsContainer} ${topItemsContainerClassName}`} style={{ perspective: '800px' }}>
                        {topSectionContent ? (
                            <motion.div variants={kineticCardVariant}>{topSectionContent}</motion.div>
                        ) : (
                            topItems.map((item, index) => (
                                <motion.div key={item.id} variants={kineticCardVariant}>
                                    {renderTopItem(item, index)}
                                </motion.div>
                            ))
                        )}
                    </div>
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
                <Link href={viewAllLink} className={`${styles.viewAllLink} no-underline`}>
                    <span>{viewAllText}</span>
                    <ArrowIcon />
                </Link>
            </motion.div>
        </div>
    );
}