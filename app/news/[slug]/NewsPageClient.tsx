// app/news/[slug]/NewsPageClient.tsx
'use client';

import type { SanityNews } from '@/types/sanity';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { adaptToCardProps } from '@/lib/adapters';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

import TagLinks from '@/components/TagLinks';
import ContentActionBar from '@/components/ContentActionBar';
import PortableTextComponent from '@/components/PortableTextComponent';
import { ContentBlock } from '@/components/ContentBlock';
import ArticleCard from '@/components/ArticleCard';
import CreatorCredit from '@/components/CreatorCredit';
import styles from './NewsPage.module.css';

export default function NewsPageClient({ newsItem, children }: { newsItem: SanityNews & { relatedNews?: any[] }; children: React.ReactNode }) {
    const layoutIdPrefix = useLayoutIdStore((state) => state.prefix) || 'news-grid';

    if (!newsItem) return null;

    const uniqueRelatedNews = newsItem.relatedNews
        ? Array.from(new Map(newsItem.relatedNews.map(item => [item._id, item])).values())
        : [];
        
    const adaptedRelatedNews = (uniqueRelatedNews || []).map(adaptToCardProps).filter(Boolean);

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const date = new Date(newsItem.publishedAt);
    const day = date.getDate();
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.div layoutId={`${layoutIdPrefix}-card-container-${newsItem.legacyId}`}>
                <motion.div className={styles.newsHeroImage} layoutId={`${layoutIdPrefix}-card-image-${newsItem.legacyId}`}><Image src={newsItem.mainImage.url} alt={newsItem.title} fill style={{ objectFit: 'cover' }} priority placeholder="blur" blurDataURL={newsItem.mainImage.blurDataURL} /></motion.div>
            </motion.div>
            <div className="container page-container" style={{ paddingTop: '0' }}>
                <div className={styles.reviewLayout}>
                    <main>
                        <p className="news-card-category" style={{ textAlign: 'right', margin: '1.5rem 0' }}>{newsItem.category}</p>
                        <motion.h1 className="page-title" layoutId={`${layoutIdPrefix}-card-title-${newsItem.legacyId}`} style={{ textAlign: 'right', marginTop: 0 }}>{newsItem.title}</motion.h1>
                        
                        {/* --- UNIFIED METADATA BLOCK START --- */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                            {/* RIGHT SIDE (Creator/Date) */}
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <CreatorCredit label="بقلم" creators={newsItem.reporters} />
                                <CreatorCredit label="تصميم" creators={newsItem.designers} />
                                <p style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-secondary)' }}>نُشر في: {formattedDate}</p>
                            </div>

                            {/* LEFT SIDE (Actions) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
                                <ContentActionBar contentId={newsItem.legacyId} contentType="خبر" contentSlug={newsItem.slug} />
                            </div>
                        </div>
                        {/* --- UNIFIED METADATA BLOCK END --- */}

                        <div className={styles.articleBody}><PortableTextComponent content={newsItem.content || []} /></div>
                        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}><TagLinks tags={(newsItem.tags || []).map(t => t.title)} /></div>
                    </main>
                    <aside className={styles.reviewSidebar}>
                        <ContentBlock title="قد يروق لك"><div className={styles.relatedArticlesGrid}>{adaptedRelatedNews.map(related => ( <ArticleCard key={related.id} article={related} layoutIdPrefix="related-news" /> ))}</div></ContentBlock>
                    </aside>
                </div>
            </div>
            <div className="container" style={{ paddingBottom: '6rem' }}>
                <div className="comments-block">{children}</div>
            </div>
        </motion.div>
    );
}


