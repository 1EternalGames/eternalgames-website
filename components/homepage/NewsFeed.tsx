// components/homepage/NewsFeed.tsx
'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CardProps } from '@/types';
import KineticGlyphs from '@/components/effects/KineticGlyphs';
import styles from './NewsFeed.module.css';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.4 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } } };
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><polyline points="15 18 9 12 15 6"></polyline></svg>;

const PinnedNewsItem = ({ item }: { item: CardProps }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <Link 
            href={`/news/${item.slug}`} 
            className={`${styles.pinnedNewsItem} no-underline`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence>{isHovered && <KineticGlyphs />}</AnimatePresence>
            <div className={styles.pinnedNewsThumbnail}><Image src={item.imageUrl} alt={item.title} fill sizes="80px" placeholder="blur" blurDataURL={item.blurDataURL} style={{ objectFit: 'cover' }} /></div>
            <div className={styles.pinnedNewsInfo}>
                <p className={styles.pinnedNewsCategory}>{item.category}</p>
                <h4 className={styles.pinnedNewsTitle}>{item.title}</h4>
            </div>
        </Link>
    );
};

export default function NewsFeed({ pinnedNews, newsList }: { pinnedNews: CardProps[]; newsList: CardProps[]; }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <motion.div ref={ref} className={styles.feedContainer} variants={containerVariants} initial="hidden" animate={isInView ? "visible" : "hidden"} >
            <motion.div variants={itemVariants} className={styles.pinnedNewsSection}>
                <span className={styles.sectionLabel} style={{alignSelf: 'flex-start'}}>الأكثر رواجًا</span>
                {pinnedNews.map(item => <PinnedNewsItem key={item.id} item={item} />)}
            </motion.div>
            <motion.div variants={itemVariants} className={styles.latestNewsHeader}>
                <span className={styles.sectionLabel} style={{alignSelf: 'flex-end'}}>
                    <div className={styles.liveIndicator}></div>
                    <span>الأحدث</span>
                </span>
            </motion.div>
            <motion.div variants={itemVariants} className={styles.newsList}>
                {newsList.map(item => (
                    <Link href={`/news/${item.slug}`} key={item.id} className={`${styles.newsListItem} no-underline`}>
                        <div className={styles.newsListThumbnail}><Image src={item.imageUrl} alt={item.title} fill sizes="60px" placeholder="blur" blurDataURL={item.blurDataURL} style={{ objectFit: 'cover' }} /></div>
                        <div className={styles.newsListInfo}>
                            <p className={styles.newsListCategory}>{item.category}</p>
                            <h5 className={styles.newsListTitle}>{item.title}</h5>
                            {item.date && <p style={{margin: '0.25rem 0 0', fontSize: '1.2rem', color: 'var(--text-secondary)'}}>{item.date.split(' - ')[0]}</p>}
                        </div>
                    </Link>
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