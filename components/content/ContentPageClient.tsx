// components/content/ContentPageClient.tsx
'use client';

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { adaptToCardProps } from '@/lib/adapters';
import { sanityLoader } from '@/lib/sanity.loader';
import { urlFor } from '@/sanity/lib/image';
import { useLightboxStore } from '@/lib/lightboxStore';
import { usePerformanceStore } from '@/lib/performanceStore'; 

import type { SanityReview, SanityArticle, SanityNews } from '@/types/sanity';
import PortableTextComponent from '@/components/PortableTextComponent';
import ScoreBox from '@/components/ScoreBox';
import ArticleCard from '@/components/ArticleCard';
import GameLink from '@/components/GameLink';
import ContentActionBar from '@/components/ContentActionBar';
import TagLinks from '@/components/TagLinks';
import ReadingHud from '@/components/ReadingHud';
import { ContentBlock } from '@/components/ContentBlock';
import { SparklesIcon, Calendar03Icon } from '@/components/icons/index'; 
import CreatorCredit from '@/components/CreatorCredit';
import styles from './ContentPage.module.css';
import { CardProps } from '@/types';
import { translateTag } from '@/lib/translations';
import TableOfContents, { TocItem } from '@/components/content/TableOfContents';
import JoinVanguardCard from '@/components/ui/JoinVanguardCard';
import { formatArabicDuration, generateId } from '@/lib/text-utils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
type Slug = { current: string } | string;

type ContentItem = Omit<SanityReview | SanityArticle | SanityNews, 'slug'> & { 
    slug: Slug; 
    relatedContent?: any[]; 
    readingTime?: number; 
    toc?: { id: string; text: string; level: number }[]; 
};

type ContentType = 'reviews' | 'articles' | 'news';
export type Heading = { id: string; title: string; top: number; level: number }; 
type ColorMapping = { word: string; color: string; }
const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.4, duration: 0.8 } } };
const adaptReviewForScoreBox = (review: any) => ({ score: review.score, verdict: review.verdict, pros: review.pros, cons: review.cons });
const typeLabelMap: Record<string, string> = { 'official': 'رسمي', 'rumor': 'إشاعة', 'leak': 'تسريب' };

const TimeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

