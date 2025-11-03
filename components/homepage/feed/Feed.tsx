// components/homepage/feed/Feed.tsx
'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { CardProps } from '@/types';
import KineticGlyphs from '@/components/effects/KineticGlyphs';
import styles from './Feed.module.css';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 20 } } };
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><polyline points="15 18 9 12 15 6"></polyline></svg>;

interface FeedProps {
    topSectionLabel: string;
    latestSectionLabel: string;
    topItems: CardProps[];
    latestItems?: CardProps[]; // Made optional
    viewAllLink: string;
    viewAllText: string;
    topItemsContainerClassName?: string;
    renderTopItem: (item: CardProps, index: number) => React.ReactNode;
    renderListItem?: (item: CardProps, index: number) => React.ReactNode; // Made optional
    listDividerClassName?: string;
    enableTopSectionHoverEffect?: boolean;
    latestSectionContent?: React.ReactNode; // New prop
    topSectionContent?: React.ReactNode; // New prop for top section
}

export default function Feed({
    topSectionLabel, latestSectionLabel, topItems, latestItems = [],
    viewAllLink, viewAllText, topItemsContainerClassName = '',
    renderTopItem, renderListItem, listDividerClassName = styles.listDivider,
    enableTopSectionHoverEffect = false, latestSectionContent, topSectionContent
}: FeedProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    const [isTopSectionHovered, setIsTopSectionHovered] = useState(false);

    return (
        <motion.div ref={ref} className={styles.feedContainer} variants={containerVariants} initial="hidden" animate={isInView ? "visible" : "hidden"}>
            {topItems.length > 0 && (
                <motion.div
                    variants={itemVariants}
                    className={styles.topSection}
                    onMouseEnter={() => { if (enableTopSectionHoverEffect) setIsTopSectionHovered(true); }}
                    onMouseLeave={() => { if (enableTopSectionHoverEffect) setIsTopSectionHovered(false); }}
                >
                    <AnimatePresence>{isTopSectionHovered && enableTopSectionHoverEffect && <KineticGlyphs />}</AnimatePresence>
                    <span className={styles.sectionLabel}>{topSectionLabel}</span>
                    <div className={`${styles.topItemsContainer} ${topItemsContainerClassName}`}>
                        {topSectionContent ? topSectionContent : topItems.map((item, index) => renderTopItem(item, index))}
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants} className={styles.latestSection}>
                <span className={styles.sectionLabel} style={{ alignSelf: 'flex-start' }}>
                    <div className={styles.liveIndicator}></div>
                    <span>{latestSectionLabel}</span>
                </span>
                <div className={styles.latestItemsList}>
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
                </div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
                <Link href={viewAllLink} className={`${styles.viewAllLink} no-underline`}>
                    <span>{viewAllText}</span>
                    <ArrowIcon />
                </Link>
            </motion.div>
        </motion.div>
    );
}


