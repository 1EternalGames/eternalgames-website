// components/content/ContentPageClient.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { adaptToCardProps } from '@/lib/adapters';
import { sanityLoader } from '@/lib/sanity.loader';
import { urlFor } from '@/sanity/lib/image';

import type { SanityReview, SanityArticle, SanityNews } from '@/types/sanity';
import PortableTextComponent from '@/components/PortableTextComponent';
import ScoreBox from '@/components/ScoreBox';
import ArticleCard from '@/components/ArticleCard';
import GameLink from '@/components/GameLink';
import ContentActionBar from '@/components/ContentActionBar';
import TagLinks from '@/components/TagLinks';
import ReadingHud from '@/components/ReadingHud';
import { ContentBlock } from '@/components/ContentBlock';
import { SparklesIcon } from '@/components/icons/index';
import CreatorCredit from '@/components/CreatorCredit';
import styles from './ContentPage.module.css';
import { CardProps } from '@/types';
import { translateTag } from '@/lib/translations';

type ContentItem = (SanityReview | SanityArticle | SanityNews) & { relatedContent?: any[] };
type ContentType = 'reviews' | 'articles' | 'news';

export type Heading = { id: string; title: string; top: number; };
const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.4, duration: 0.5 } } };
const adaptReviewForScoreBox = (review: any) => ({ score: review.score, verdict: review.verdict, pros: review.pros, cons: review.cons });

