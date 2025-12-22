// app/articles/ArticlesPageClient.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import HorizontalShowcase from '@/components/HorizontalShowcase';
import ArticleFilters from '@/components/filters/ArticleFilters';
import ArticleCard from '@/components/ArticleCard';
import Image from 'next/image';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from '@/components/HorizontalShowcase.module.css';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { ContentBlock } from '@/components/ContentBlock';
import { ArticleIcon } from '@/components/icons';
import { sanityLoader } from '@/lib/sanity.loader';

const fetchArticles = async (params: URLSearchParams) => {
    const res = await fetch(`/api/articles?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch articles');
    return res.json();
};

const ArrowIcon = ({ direction = 'right' }: { direction?: 'left' | 'right' }) => (
    <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={direction === 'right' ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
    </svg>
);
  
const MobileShowcase = ({ articles, onActiveIndexChange }: { articles: CardProps[], onActiveIndexChange: (index: number) => void }) => {
    const [[page, direction], setPage] = useState([0, 0]);
    // Removed unused router/store hooks since ArticleCard handles navigation internally
    
    const paginate = (newDirection: number) => {
        const newIndex = (page + newDirection + articles.length) % articles.length;
        setPage([newIndex, newDirection]);
        onActiveIndexChange(newIndex);
    };

    const activeArticle = articles[page];
    const layoutIdPrefix = "articles-showcase";

    // Standard slide variants
    const variants = {
        enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50, scale: 0.9 }),
        center: { opacity: 1, x: 0, scale: 1 },
        exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 50 : -50, scale: 0.9 }),
    };

    return (
        <div className={styles.mobileShowcaseContainer}>
             <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div 
                    key={page} 
                    custom={direction} 
                    variants={variants} 
                    initial="enter" 
                    animate="center" 
                    exit="exit" 
                    className={styles.mobileShowcaseCardWrapper} 
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ height: '100%', width: '100%' }}
                >
                    {/* THE FIX: Use ArticleCard directly to get all visual features (3D, Tags, Credits, Scanlines) */}
                    <ArticleCard 
                        article={activeArticle}
                        layoutIdPrefix={layoutIdPrefix}
                        isPriority={true}
                        disableLivingEffect={false} // Ensure it's "alive" on mobile
                    />
                </motion.div>
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            <button className={`${styles.showcaseArrow} ${styles.left}`} onClick={() => paginate(-1)}><ArrowIcon direction="left" /></button>
            <button className={`${styles.showcaseArrow} ${styles.right}`} onClick={() => paginate(1)}><ArrowIcon direction="right" /></button>
        </div>
    );
};

export default function ArticlesPageClient({ featuredArticles, initialGridArticles, allGames, allGameTags, allArticleTypeTags }: {
  featuredArticles: SanityArticle[]; initialGridArticles: SanityArticle[]; allGames: SanityGame[]; allGameTags: SanityTag[]; allArticleTypeTags: SanityTag[];
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const intersectionRef = useRef(null);
    const isInView = useInView(intersectionRef, { margin: '400px' });

    const initialCards = useMemo(() => initialGridArticles.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[], [initialGridArticles]);
    const [allFetchedArticles, setAllFetchedArticles] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    
    const [nextOffset, setNextOffset] = useState<number | null>(initialCards.length >= 20 ? 20 : null);
    
    useEffect(() => { const checkMobile = () => setIsMobile(window.innerWidth <= 768); checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile); }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'latest' | 'viral'>('latest');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedGameTags, setSelectedGameTags] = useState<SanityTag[]>([]);
    const [selectedArticleType, setSelectedArticleType] = useState<SanityTag | null>(null);
    
    const gridArticles = useMemo(() => {
        let items = [...allFetchedArticles];
        if (searchTerm) { items = items.filter(article => article.title.toLowerCase().includes(searchTerm.toLowerCase())); }
        if (selectedGame) { items = items.filter(article => article.game === selectedGame.title); }
        const allSelectedTags = [...selectedGameTags, ...(selectedArticleType ? [selectedArticleType] : [])];
        if (allSelectedTags.length > 0) { const selectedTagTitles = new Set(allSelectedTags.map(t => t.title)); items = items.filter(article => article.tags.some(t => selectedTagTitles.has(t.title))); }
        return items;
    }, [allFetchedArticles, searchTerm, selectedGame, selectedGameTags, selectedArticleType]);

    const hasActiveFilters = useMemo(() => {
        return !!searchTerm || !!selectedGame || selectedGameTags.length > 0 || !!selectedArticleType || sortOrder !== 'latest';
    }, [searchTerm, selectedGame, selectedGameTags, selectedArticleType, sortOrder]);
    
    const canLoadMore = useMemo(() => {
        return nextOffset !== null && !hasActiveFilters;
    }, [nextOffset, hasActiveFilters]);

    useEffect(() => {
        if (isInView && canLoadMore && !isLoading) {
            const loadMore = async () => {
                setIsLoading(true);
                const params = new URLSearchParams({ offset: String(nextOffset), limit: '20', sort: sortOrder });
                try {
                    const result = await fetchArticles(params);
                    setAllFetchedArticles(prev => [...prev, ...result.data]);
                    setNextOffset(result.nextOffset);
                } catch (error) { console.error("Failed to load more articles:", error); } 
                finally { setIsLoading(false); }
            };
            loadMore();
        }
    }, [isInView, canLoadMore, isLoading, nextOffset, sortOrder]);

    const handleGameTagToggle = (tag: SanityTag) => { setSelectedGameTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAllFilters = () => { setSelectedGame(null); setSelectedGameTags([]); setSelectedArticleType(null); setSearchTerm(''); setSortOrder('latest'); };
    
    const featuredForShowcase = useMemo(() => featuredArticles.map(item => adaptToCardProps(item, { width: 800 })).filter(Boolean) as CardProps[], [featuredArticles]);
    const activeBackgroundUrl = featuredForShowcase[activeIndex]?.imageUrl;

    return (
        <React.Fragment>
            {/* AnimatedGridBackground removed */}
            <div className={styles.articlesPageContainer}>
                <AnimatePresence>
                    {activeBackgroundUrl && (
                        <motion.div key={activeBackgroundUrl} className={styles.articlesPageBg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Image 
                                loader={sanityLoader}
                                src={activeBackgroundUrl} 
                                alt="Dynamic background" 
                                fill 
                                style={{ objectFit: 'cover' }} 
                            />
                            <div className={styles.articlesPageBgOverlay} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem', minHeight: '80vh' }}>
                    <h1 className="page-title" style={{ color: '#fff', textShadow: '0 3px 15px rgba(0,0,0,0.5)', fontSize: '5rem', marginTop: '0.7rem', marginBottom: '4rem' }}>أحدث المقالات</h1>
                    <div className={styles.showcaseSection}>{isMobile ? (<MobileShowcase articles={featuredForShowcase} onActiveIndexChange={setActiveIndex} />) : (<HorizontalShowcase articles={featuredForShowcase} onActiveIndexChange={setActiveIndex} />)}</div>
                    <div className={styles.gridSection}>
                        <ArticleFilters sortOrder={sortOrder} onSortChange={setSortOrder} searchTerm={searchTerm} onSearchChange={setSearchTerm} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allGameTags={allGameTags} selectedGameTags={selectedGameTags} onGameTagToggle={handleGameTagToggle} allArticleTypeTags={allArticleTypeTags} selectedArticleType={selectedArticleType} onArticleTypeSelect={setSelectedArticleType} onClearAllFilters={handleClearAllFilters} />
                        
                        <ContentBlock title="كل المقالات" Icon={ArticleIcon}>
                            <motion.div 
                                layout 
                                className="content-grid gpu-cull" // Restored
                            >
                                <AnimatePresence>
                                    {gridArticles.map((article, index) => ( <ArticleCard key={article.id} article={article} layoutIdPrefix="articles-grid" isPriority={index < 3} /> ))}
                                </AnimatePresence>
                            </motion.div>

                            <div ref={intersectionRef} style={{ height: '1px', margin: '1rem 0' }} />

                            <AnimatePresence>
                                {isLoading && ( <motion.div key="loading" style={{display: 'flex', justifyContent: 'center', padding: '4rem'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}> <div className="spinner" /> </motion.div> )}
                            </AnimatePresence>
                            
                            <AnimatePresence>
                                {(!isLoading && gridArticles.length > 0 && (nextOffset === null || hasActiveFilters)) && (
                                    <motion.p key="end" style={{textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {hasActiveFilters ? 'أزِل المرشحات للمزيد.' : 'بلغتَ المنتهى.'}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {gridArticles.length === 0 && !isLoading && ( <motion.p key="no-match" style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}> لم نعثر على مقالاتٍ توافقُ مُرادك. </motion.p> )}
                        </ContentBlock>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}