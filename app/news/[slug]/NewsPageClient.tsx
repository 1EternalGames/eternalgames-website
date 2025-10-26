// app/news/[slug]/NewsPageClient.tsx
'use client';

import type { SanityNews } from '@/types/sanity';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { adaptToCardProps } from '@/lib/adapters';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

import TagLinks from '@/components/TagLinks';
import ContentActionBar from '@/components/ContentActionBar';
import PortableTextComponent from '@/components/PortableTextComponent';
import { ContentBlock } from '@/components/ContentBlock';
import ArticleCard from '@/components/ArticleCard';
import CreatorCredit from '@/components/CreatorCredit';
import GameLink from '@/components/GameLink';
import ReadingHud from '@/components/ReadingHud';
import { Heading } from '@/app/reviews/[slug]/ReviewPageClient';
import styles from './NewsPage.module.css';

const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.3, duration: 0.5 } }, };

export default function NewsPageClient({ newsItem, children }: { newsItem: SanityNews & { relatedNews?: any[], game?: { title: string } }; children: React.ReactNode }) {
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || 'news-grid';
    const [headings, setHeadings] = useState<Heading[]>([]);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => { 
        const contentElement = contentContainerRef.current; if (!contentElement) return; const measureHeadings = () => { const containerRect = contentElement.getBoundingClientRect(); const headingElements = Array.from(contentElement.querySelectorAll('h2')); const navbarOffset = 90; 
        const seenIds = new Set<string>();
        const newHeadings = headingElements.map((h, index) => {
            let id = h.id; if (seenIds.has(id)) { id = `${id}-${index}`; } seenIds.add(id); h.id = id;
            const headingRect = h.getBoundingClientRect(); const relativeTop = (headingRect.top - containerRect.top); 
            return { id: id, title: h.textContent || '', top: Math.max(0, relativeTop - navbarOffset) }; 
        });
        setHeadings(newHeadings); 
        }; const imagePromises = Array.from(contentElement.querySelectorAll('img')).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })); Promise.all(imagePromises).then(measureHeadings); if (imagePromises.length === 0) measureHeadings(); 
    }, [newsItem]);

    if (!newsItem) return null;

    const uniqueRelatedNews = newsItem.relatedNews ? Array.from(new Map(newsItem.relatedNews.map(item => [item._id, item])).values()) : [];
    const adaptedRelatedNews = (uniqueRelatedNews || []).map(adaptToCardProps).filter(Boolean);

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const date = new Date(newsItem.publishedAt);
    const day = date.getDate();
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

    return (
        <>
            <motion.div initial="hidden" animate="visible" variants={contentVariants}><ReadingHud contentContainerRef={contentContainerRef} headings={headings} /></motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <motion.div layoutId={`${layoutIdPrefix}-card-container-${newsItem.legacyId}`}>
                    <motion.div className={styles.newsHeroImage} layoutId={`${layoutIdPrefix}-card-image-${newsItem.legacyId}`}><Image src={newsItem.mainImage.url} alt={newsItem.title} fill style={{ objectFit: 'cover' }} priority placeholder="blur" blurDataURL={newsItem.mainImage.blurDataURL} /></motion.div>
                </motion.div>
                <motion.div initial="hidden" animate="visible" variants={contentVariants} className="container page-container" style={{ paddingTop: '0' }}>
                    <div className={styles.reviewLayout}>
                        <main>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <p className="news-card-category" style={{ textAlign: 'right', margin: '0' }}>{newsItem.category}</p>
                                    <motion.h1 className="page-title" layoutId={`${layoutIdPrefix}-card-title-${newsItem.legacyId}`} style={{ textAlign: 'right', margin: '0.5rem 0 0 0' }}>{newsItem.title}</motion.h1>
                                </div>
                                {newsItem.game?.title && <GameLink gameName={newsItem.game.title} />}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', fontSize: '1.5rem' }}>
                                    <CreatorCredit label="بقلم" creators={newsItem.reporters} date={formattedDate} />
                                    <CreatorCredit label="تصميم" creators={newsItem.designers} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1.5rem' }}>
                                    <ContentActionBar contentId={newsItem.legacyId} contentType="news" contentSlug={newsItem.slug} />
                                </div>
                            </div>

                            <div ref={contentContainerRef} className={styles.articleBody}><PortableTextComponent content={newsItem.content || []} /></div>
                            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}><TagLinks tags={(newsItem.tags || []).map(t => t.title)} /></div>
                        </main>
                        <aside className={styles.reviewSidebar}>
                            <ContentBlock title="قد يروق لك"><div className={styles.relatedArticlesGrid}>{adaptedRelatedNews.map(related => ( <ArticleCard key={related.id} article={related} layoutIdPrefix="related-news" /> ))}</div></ContentBlock>
                        </aside>
                    </div>
                </motion.div>
                <div className="container" style={{ paddingBottom: '6rem' }}>
                    <div className="comments-block">{children}</div>
                </div>
            </motion.div>
        </>
    );
}