// components/content/ContentPageClient.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react'; // <-- ADDED useCallback
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
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const [isLayoutStable, setIsLayoutStable] = useState(false); 
    
    // <--- FIX: Re-adding variable declarations that were mistakenly removed ---
    const isReview = type === 'reviews';
    const isNews = type === 'news';
    // --- END FIX ---
    
    // --- UTILITY FUNCTIONS ---
    const measureHeadings = useCallback(() => {
        const contentElement = contentContainerRef.current;
        if (!contentElement) return;

        const containerRect = contentElement.getBoundingClientRect();
        const headingElements = Array.from(contentElement.querySelectorAll('h2'));
        const navbarOffset = 90;
        const seenIds = new Set<string>();
        
        const newHeadings = headingElements.map((h, index) => {
            let id = h.id;
            if (!id || seenIds.has(id)) { 
                id = `${h.textContent?.trim().slice(0, 20).replace(/\s+/g, '-') || 'heading'}-${index}`;
            }
            seenIds.add(id);
            h.id = id;
            
            const headingRect = h.getBoundingClientRect();
            const relativeTop = (headingRect.top + window.scrollY - containerRect.top); 
            return { id: id, title: h.textContent || '', top: Math.max(0, relativeTop - navbarOffset) };
        });
        setHeadings(newHeadings);
    }, []);
    // --- END UTILITY FUNCTIONS ---


    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 1. Scroll to top on first mount
    useEffect(() => { window.scrollTo(0, 0); }, []);

    // 2. Layout Stabilization Effect
    useEffect(() => {
        const contentElement = contentContainerRef.current;
        if (!contentElement) {
             // If the main content ref isn't available after a short time, force stability
            const fallbackTimeout = setTimeout(() => setIsLayoutStable(true), 1500); 
            return () => clearTimeout(fallbackTimeout);
        }

        // Wait for all essential images (main and portable text) to load
        const contentImages = Array.from(contentElement.querySelectorAll('img')).filter(img => !img.complete);
        const imagePromises = contentImages.map(img => new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }));
        
        Promise.all(imagePromises).finally(() => {
             // Give a small final delay to allow for the browser's post-load layout pass
            const timeout = setTimeout(() => setIsLayoutStable(true), 150); 
            clearTimeout(timeout);
        });
        
    }, [item]); // Re-run when item changes

    // 3. Heading Measurement Effect - ONLY RUNS WHEN STABLE
    useEffect(() => {
        if (isLayoutStable && headings.length === 0) { // Only measure if stable AND we haven't measured yet
            measureHeadings();
        }
    }, [isLayoutStable, headings.length, measureHeadings]); 

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
            {/* ReadingHud now conditionally renders based on stable state */}
            {isLayoutStable && headings.length > 0 && <ReadingHud contentContainerRef={contentContainerRef} headings={headings} />}

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
                            <main>
                                <div className={`${styles.headerContainer} ${shouldShiftLayout ? styles.shiftedLayout : ''}`}>
                                    {(item as any).game?.title && <GameLink gameName={(item as any).game.title} gameSlug={(item as any).game.slug} />}
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
                                    <ContentActionBar contentId={item.legacyId} contentType={contentTypeForActionBar} contentSlug={item.slug} />
                                </div>

                                <div ref={contentContainerRef} className="article-body">
                                    <PortableTextComponent content={item.content || []} />
                                    {isReview && <ScoreBox review={adaptReviewForScoreBox(item)} />}
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