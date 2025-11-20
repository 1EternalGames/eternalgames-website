// components/content/ContentPageClient.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { adaptToCardProps } from '@/lib/adapters';
import { sanityLoader } from '@/lib/sanity.loader';
import { urlFor } from '@/sanity/lib/image';
import { useLightboxStore } from '@/lib/lightboxStore';

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

// Helper type to handle the Sanity slug object structure safely
type Slug = { current: string } | string;

type ContentItem = Omit<SanityReview | SanityArticle | SanityNews, 'slug'> & { 
    slug: Slug; 
    relatedContent?: any[] 
};

type ContentType = 'reviews' | 'articles' | 'news';

export type Heading = { id: string; title: string; top: number; level: number }; 

type ColorMapping = {
  word: string;
  color: string;
}

const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.4, duration: 0.5 } } };
const adaptReviewForScoreBox = (review: any) => ({ score: review.score, verdict: review.verdict, pros: review.pros, cons: review.cons });

export default function ContentPageClient({ item, type, children, colorDictionary }: {
    item: ContentItem;
    type: ContentType;
    children: React.ReactNode;
    colorDictionary: ColorMapping[];
}) {
    const { prefix: layoutIdPrefix, setPrefix } = useLayoutIdStore();
    const openLightbox = useLightboxStore((state) => state.openLightbox);

    const [headings, setHeadings] = useState<Heading[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    
    const articleBodyRef = useRef<HTMLDivElement>(null); 
    const scrollTrackerRef = useRef<HTMLDivElement>(null); 
    const [isLayoutStable, setIsLayoutStable] = useState(false); 
    
    const isReview = type === 'reviews';
    const isNews = type === 'news';
    
    // THE FIX: Robust slug string extraction
    const slugString = typeof item.slug === 'string' ? item.slug : item.slug?.current || '';
    
    const measureHeadings = useCallback(() => {
        const contentElement = articleBodyRef.current;
        const trackerElement = scrollTrackerRef.current;
        if (!contentElement || !trackerElement) return;

        const navbarOffset = 90;
        const documentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const seenIds = new Set<string>();
        
        let newHeadings: Heading[] = [];

        const headingElements = Array.from(contentElement.querySelectorAll('h1'));
        headingElements.forEach((h, index) => {
            let id = h.id;
            if (!id || seenIds.has(id)) { 
                id = `${h.textContent?.trim().slice(0, 20).replace(/\s+/g, '-') || 'heading'}-${index}`;
            }
            seenIds.add(id);
            h.id = id;
            
            const topPosition = h.getBoundingClientRect().top + documentScrollTop;
            const scrollToPosition = topPosition - navbarOffset;
            
            newHeadings.push({ id: id, title: h.textContent || '', top: Math.max(0, scrollToPosition), level: 1 });
        });

        if (isReview) {
             const scoreBoxElement = contentElement.querySelector('.score-box-container');
             if (scoreBoxElement) {
                 const topPosition = scoreBoxElement.getBoundingClientRect().top + documentScrollTop;
                 const scoreBoxScrollPosition = topPosition - navbarOffset;
                 
                 newHeadings.push({ 
                     id: 'verdict-summary', 
                     title: 'الخلاصة', 
                     top: Math.max(0, scoreBoxScrollPosition),
                     level: 1 
                 });
             }
        }
        
        if (newHeadings.length > 0) {
            setHeadings(newHeadings);
        }

    }, [isReview]);

    useEffect(() => {
        return () => {
            setPrefix('default');
        };
    }, [setPrefix]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        const handleResize = () => {
            checkMobile();
            if (isLayoutStable) measureHeadings();
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isLayoutStable, measureHeadings]); 

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const timeout = setTimeout(() => setIsLayoutStable(true), 1500); 
        return () => clearTimeout(timeout);
    }, [item]);

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
    const publishedDate = new Date(item.publishedAt as string);
    const day = publishedDate.getDate();
    const year = publishedDate.getFullYear();
    const monthIndex = publishedDate.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

    const primaryCreators = (item as any).authors || (item as any).reporters || [];
    const contentTypeForActionBar = type.slice(0, -1) as 'review' | 'article' | 'news';
    
    const heroImageUrl = urlFor(item.mainImage).width(2000).height(400).fit('crop').auto('format').url();
    const fullResImageUrl = urlFor(item.mainImage).auto('format').url();
    
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
                <motion.div 
                    layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`} 
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
                                    {isNews && <p className="news-card-category" style={{ textAlign: 'right', margin: '0 0 1rem 0' }}>{translateTag((item as any).category?.title)}</p>}
                                    <motion.h1 layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`} className="page-title" style={{ textAlign: 'right', margin: 0 }} transition={springTransition}>{item.title}</motion.h1>
                                </div>
                                
                                <div className={styles.metaContainer}>
                                    <div className={styles.metaBlockLeft}>
                                        {(item as any).game?.title && <GameLink gameName={(item as any).game.title} gameSlug={(item as any).game.slug} />}
                                        {/* THE FIX: Pass the extracted string, not the object */}
                                        <ContentActionBar contentId={item.legacyId} contentType={contentTypeForActionBar} contentSlug={slugString} />
                                    </div>
                                    <div className={styles.metaBlockRight}>
                                        <CreatorCredit label="بقلم" creators={primaryCreators} />
                                        <CreatorCredit label="تصميم" creators={item.designers} />
                                        <div className={styles.dateContainer}>
                                            <Calendar03Icon className={styles.metadataIcon} />
                                            <p className={styles.dateText}>نُشر في {formattedDate}</p>
                                        </div>
                                    </div>
                                </div>

                                <div ref={articleBodyRef} className="article-body">
                                    <PortableTextComponent content={item.content || []} colorDictionary={colorDictionary} />
                                    {isReview && <ScoreBox review={adaptReviewForScoreBox(item)} className="score-box-container" />}
                                </div>
                                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                                    <TagLinks tags={(item.tags || []).map((t: any) => t.title)} />
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