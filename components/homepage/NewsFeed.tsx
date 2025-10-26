// components/homepage/NewsFeed.tsx
'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CardProps } from '@/types';
import KineticGlyphs from '@/components/effects/KineticGlyphs';
import styles from './NewsFeed.module.css';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.4 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } } };
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><polyline points="15 18 9 12 15 6"></polyline></svg>;

const HomepageNewsCard = ({ item }: { item: CardProps }) => {
    const router = useRouter();
    const handleClick = () => { router.push(`/news/${item.slug}`); };

    return (
        <div 
            className={styles.pinnedNewsItem}
            onClick={handleClick}
        >
            <div className={styles.pinnedNewsThumbnail}>
                <Image src={item.imageUrl} alt={item.title} fill sizes="80px" placeholder="blur" blurDataURL={item.blurDataURL} style={{ objectFit: 'cover' }} />
            </div>
            <div className={styles.pinnedNewsInfo}>
                <h4 className={styles.pinnedNewsTitle}>{item.title}</h4>
                {item.date && <p className={styles.pinnedNewsDate}>{item.date.split(' - ')[0]}</p>}
                <p className={styles.pinnedNewsCategory}>{item.category}</p>
            </div>
        </div>
    );
};

export default function NewsFeed({ pinnedNews, newsList }: { pinnedNews: CardProps[]; newsList: CardProps[]; }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    const [isPinnedSectionHovered, setIsPinnedSectionHovered] = useState(false);

    return (
        <motion.div ref={ref} className={styles.feedContainer} variants={containerVariants} initial="hidden" animate={isInView ? "visible" : "hidden"} >
            <motion.div 
                variants={itemVariants} 
                className={styles.pinnedNewsSection}
                onMouseEnter={() => setIsPinnedSectionHovered(true)}
                onMouseLeave={() => setIsPinnedSectionHovered(false)}
            >
                <AnimatePresence>{isPinnedSectionHovered && <KineticGlyphs />}</AnimatePresence>
                <span className={styles.sectionLabel} style={{alignSelf: 'flex-end'}}>الأكثر رواجًا</span>
                <div className={styles.pinnedNewsList}>
                    {pinnedNews.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <HomepageNewsCard item={item} />
                            {index < pinnedNews.length - 1 && <div className={styles.pinnedNewsDivider} />}
                        </React.Fragment>
                    ))}
                </div>
            </motion.div>
            <motion.div variants={itemVariants} className={styles.latestNewsHeader}>
                <span className={styles.sectionLabel} style={{alignSelf: 'flex-end'}}>
                    <div className={styles.liveIndicator}></div>
                    <span>الأحدث</span>
                </span>
            </motion.div>
            <motion.div variants={itemVariants} className={styles.newsList}>
                {newsList.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <Link href={`/news/${item.slug}`} className={`${styles.newsListItem} no-underline`}>
                            <div className={styles.newsListThumbnail}><Image src={item.imageUrl} alt={item.title} fill sizes="60px" placeholder="blur" blurDataURL={item.blurDataURL} style={{ objectFit: 'cover' }} /></div>
                            <div className={styles.newsListInfo}>
                                <p className={styles.newsListCategory}>{item.category}</p>
                                <h5 className={styles.newsListTitle}>{item.title}</h5>
                                {item.date && <p style={{margin: '0.25rem 0 0', fontSize: '1.2rem', color: 'var(--text-secondary)'}}>{item.date.split(' - ')[0]}</p>}
                            </div>
                        </Link>
                        {index < newsList.length - 1 && <div className={styles.listDivider} />}
                    </React.Fragment>
                ))}
            </motion.div>
            <motion.div variants={itemVariants}>
                <Link href="/news" className={`${styles.viewAllLink} no-underline`}>
                    <span>عرض كل الأخبار</span>
                    <ArrowIcon />
                </Link>
            </motion.div>
        </motion.div>
    );
}