export default function ContentPageClient({ item, type, children, colorDictionary }: { item: ContentItem; type: ContentType; children: React.ReactNode; colorDictionary: ColorMapping[]; }) {
    const { prefix: layoutIdPrefix, setPrefix } = useLayoutIdStore();
    const openLightbox = useLightboxStore((state) => state.openLightbox);
    const { isHeroTransitionEnabled } = usePerformanceStore();

    const isReview = type === 'reviews';
    const isNews = type === 'news';

    const [tocItems, setTocItems] = useState<TocItem[]>(item.toc || []);
    const [headings, setHeadings] = useState<Heading[]>([]);
    
    const [isMobile, setIsMobile] = useState(false);
    
    const articleBodyRef = useRef<HTMLDivElement>(null); 
    const scrollTrackerRef = useRef<HTMLDivElement>(null); 
    const [isLayoutStable, setIsLayoutStable] = useState(false); 
    
    const slugString = typeof item.slug === 'string' ? item.slug : item.slug?.current || '';
    
    const measureHeadings = useCallback(() => {
        const contentElement = articleBodyRef.current;
        if (!contentElement) return;

        const navbarOffset = 90;
        const documentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const seenIds = new Set<string>();
        
        let newHeadings: Heading[] = [];

        const headingElements = Array.from(contentElement.querySelectorAll('h1, h2, h3'));
        
        headingElements.forEach((h, index) => {
            let id = h.id;
            
            if (!id || seenIds.has(id)) { 
                const textContent = h.textContent || '';
                id = generateId(textContent) || `heading-${index}`;
            }
            
            seenIds.add(id);
            h.id = id;
            
            const topPosition = h.getBoundingClientRect().top + documentScrollTop;
            const scrollToPosition = topPosition - navbarOffset;
            
            const level = parseInt(h.tagName.substring(1));
            const title = h.textContent || '';
            
            newHeadings.push({ id, title, top: Math.max(0, scrollToPosition), level });
        });

        if (isReview) {
             const scoreBoxElement = contentElement.querySelector('.score-box-container');
             if (scoreBoxElement) {
                 const topPosition = scoreBoxElement.getBoundingClientRect().top + documentScrollTop;
                 const scoreBoxScrollPosition = topPosition - navbarOffset;
                 
                 const verdictHeading = { id: 'verdict-summary', title: 'الخلاصة', top: Math.max(0, scoreBoxScrollPosition), level: 2 };
                 newHeadings.push(verdictHeading);
             }
        }
        
        if (newHeadings.length > 0) {
            setHeadings(newHeadings);
        }

    }, [isReview]);

    useEffect(() => { return () => { setPrefix('default'); }; }, [setPrefix]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        const handleResize = () => { checkMobile(); if (isLayoutStable) measureHeadings(); }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isLayoutStable, measureHeadings]); 

    useIsomorphicLayoutEffect(() => { window.scrollTo(0, 0); }, []);
    useEffect(() => { const timeout = setTimeout(() => setIsLayoutStable(true), 1500); return () => clearTimeout(timeout); }, [item]);
    useEffect(() => { if (isLayoutStable) { requestAnimationFrame(() => { measureHeadings(); }); } }, [isLayoutStable, measureHeadings]); 

    if (!item) return null;

    const rawRelatedReviews = (item as any).relatedReviews;
    const rawRelatedArticles = (item as any).relatedArticles;
    const rawRelatedNews = (item as any).relatedNews;
    const relatedReviews = Array.isArray(rawRelatedReviews) ? rawRelatedReviews : [];
    const relatedArticles = Array.isArray(rawRelatedArticles) ? rawRelatedArticles : [];
    const relatedNews = Array.isArray(rawRelatedNews) ? rawRelatedNews : [];
    const relatedContent = [...relatedReviews, ...relatedArticles, ...relatedNews];
    const uniqueRelatedContent = relatedContent.length > 0 ? Array.from(new Map(relatedContent.map((related: any) => [related._id, related])).values()) : [];
    const adaptedRelatedContent = uniqueRelatedContent.map((related: any) => adaptToCardProps(related, { width: 600 })).filter(Boolean) as CardProps[];
    const safeTags = Array.isArray(item.tags) ? item.tags : [];
    const safeAuthors = Array.isArray((item as any).authors) ? (item as any).authors : [];
    const safeReporters = Array.isArray((item as any).reporters) ? (item as any).reporters : [];
    const primaryCreators = [...safeAuthors, ...safeReporters];

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const publishedDate = new Date(item.publishedAt as string);
    const day = publishedDate.getDate();
    const year = publishedDate.getFullYear();
    const monthIndex = publishedDate.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;
    const contentTypeForActionBar = type.slice(0, -1) as 'review' | 'article' | 'news';
    
    // High Quality Hero
    const heroImageUrl = urlFor(item.mainImage).width(2000).height(1125).fit('crop').auto('format').url();
    // Full Res for Lightbox
    const fullResImageUrl = urlFor(item.mainImage).auto('format').url();
    
    const springTransition = { type: 'spring' as const, stiffness: 80, damping: 20, mass: 1.2 };
    const newsType = (item as any).newsType || 'official';

    // --- ID GENERATION (Must match ArticleCard) ---
    // Note: layoutIdPrefix is passed from the Store (e.g. "homepage-latest-articles")
    // item.legacyId is the unique numeric ID.
    // Resulting ID: "homepage-latest-articles-card-image-123"
    const safeLayoutIdPrefix = isHeroTransitionEnabled && layoutIdPrefix && layoutIdPrefix !== 'default' 
        ? layoutIdPrefix 
        : undefined;

    return (
        <>
            <ReadingHud contentContainerRef={scrollTrackerRef} headings={headings} isMobile={isMobile} />

            <motion.div 
                layoutId={safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-card-container-${item.legacyId}` : undefined}
                transition={springTransition} 
                style={{ backgroundColor: 'var(--bg-primary)', zIndex: 50, position: 'relative' }}
            >
                <motion.div 
                    // This is the CRITICAL matching ID for the image
                    layoutId={safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-card-image-${item.legacyId}` : undefined}
                    className={`${styles.heroImage} image-lightbox-trigger`} 
                    transition={springTransition} 
                    onClick={() => openLightbox([fullResImageUrl], 0)}
                >
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
                                <div className={styles.titleWrapper}>
                                    {isNews && ( <div className={styles.headerBadges}> <span className="news-card-category" style={{ margin: 0 }}>{translateTag((item as any).category?.title)}</span> <span className={`${styles.pageClassificationBadge} ${styles[newsType]}`}> {typeLabelMap[newsType]} </span> </div> )}
                                    <motion.h1 
                                        layoutId={safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-card-title-${item.legacyId}` : undefined}
                                        className="page-title" 
                                        style={{ textAlign: 'right', margin: 0 }} 
                                        transition={springTransition}
                                    > 
                                        {item.title} 
                                    </motion.h1>
                                </div>
                                
                                <div className={styles.metaContainer}>
                                    <div className={styles.metaBlockLeft}>
                                        {(item as any).game?.title && <GameLink gameName={(item as any).game.title} gameSlug={(item as any).game.slug} />}
                                        <ContentActionBar contentId={item.legacyId} contentType={contentTypeForActionBar} contentSlug={slugString} />
                                    </div>
                                    <div className={styles.metaBlockRight}>
                                        <div className={styles.creditsRow}>
                                            <CreatorCredit label="بقلم" creators={primaryCreators} />
                                            {item.designers && <CreatorCredit label="تصميم" creators={Array.isArray(item.designers) ? item.designers : []} />}
                                        </div>
                                        
                                        <div className={styles.dateContainer}>
                                             {item.readingTime && ( 
                                                <span className={styles.readTimeMinimal} title="وقت القراءة المقدر">
                                                    <span className={styles.timeIcon}><TimeIcon /></span>
                                                    وقت القراءة: {formatArabicDuration(item.readingTime)}
                                                </span>
                                             )}

                                             <div className={styles.metaRowItem}>
                                                 <Calendar03Icon className={styles.metadataIcon} />
                                                 <p className={styles.dateText}>{formattedDate}</p>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <TableOfContents headings={tocItems} />

                                <div ref={articleBodyRef} className="article-body">
                                    <PortableTextComponent content={item.content || []} colorDictionary={colorDictionary} />
                                    {isReview && <ScoreBox review={adaptReviewForScoreBox(item)} className="score-box-container" />}
                                </div>
                                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                                    <TagLinks tags={safeTags.map((t: any) => t.title)} />
                                </div>
                            </main>

                            <aside className={styles.sidebar}>
                                <JoinVanguardCard /> 
                                
                                <ContentBlock title="قد يروق لك" Icon={SparklesIcon}>
                                    <motion.div className={styles.relatedGrid} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" exit="hidden">
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