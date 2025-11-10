// PASTE THIS FULL CODE INTO: components/content/ContentPageClient.tsx

'use client';

import { useRef, useEffect, useState, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { SanityReview, SanityArticle, SanityNews, SanityAuthor } from '@/types/sanity';
import styles from './ContentPage.module.css';
// Removed missing import: import { sanityLoader } from '@/sanity/lib/image';
// Removed missing import: import GameLink from './GameLink';
import CreatorCredit from '../CreatorCredit';
// Removed missing import: import ContentActionBar from './ContentActionBar';
import PortableTextComponent from '../PortableTextComponent';
// Removed missing import: import ScoreBox from './ScoreBox';
import TagLinks from '../TagLinks';
import { ContentBlock } from '../ContentBlock';
import { SparklesIcon } from '../icons';
import { adaptToCardProps } from '@/lib/adapters';
import ArticleCard from '../ArticleCard';
// Removed missing import: import ReadingHud from './ReadingHud';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

// Corrected Type to handle different properties
type ContentItem = (SanityReview | SanityArticle | SanityNews) & { 
    relatedContent?: any[],
    authors?: SanityAuthor[],
    reporters?: SanityAuthor[]
};

type ContentType = 'reviews' | 'articles' | 'news';

export type Heading = { id: string; title: string; top: number; };
const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.15, duration: 0.5 } } };
const adaptReviewForScoreBox = (review: any) => ({ score: review.score, verdict: review.verdict, pros: review.pros, cons: review.cons });

export default function ContentPageClient({ item, type, children }: {
    item: ContentItem;
    type: ContentType;
    children: ReactNode;
}) {
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || type;
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const [headings, setHeadings] = useState<Heading[]>([]);

    useEffect(() => {
        const contentNode = contentContainerRef.current;
        if (!contentNode) return;

        const headingNodes = contentNode.querySelectorAll('h2, h3');
        const newHeadings: Heading[] = Array.from(headingNodes).map((node) => ({
            id: node.id,
            title: node.textContent || '',
            top: node.getBoundingClientRect().top + window.scrollY - 120,
        }));
        setHeadings(newHeadings);
    }, [item.legacyId]);

    const isReview = type === 'reviews';
    const isNews = type === 'news';
    const heroImageUrl = item.mainImage?.url;
    
    if (!heroImageUrl) {
        return <div className="container page-container"><p>Image not found.</p></div>;
    }

    const primaryCreators = (item.authors || item.reporters) as SanityAuthor[];
    const formattedDate = new Date(item.publishedAt || Date.now()).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    const contentTypeForActionBar = isReview ? 'review' : (isNews ? 'news' : 'article');
    const adaptedRelatedContent = useMemo(() => (item.relatedContent || []).map(adaptToCardProps).filter(Boolean), [item.relatedContent]);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    const GAME_TITLE_THRESHOLD = 25; // Characters
    const isLongGameTitle = (item as any).game?.title?.length > GAME_TITLE_THRESHOLD;
    const shouldShiftLayout = isMobile && isLongGameTitle;

    const springTransition = { type: 'spring' as const, stiffness: 200, damping: 35 };

    return (
        <>
            {/* ReadingHud component was removed as it's not in the old codebase */}

            <motion.div
                layoutId={`${layoutIdPrefix}-card-container-${item.legacyId}`}
                transition={springTransition}
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <motion.div layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`} className={styles.heroImage} transition={springTransition}>
                    <Image 
                        src={heroImageUrl} 
                        alt={item.title}
                        fill
                        priority
                        sizes="100vw"
                        className={styles.heroImageActual}
                        placeholder={item.mainImage?.blurDataURL ? 'blur' : 'empty'}
                        blurDataURL={item.mainImage?.blurDataURL || ''}
                    />
                </motion.div>

                <div className="container page-container" style={{ paddingTop: '0' }}>
                    <motion.div initial="hidden" animate="visible" variants={contentVariants} >
                        <div className={styles.contentLayout}>
                            <main>
                                <div className={`${styles.headerContainer} ${shouldShiftLayout ? styles.shiftedLayout : ''}`}>
                                    {/* GameLink component was removed */}
                                    {(item as any).game?.title && <p>{(item as any).game.title}</p>}
                                    <div className={styles.titleWrapper}>
                                        {isNews && <p className="news-card-category" style={{ textAlign: 'right', margin: '0' }}>{(item as SanityNews).category}</p>}
                                        <motion.h1 layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`} className="page-title" style={{ textAlign: 'right', margin: isNews ? '0.5rem 0 0 0' : 0 }} transition={springTransition}>{item.title}</motion.h1>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', fontSize: '1.5rem' }}>
                                        <CreatorCredit label="بقلم" creators={primaryCreators} />
                                        <CreatorCredit label="تصميم" creators={item.designers} />
                                        <p style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-secondary)' }}>نُشر في {formattedDate}</p>
                                    </div>
                                    {/* ContentActionBar component was removed */}
                                </div>

                                <div ref={contentContainerRef} className="article-body">
                                    <PortableTextComponent content={item.content || []} />
                                    {/* ScoreBox component was removed */}
                                </div>
                                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                                    <TagLinks tags={(item.tags || []).map(t => t.title)} />
                                </div>
                            </main>
                            <aside className={styles.sidebar}>
                                <ContentBlock title="قد يروق لك" Icon={SparklesIcon}>
                                    <motion.div 
                                        className={styles.relatedGrid}
                                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                    >
                                        {adaptedRelatedContent.map(related => (
                                            related && ( // Added null check here
                                                <motion.div key={related.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                                    <ArticleCard article={related} layoutIdPrefix={`related-${type}`} />
                                                </motion.div>
                                            )
                                        ))}
                                    </motion.div>
                                </ContentBlock>
                            </aside>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
            
            <motion.div initial="hidden" animate="visible" variants={contentVariants} className="container" style={{ paddingBottom: '6rem' }}>
                <ContentBlock title="حديث المجتمع">{children}</ContentBlock>
            </motion.div>
        </>
    );
}