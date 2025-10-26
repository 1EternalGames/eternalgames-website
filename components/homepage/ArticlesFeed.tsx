// components/homepage/ArticlesFeed.tsx
'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CardProps } from '@/types';
import CreatorCredit from '@/components/CreatorCredit';
import KineticGlyphs from '@/components/effects/KineticGlyphs';
import { useLivingCard } from '@/hooks/useLivingCard';
import styles from './ArticlesFeed.module.css';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } } };
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><polyline points="15 18 9 12 15 6"></polyline></svg>;

const TopArticleCard = ({ article }: { article: CardProps }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            ref={livingCardRef}
            style={livingCardAnimation.style}
            onMouseMove={livingCardAnimation.onMouseMove}
            onMouseEnter={() => { livingCardAnimation.onHoverStart(); setIsHovered(true); }}
            onMouseLeave={() => { livingCardAnimation.onHoverEnd(); setIsHovered(false); }}
        >
            <Link href={`/articles/${article.slug}`} className={`${styles.topArticleCard} no-underline`}>
                <AnimatePresence>{isHovered && <KineticGlyphs />}</AnimatePresence>
                <div className={styles.topArticleImage}><Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 768px) 90vw, 30vw" placeholder="blur" blurDataURL={article.blurDataURL} style={{ objectFit: 'cover' }} /></div>
                <div className={styles.topArticleContent}>
                    <span className={styles.sectionLabel}>الأكثر رواجًا</span>
                    <h3 className={styles.topArticleTitle}>{article.title}</h3>
                    <div className={styles.topArticleMeta}><CreatorCredit label="بقلم" creators={article.authors} /></div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function ArticlesFeed({ topArticles, latestArticles }: { topArticles: CardProps[]; latestArticles: CardProps[]; }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    
    return (
        <motion.div ref={ref} className={styles.feedContainer} variants={containerVariants} initial="hidden" animate={isInView ? "visible" : "hidden"} >
            <motion.div className={styles.topArticlesGrid} variants={itemVariants}>{topArticles.map(article => <TopArticleCard key={article.id} article={article} />)}</motion.div>
            <motion.div variants={itemVariants} style={{textAlign: 'right'}}>
                <span className={styles.sectionLabel} style={{marginTop: '4rem'}}>
                    <div className={styles.liveIndicator}></div>
                    <span>الأحدث</span>
                </span>
            </motion.div>
            <motion.div className={styles.latestArticlesList} variants={itemVariants}>
                {latestArticles.map(article => (
                    <Link href={`/articles/${article.slug}`} key={article.id} className={`${styles.latestArticleItem} no-underline`} >
                        <div className={styles.latestArticleThumbnail}><Image src={article.imageUrl} alt={article.title} fill sizes="120px" placeholder="blur" blurDataURL={article.blurDataURL} style={{ objectFit: 'cover' }} /></div>
                        <div className={styles.latestArticleInfo}>
                            <h4 className={styles.latestArticleTitle}>{article.title}</h4>
                            <div className={styles.latestArticleMeta}><CreatorCredit label="بقلم" creators={article.authors} /></div>
                        </div>
                    </Link>
                ))}
            </motion.div>
            <motion.div variants={itemVariants}>
                <Link href="/articles" className={`${styles.viewAllLink} no-underline`}>
                    <span>عرض كل المقالات</span>
                    <ArrowIcon />
                </Link>
            </motion.div>
        </motion.div>
    );
}