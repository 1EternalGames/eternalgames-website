// components/content/ContentPageClient.tsx
'use client';

import { useEffect, useState, useRef, useCallback, useLayoutEffect, RefObject, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { adaptToCardProps } from '@/lib/adapters';
import { sanityLoader } from '@/lib/sanity.loader';
import { urlFor } from '@/sanity/lib/image';
import { useLightboxStore } from '@/lib/lightboxStore';
import { usePerformanceStore } from '@/lib/performanceStore'; 
import { useContentStore } from '@/lib/contentStore'; 

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
import { formatArabicDuration, generateId, extractHeadingsFromContent } from '@/lib/text-utils';
import { calculateReadingTime, toPlainText } from '@/lib/readingTime';
import { generateLayoutId } from '@/lib/layoutUtils'; 

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
type Slug = { current: string } | string;

type ContentItem = Omit<SanityReview | SanityArticle | SanityNews, 'slug'> & { 
    slug: Slug; 
    relatedContent?: any[]; 
    readingTime?: number; 
    toc?: { id: string; text: string; level: number }[]; 
    contentLoaded?: boolean;
};

type ContentType = 'reviews' | 'articles' | 'news';
export type Heading = { id: string; title: string; top: number; level: number }; 
type ColorMapping = { word: string; color: string; }

const adaptReviewForScoreBox = (review: any) => ({ score: review.score, verdict: review.verdict, pros: review.pros, cons: review.cons });
const typeLabelMap: Record<string, string> = { 'official': 'رسمي', 'rumor': 'إشاعة', 'leak': 'تسريب' };
const TimeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></polyline></svg>;

export default function ContentPageClient({ 
    item, 
    type, 
    children, 
    colorDictionary, 
    forcedLayoutIdPrefix,
    initialImageSrc,
    scrollContainerRef
}: { 
    item: ContentItem; 
    type: ContentType; 
    children: React.ReactNode; 
    colorDictionary: ColorMapping[]; 
    forcedLayoutIdPrefix?: string;
    initialImageSrc?: string;
    scrollContainerRef?: RefObject<HTMLElement | null>;
}) {
    const { prefix: storePrefix, setPrefix } = useLayoutIdStore();
    const openLightbox = useLightboxStore((state) => state.openLightbox);
    const { isHeroTransitionEnabled } = usePerformanceStore();
    
    const isReview = type === 'reviews';
    const isNews = type === 'news';

    // --- COMPUTED DATA (Client-Side Fallback) ---
    // If TOC/ReadingTime are missing (e.g. inside Overlay), calculate them from content.
    const tocItems = useMemo(() => {
        if (item.toc && item.toc.length > 0) return item.toc;
        
        // Fallback: Generate TOC from content
        const generated = extractHeadingsFromContent(item.content || []);
        if (isReview && (item as any).verdict) {
             generated.push({ id: 'verdict-summary', text: 'الخلاصة', level: 2 });
        }
        return generated;
    }, [item.toc, item.content, isReview, (item as any).verdict]);

    const readingTime = useMemo(() => {
        if (item.readingTime) return item.readingTime;
        
        // Fallback: Calculate reading time
        if (item.content) {
            const text = toPlainText(item.content);
            return calculateReadingTime(text);
        }
        return 0;
    }, [item.readingTime, item.content]);

    // ------------------------------------------

    const [headings, setHeadings] = useState<Heading[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    
    const [isBodyReady, setIsBodyReady] = useState(false);
    const [isTransitionComplete, setIsTransitionComplete] = useState(false);

    const articleBodyRef = useRef<HTMLDivElement>(null); 
    const [isLayoutStable, setIsLayoutStable] = useState(false); 
    
    const slugString = item?.slug ? (typeof item.slug === 'string' ? item.slug : item.slug.current) : '';
    const isLoaded = (item as any).contentLoaded === true || (item.content && Array.isArray(item.content) && item.content.length > 0);

    // FIXED: Removed isHeroVisible dependency. The ID now remains constant.
    const layoutIdPrefix = (forcedLayoutIdPrefix || storePrefix);
    const isSharedTransitionActive = isHeroTransitionEnabled && layoutIdPrefix && layoutIdPrefix !== 'default';

    const springTransition = { 
        type: 'spring' as const, 
        stiffness: 150, 
        damping: 22, 
        mass: 0.5,
        opacity: { duration: 0 } 
    };
    
    const bodyFadeVariants = { 
        hidden: { opacity: 0, y: 20 }, 
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.4, 
                ease: "easeOut" as const,
                delay: isSharedTransitionActive ? 0.25 : 0 
            } 
        },
        exit: { opacity: 0, transition: { duration: 0.1 } } 
    };

    useEffect(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsBodyReady(true);
            });
        });
        
        if (!isSharedTransitionActive) {
            setIsTransitionComplete(true);
        }
    }, [isSharedTransitionActive]);

    const measureHeadings = useCallback(() => {
        const contentElement = articleBodyRef.current;
        if (!contentElement) return;

        const navbarOffset = 90;
        const currentScrollTop = scrollContainerRef?.current 
            ? scrollContainerRef.current.scrollTop 
            : (document.documentElement.scrollTop || document.body.scrollTop);

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
            
            const rect = h.getBoundingClientRect();
            const topPosition = rect.top + currentScrollTop;
            const scrollToPosition = topPosition - navbarOffset;
            const level = parseInt(h.tagName.substring(1));
            const title = h.textContent || '';
            newHeadings.push({ id, title, top: Math.max(0, scrollToPosition), level });
        });

        if (isReview) {
             const scoreBoxElement = contentElement.querySelector('.score-box-container');
             if (scoreBoxElement) {
                 const rect = scoreBoxElement.getBoundingClientRect();
                 const topPosition = rect.top + currentScrollTop;
                 const scoreBoxScrollPosition = topPosition - navbarOffset;
                 const verdictHeading = { id: 'verdict-summary', title: 'الخلاصة', top: Math.max(0, scoreBoxScrollPosition), level: 2 };
                 newHeadings.push(verdictHeading);
             }
        }
        if (newHeadings.length > 0) setHeadings(newHeadings);
    }, [isReview, scrollContainerRef]);

    useEffect(() => { return () => { setPrefix('default'); }; }, [setPrefix]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        const handleResize = () => { checkMobile(); if (isLayoutStable) measureHeadings(); }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isLayoutStable, measureHeadings]); 

    useIsomorphicLayoutEffect(() => { 
        if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollTop = 0;
        } else {
            window.scrollTo(0, 0); 
        }
    }, [scrollContainerRef]);

    useEffect(() => { 
        if (!isLoaded || !isBodyReady) return; 
        const timeout = setTimeout(() => {
             setIsLayoutStable(true);
             measureHeadings();
        }, 500); 
        return () => clearTimeout(timeout); 
    }, [item, isLoaded, isBodyReady, measureHeadings]);

    if (!item) return null;

    const relatedReviews = Array.isArray((item as any).relatedReviews) ? (item as any).relatedReviews : [];
    const relatedArticles = Array.isArray((item as any).relatedArticles) ? (item as any).relatedArticles : [];
    const relatedNews = Array.isArray((item as any).relatedNews) ? (item as any).relatedNews : [];
    
    const relatedContent = [...relatedReviews, ...relatedArticles, ...relatedNews];
    const uniqueRelatedContent = relatedContent.length > 0 ? Array.from(new Map(relatedContent.map((related: any) => [related._id, related])).values()) : [];
    
    const adaptedRelatedContent = uniqueRelatedContent.map((related: any) => adaptToCardProps(related, { width: 600 })).filter(Boolean) as CardProps[];
    
    const safeTags = Array.isArray(item.tags) ? item.tags : [];
    const safeAuthors = Array.isArray((item as any).authors) ? (item as any).authors : [];
    const safeReporters = Array.isArray((item as any).reporters) ? (item as any).reporters : [];
    const primaryCreators = [...safeAuthors, ...safeReporters];
    
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let formattedDate = '';
    if (item.publishedAt) {
        const publishedDate = new Date(item.publishedAt as string);
        const day = publishedDate.getDate();
        const year = publishedDate.getFullYear();
        const monthIndex = publishedDate.getMonth();
        formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;
    }

    const contentTypeForActionBar = type.slice(0, -1) as 'review' | 'article' | 'news';
    
    const highResUrl = item.mainImage ? urlFor(item.mainImage).width(2000).height(1125).fit('crop').auto('format').url() : '/placeholder.jpg';
    const displayImageUrl = initialImageSrc || highResUrl;
    const fullResImageUrl = item.mainImage ? urlFor(item.mainImage).auto('format').url() : displayImageUrl;
    const blurDataURL = (item.mainImage as any)?.blurDataURL;
    
    const newsType = (item as any).newsType || 'official';

    const imageLayoutId = isSharedTransitionActive ? generateLayoutId(layoutIdPrefix, 'image', item.legacyId) : undefined;
    const titleLayoutId = isSharedTransitionActive ? generateLayoutId(layoutIdPrefix, 'title', item.legacyId) : undefined;

    const gameObj = (item as any).game;
    const gameSlug = gameObj ? (typeof gameObj.slug === 'string' ? gameObj.slug : gameObj.slug?.current) : null;

    return (
        <>
            <ReadingHud 
                headings={headings} 
                isMobile={isMobile} 
                scrollContainerRef={scrollContainerRef} 
            />

            <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                style={{ backgroundColor: 'transparent', zIndex: 50, position: 'relative' }}
            >
                <motion.div 
                    layoutId={imageLayoutId} 
                    className={`${styles.heroImage} image-lightbox-trigger`} 
                    transition={springTransition} 
                    onClick={(e) => {
                        if (!isTransitionComplete && isSharedTransitionActive) return;
                        e.stopPropagation(); 
                        openLightbox([fullResImageUrl], 0);
                    }}
                    onLayoutAnimationComplete={() => {
                        setIsTransitionComplete(true);
                    }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    style={{ 
                        pointerEvents: (isSharedTransitionActive && !isTransitionComplete) ? 'none' : 'auto' 
                    }}
                >
                    <Image 
                        loader={sanityLoader} 
                        src={displayImageUrl} 
                        alt={item.title || 'Hero Image'} 
                        fill 
                        sizes="100vw" 
                        style={{ objectFit: 'cover' }} 
                        priority 
                        placeholder={isSharedTransitionActive ? 'empty' : (blurDataURL ? 'blur' : 'empty')} 
                        blurDataURL={blurDataURL} 
                        unoptimized={!!initialImageSrc}
                    />
                </motion.div>

                <div className="container page-container" style={{ paddingTop: '0' }}>
                    <div className={styles.contentLayout}>
                        <main>
                            <div className={styles.titleWrapper}>
                                {isNews && ( 
                                    <motion.div 
                                        className={styles.headerBadges}
                                        initial={{ opacity: 1 }} 
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0 } }}
                                    > 
                                        <span className="news-card-category" style={{ margin: 0 }}>{translateTag((item as any).category?.title)}</span> 
                                        <span className={`${styles.pageClassificationBadge} ${styles[newsType]}`}> {typeLabelMap[newsType]} </span> 
                                    </motion.div> 
                                )}
                                
                                <motion.h1 
                                    layoutId={titleLayoutId}
                                    className="page-title" 
                                    style={{ textAlign: 'right', margin: 0 }} 
                                    transition={springTransition}
                                    initial={{ opacity: 1, y: isSharedTransitionActive ? 0 : 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                > 
                                    {item.title} 
                                </motion.h1>
                            </div>
                            
                            {isLoaded && isBodyReady ? (
                                <motion.div
                                    variants={bodyFadeVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <div className={styles.metaContainer}>
                                        <div className={styles.metaBlockLeft}>
                                            {gameObj?.title && <GameLink gameName={gameObj.title} gameSlug={gameSlug} />}
                                            <ContentActionBar 
                                                contentId={item.legacyId} 
                                                contentType={contentTypeForActionBar} 
                                                contentSlug={slugString} 
                                                title={item.title}
                                            />
                                        </div>
                                        <div className={styles.metaBlockRight}>
                                            <div className={styles.creditsRow}>
                                                <CreatorCredit label="بقلم" creators={primaryCreators} />
                                                {item.designers && <CreatorCredit label="تصميم" creators={Array.isArray(item.designers) ? item.designers : []} />}
                                            </div>
                                            
                                            <div className={styles.dateContainer}>
                                                {readingTime > 0 && ( 
                                                    <span className={styles.readTimeMinimal} title="وقت القراءة المقدر">
                                                        <span className={styles.timeIcon}><TimeIcon /></span>
                                                        وقت القراءة: {formatArabicDuration(readingTime)}
                                                    </span>
                                                )}

                                                <div className={styles.metaRowItem}>
                                                    <Calendar03Icon className={styles.metadataIcon} />
                                                    <p className={styles.dateText}>{formattedDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <TableOfContents 
                                        headings={tocItems} 
                                        scrollContainerRef={scrollContainerRef} 
                                    />

                                    <div ref={articleBodyRef} className="article-body">
                                        <PortableTextComponent content={item.content || []} colorDictionary={colorDictionary} />
                                        {isReview && <ScoreBox review={adaptReviewForScoreBox(item)} className="score-box-container" />}
                                    </div>
                                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                                        <TagLinks tags={safeTags.map((t: any) => t.title)} />
                                    </div>
                                </motion.div>
                            ) : (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="spinner" />
                                </div>
                            )}
                        </main>

                        <aside className={styles.sidebar}>
                            {isLoaded && isBodyReady && (
                                <motion.div
                                    variants={bodyFadeVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
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
                                </motion.div>
                            )}
                        </aside>
                    </div>
                </div>
            </motion.div>
            
            {isLoaded && isBodyReady && (
                <motion.div initial="hidden" animate="visible" exit="exit" variants={bodyFadeVariants} className="container" style={{ paddingBottom: '6rem' }}>
                    <ContentBlock title="حديث المجتمع">{children}</ContentBlock>
                </motion.div>
            )}
        </>
    );
}