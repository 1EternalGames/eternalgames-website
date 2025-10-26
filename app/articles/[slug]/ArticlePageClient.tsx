// app/articles/[slug]/ArticlePageClient.tsx
'use client';

import type { SanityArticle } from '@/types/sanity';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { adaptToCardProps } from '@/lib/adapters';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

import TagLinks from '@/components/TagLinks';
import { ContentBlock } from '@/components/ContentBlock';
import ContentActionBar from '@/components/ContentActionBar';
import PortableTextComponent from '@/components/PortableTextComponent';
import ArticleCard from '@/components/ArticleCard';
import CreatorCredit from '@/components/CreatorCredit';
import GameLink from '@/components/GameLink';
import ReadingHud from '@/components/ReadingHud';
import { Heading } from '@/app/reviews/[slug]/ReviewPageClient';
import styles from './ArticlePage.module.css';

const contentVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.3, duration: 0.5 } }, };

export default function ArticlePageClient({ article, comments }: { article: SanityArticle; comments: React.ReactNode }) {
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || 'articles-grid';
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
    }, [article]);
        
    if (!article) return null;

    const uniqueRelatedArticles = article.relatedArticles ? Array.from(new Map(article.relatedArticles.map(item => [item._id, item])).values()) : [];
    const adaptedRelatedArticles = (uniqueRelatedArticles || []).map(adaptToCardProps).filter(Boolean);
    
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const publishedDate = new Date(article.publishedAt);
    const day = publishedDate.getDate();
    const year = publishedDate.getFullYear();
    const monthIndex = publishedDate.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

    return (
        <>
            <motion.div initial="hidden" animate="visible" variants={contentVariants}><ReadingHud contentContainerRef={contentContainerRef} headings={headings} /></motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <motion.div layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`} className={styles.articleHeaderImage}>
                    <Image src={article.mainImage.url} alt={article.title} fill style={{ objectFit: 'cover' }} priority placeholder="blur" blurDataURL={article.mainImage.blurDataURL} />
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={contentVariants} className="container page-container" style={{ paddingTop: '0' }}>
                    <div className={styles.reviewLayout}>
                        <main>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <motion.h1 layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`} className="page-title" style={{ textAlign: 'right', margin: 0 }}>{article.title}</motion.h1>
                                {article.game?.title && <GameLink gameName={article.game.title} />}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', fontSize: '1.5rem' }}>
                                    <CreatorCredit label="بقلم" creators={article.authors} date={formattedDate} />
                                    <CreatorCredit label="تصميم" creators={article.designers} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1.5rem' }}>
                                    <ContentActionBar contentId={article.legacyId} contentType="article" contentSlug={article.slug} />
                                </div>
                            </div>
                            
                            <div ref={contentContainerRef} className="article-body"><PortableTextComponent content={article.content || []} /></div>
                            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}><TagLinks tags={(article.tags || []).map(t => t.title)} /></div>
                        </main>
                        <aside className={styles.reviewSidebar}>
                            <ContentBlock title="قد يروق لك"><div className={styles.relatedArticlesGrid}>{adaptedRelatedArticles.map(related => ( <ArticleCard key={related.id} article={related} layoutIdPrefix="related-article" isArticle={true} /> ))}</div></ContentBlock>
                        </aside>
                    </div>
                </motion.div>
                <div className="container" style={{ paddingBottom: '6rem' }}>
                    <ContentBlock title="حديث المجتمع">{comments}</ContentBlock>
                </div>
            </motion.div>
        </>
    );
}