export default function ContentPageClient({ item, type, children }: {
    item: ContentItem;
    type: ContentType;
    children: React.ReactNode;
}) {
    const defaultPrefix = type === 'reviews' ? 'reviews' : `${type}-grid`;
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || defaultPrefix;
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    
    // Ref for the content area containing h2s/scorebox (to measure offset)
    const articleBodyRef = useRef<HTMLDivElement>(null); 
    // Ref for the entire content column (to serve as the top anchor, though window scroll is still primary)
    const scrollTrackerRef = useRef<HTMLDivElement>(null); 
    const [isLayoutStable, setIsLayoutStable] = useState(false); 
    
    const isReview = type === 'reviews';
    const isNews = type === 'news';
    
    // --- UTILITY FUNCTIONS ---
    const measureHeadings = useCallback(() => {
        const contentElement = articleBodyRef.current;
        const trackerElement = scrollTrackerRef.current;
        if (!contentElement || !trackerElement) return;

        const navbarOffset = 90; // Approximate height of the fixed navbar
        const documentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const trackerOffsetTop = trackerElement.getBoundingClientRect().top + documentScrollTop; // Absolute top of tracker
        const seenIds = new Set<string>();
        
        let newHeadings: Heading[] = [];

        // 1. Collect H2 headings
        const headingElements = Array.from(contentElement.querySelectorAll('h2'));
        headingElements.forEach((h, index) => {
            let id = h.id;
            if (!id || seenIds.has(id)) { 
                id = `${h.textContent?.trim().slice(0, 20).replace(/\s+/g, '-') || 'heading'}-${index}`;
            }
            seenIds.add(id);
            h.id = id;
            
            // CORRECTED: Define topPosition
            const topPosition = h.getBoundingClientRect().top + documentScrollTop;
            
            // The value to scroll to is the absolute position minus the navbar offset.
            const scrollToPosition = topPosition - navbarOffset;
            
            newHeadings.push({ id: id, title: h.textContent || '', top: Math.max(0, scrollToPosition) });
        });

        // 2. Add the final marker (Score Box) for Reviews
        if (isReview) {
             const scoreBoxElement = contentElement.querySelector('.score-box-container');
             if (scoreBoxElement) {
                 const topPosition = scoreBoxElement.getBoundingClientRect().top + documentScrollTop;
                 const scoreBoxScrollPosition = topPosition - navbarOffset;
                 
                 newHeadings.push({ 
                     id: 'verdict-summary', 
                     title: 'الخلاصة', 
                     top: Math.max(0, scoreBoxScrollPosition) 
                 });
             }
        }
        
        if (newHeadings.length > 0) {
            setHeadings(newHeadings);
        }

    }, [isReview]);
    // --- END UTILITY FUNCTIONS ---


    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        const handleResize = () => {
            checkMobile();
            if (isLayoutStable) measureHeadings();
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isLayoutStable, measureHeadings]);

    // 1. Scroll to top on first mount
    useEffect(() => { window.scrollTo(0, 0); }, []);

    // 2. Layout Stabilization Effect
    useEffect(() => {
        const timeout = setTimeout(() => setIsLayoutStable(true), 1500); 
        return () => clearTimeout(timeout);
    }, [item]);

    // 3. Heading Measurement Effect - GUARANTEED RUN
    useEffect(() => {
        if (isLayoutStable) {
            requestAnimationFrame(() => {
                measureHeadings();
            });
        }
    }, [isLayoutStable, measureHeadings]); 

    if (!item) return null;

    const relatedContent = (item as any).relatedReviews || (item as any).relatedArticles || (item as any).relatedNews || [];
    const uniqueRelatedContent = relatedContent ? Array.from(new Map(relatedContent.map((related: any) => [related._id, related])).values()) : [];
    const adaptedRelatedContent = (uniqueRelatedContent || []).map(adaptToCardProps).filter(Boolean) as CardProps[];

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const publishedDate = new Date(item.publishedAt);
    const day = publishedDate.getDate();
    const year = publishedDate.getFullYear();
    const monthIndex = publishedDate.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

    const primaryCreators = (item as any).authors || (item as any).reporters || [];
    const contentTypeForActionBar = type.slice(0, -1) as 'review' | 'article' | 'news';
    
    const heroImageUrl = urlFor(item.mainImage).width(2000).height(400).fit('crop').auto('format').url();
    
    const GAME_TITLE_THRESHOLD = 25;
    const isLongGameTitle = (item as any).game?.title?.length > GAME_TITLE_THRESHOLD;
    const shouldShiftLayout = isMobile && isLongGameTitle;

    const springTransition = { type: 'spring' as const, stiffness: 200, damping: 35 };

    return (
        <>
            <ReadingHud 
                contentContainerRef={scrollTrackerRef}
                headings={headings} 
                isMobile={isMobile} 
            />

            <motion.div
                layoutId={`${layoutIdPrefix}-card-container-${item.legacyId}`}
                transition={springTransition}
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <motion.div layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`} className={styles.heroImage} transition={springTransition}>
                    <Image 
                        loader={sanityLoader} 
                        src={heroImageUrl} 
                        alt={item.title} 
                        fill 
                        sizes="100vw"
                        style={{ objectFit: 'cover' }} 
                        priority 
                        placeholder="blur" 
                        blurDataURL={(item.mainImage as any).blurDataURL} 
                    />
                </motion.div>

                <div className="container page-container" style={{ paddingTop: '0' }}>
                    <motion.div initial="hidden" animate="visible" variants={contentVariants} >
                        <div className={styles.contentLayout}>
                            <main ref={scrollTrackerRef}>
                                <div className={`${styles.headerContainer} ${shouldShiftLayout ? styles.shiftedLayout : ''}`}>
                                    {(item as any).game?.title && <GameLink gameName={(item as any).game.title} gameSlug={(item as any).game.slug} />}
                                    <div className={styles.titleWrapper}>
                                        {isNews && <p className="news-card-category" style={{ textAlign: 'right', margin: '0' }}>{translateTag((item as any).category?.title)}</p>}
                                        <motion.h1 layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`} className="page-title" style={{ textAlign: 'right', margin: isNews ? '0.5rem 0 0 0' : 0 }} transition={springTransition}>{item.title}</motion.h1>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', fontSize: '1.5rem' }}>
                                        <CreatorCredit label="بقلم" creators={primaryCreators} />
                                        <CreatorCredit label="تصميم" creators={item.designers} />
                                        <p style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-secondary)' }}>نُشر في {formattedDate}</p>
                                    </div>
                                    <ContentActionBar contentId={item.legacyId} contentType={contentTypeForActionBar} contentSlug={item.slug} />
                                </div>

                                <div ref={articleBodyRef} className="article-body">
                                    <PortableTextComponent content={item.content || []} />
                                    {isReview && <ScoreBox review={adaptReviewForScoreBox(item)} className="score-box-container" />}
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
                                            <motion.div key={related.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                                <ArticleCard article={related} layoutIdPrefix={`related-${type}`} />
                                            </motion.div>
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