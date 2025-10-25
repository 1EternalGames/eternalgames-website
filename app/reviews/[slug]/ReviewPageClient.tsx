// app/reviews/[slug]/ReviewPageClient.tsx
'use client';

import type { SanityReview } from '@/types/sanity';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

import PortableTextComponent from '@/components/PortableTextComponent';
import ScoreBox from '@/components/ScoreBox';
import ArticleCard from '@/components/ArticleCard';
import GameLink from '@/components/GameLink';
import ContentActionBar from '@/components/ContentActionBar';
import TagLinks from '@/components/TagLinks';
import ReadingHud from '@/components/ReadingHud';
import { ContentBlock } from '@/components/ContentBlock';
import { adaptToCardProps } from '@/lib/adapters';
import CreatorCredit from '@/components/CreatorCredit';
import styles from './ReviewPage.module.css';

export type Heading = { id: string; title: string; top: number; };
const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.3, duration: 0.5 } }, };
const adaptReviewForScoreBox = (review: SanityReview) => ({ score: review.score, verdict: review.verdict, pros: review.pros, cons: review.cons });

export default function ReviewPageClient({ review, searchParams, children }: { 
    review: SanityReview, 
    searchParams?: { [key: string]: string | string[] | undefined },
    children?: React.ReactNode
}) {
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || (searchParams?.prefix as string) || 'reviews';
    const [headings, setHeadings] = useState<Heading[]>([]);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => { 
        const contentElement = contentContainerRef.current; if (!contentElement) return; const measureHeadings = () => { const containerRect = contentElement.getBoundingClientRect(); const headingElements = Array.from(contentElement.querySelectorAll('h2')); const navbarOffset = 90; 
        
        // --- THE DEFINITIVE FIX FOR DUPLICATE KEYS ---
        const seenIds = new Set<string>();
        const newHeadings = headingElements.map((h, index) => {
            let id = h.id;
            // If we've seen this ID before, make it unique by appending the index.
            if (seenIds.has(id)) {
                id = `${id}-${index}`;
            }
            seenIds.add(id);
            h.id = id; // IMPORTANT: Update the actual DOM element's ID for the click handler.
            
            const headingRect = h.getBoundingClientRect(); 
            const relativeTop = (headingRect.top - containerRect.top); 
            return { id: id, title: h.textContent || '', top: Math.max(0, relativeTop - navbarOffset) }; 
        });
        setHeadings(newHeadings); 
        
        }; const imagePromises = Array.from(contentElement.querySelectorAll('img')).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })); Promise.all(imagePromises).then(measureHeadings); if (imagePromises.length === 0) measureHeadings(); 
    }, [review]);

    if (!review) return null;
    const adaptedRelatedReviews = (review.relatedReviews || []).map(adaptToCardProps).filter(Boolean);

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const publishedDate = new Date(review.publishedAt);
    const day = publishedDate.getDate();
    const year = publishedDate.getFullYear();
    const monthIndex = publishedDate.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;
    
    const baseUrl = review.mainImage.url.split('?')[0];
    const imageUrl = `${baseUrl}?auto=format&q=85`;

    return (
        <>
            <motion.div initial="hidden" animate="visible" variants={contentVariants}><ReadingHud contentContainerRef={contentContainerRef} headings={headings} /></motion.div>
            <div className="page-transition-canvas">
                <motion.div layoutId={`${layoutIdPrefix}-card-container-${review.legacyId}`} className={styles.reviewHeroImageSm} style={{ position: 'relative', zIndex: 1060, overflow: 'hidden' }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                    <motion.div layoutId={`${layoutIdPrefix}-card-image-${review.legacyId}`} style={{ position: 'absolute', inset: 0 }}><Image src={imageUrl} alt={review.title} fill style={{ objectFit: 'cover' }} priority placeholder="blur" blurDataURL={review.mainImage.blurDataURL} unoptimized /></motion.div>
                </motion.div>
                <motion.div initial="hidden" animate="visible" variants={contentVariants}>
                    <div className="container page-container" style={{ paddingTop: 0 }}>
                        <div className={styles.reviewLayout}>
                            <main>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <motion.h1 layoutId={`${layoutIdPrefix}-card-title-${review.legacyId}`} className="page-title" style={{ textAlign: 'right', margin: 0 }}>{review.title}</motion.h1>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
                                        <GameLink gameName={review.game?.title} className="kinetic-game-tag" />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
                                        <CreatorCredit label="بقلم" creators={review.authors} />
                                        <CreatorCredit label="تصميم" creators={review.designers} />
                                        <p style={{ margin: 0 }}>نُشر في {formattedDate}</p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
                                        <ContentActionBar contentId={review.legacyId} contentType="review" contentSlug={review.slug} />
                                    </div>
                                </div>
                                
                                <div ref={contentContainerRef}><PortableTextComponent content={review.content} /><ScoreBox review={adaptReviewForScoreBox(review) as any} /></div>
                                <div className={styles.tagLinksContainer}><TagLinks tags={(review.tags || []).map(t => t.title)} /></div>
                            </main>
                            <aside className="review-sidebar" style={{ marginTop: '3rem' }}><ContentBlock title="قد يروق لك"><div className={styles.relatedArticlesGrid} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>{adaptedRelatedReviews.map(related => ( <ArticleCard key={related.id} article={related} layoutIdPrefix="related" /> ))}</div></ContentBlock></aside>
                        </div>
                    </div>
                    <div className="container" style={{ paddingBottom: '6rem' }}>
                        <ContentBlock title="حديث المجتمع">{children}</ContentBlock>
                    </div>
                </motion.div>
            </div>
        </>
    );
}