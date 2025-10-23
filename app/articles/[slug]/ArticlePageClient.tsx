// app/articles/[slug]/ArticlePageClient.tsx
'use client';

import type { SanityArticle } from '@/types/sanity';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { adaptToCardProps } from '@/lib/adapters';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

import TagLinks from '@/components/TagLinks';
import { ContentBlock } from '@/components/ContentBlock';
import ContentActionBar from '@/components/ContentActionBar';
import PortableTextComponent from '@/components/PortableTextComponent';
import ArticleCard from '@/components/ArticleCard';
import CreatorCredit from '@/components/CreatorCredit';
import styles from './ArticlePage.module.css';

export default function ArticlePageClient({ article, comments }: { article: SanityArticle; comments: React.ReactNode }) {
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || 'articles-grid';
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
        
    if (!article) return null;

    const uniqueRelatedArticles = article.relatedArticles
        ? Array.from(new Map(article.relatedArticles.map(item => [item._id, item])).values())
        : [];

    const adaptedRelatedArticles = (uniqueRelatedArticles || []).map(adaptToCardProps).filter(Boolean);
    
    // Unified Date Formatting (copied from lib/adapters.ts to unify here)
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const publishedDate = new Date(article.publishedAt);
    const day = publishedDate.getDate();
    const year = publishedDate.getFullYear();
    const monthIndex = publishedDate.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <motion.div layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`} className={styles.articleHeaderImage}>
                    <Image src={article.mainImage.url} alt={article.title} fill style={{ objectFit: 'cover' }} priority placeholder="blur" blurDataURL={article.mainImage.blurDataURL} />
                </motion.div>

                <div className="container page-container" style={{ paddingTop: '0' }}>
                    <div className={styles.reviewLayout}>
                        <main>
                            <motion.h1 layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`} className="page-title" style={{ textAlign: 'right', marginTop: '1.5rem' }}>{article.title}</motion.h1>
                            
                            {/* --- UNIFIED METADATA BLOCK START --- */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                {/* RIGHT SIDE (Creator/Date) */}
                                <div style={{ color: 'var(--text-secondary)', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <CreatorCredit label="بقلم" creators={article.authors} />
                                    <CreatorCredit label="تصميم" creators={article.designers} />
                                    <p style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-secondary)' }}>نُشر في: {formattedDate}</p>
                                </div>

                                {/* LEFT SIDE (Actions) */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
                                    <ContentActionBar contentId={article.legacyId} contentType="مقالة" contentSlug={article.slug} />
                                </div>
                            </div>
                            {/* --- UNIFIED METADATA BLOCK END --- */}
                            
                            <div className="article-body"><PortableTextComponent content={article.content || []} /></div>
                            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}><TagLinks tags={(article.tags || []).map(t => t.title)} /></div>
                        </main>
                        <aside className={styles.reviewSidebar}>
                            <ContentBlock title="قد يروق لك"><div className={styles.relatedArticlesGrid}>{adaptedRelatedArticles.map(related => ( <ArticleCard key={related.id} article={related} layoutIdPrefix="related-article" isArticle={true} /> ))}</div></ContentBlock>
                        </aside>
                    </div>
                </div>
                <div className="container" style={{ paddingBottom: '6rem' }}>
                    <ContentBlock title="حديث المجتمع">{comments}</ContentBlock>
                </div>
            </motion.div>
        </>
    );
}


