// app/articles/ArticlesPageClient.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import HorizontalShowcase from '@/components/HorizontalShowcase';
import ArticleFilters from '@/components/filters/ArticleFilters';
import ArticleCard from '@/components/ArticleCard';
import Image from 'next/image';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from '@/components/HorizontalShowcase.module.css';
import { ContentBlock } from '@/components/ContentBlock';
import { ArticleIcon } from '@/components/icons';
import { sanityLoader } from '@/lib/sanity.loader';
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel';
import ArticleCardSkeleton from '@/components/ui/ArticleCardSkeleton';
import { useContentStore } from '@/lib/contentStore';
import { batchFetchFullContentAction } from '@/app/actions/batchActions'; // IMPORT

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
    
    const paginate = (newDirection: number) => {
        const newIndex = (page + newDirection + articles.length) % articles.length;
        setPage([newIndex, newDirection]);
        onActiveIndexChange(newIndex);
    };

    const activeArticle = articles[page];
    const layoutIdPrefix = "articles-showcase";

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
                    <ArticleCard 
                        article={activeArticle}
                        layoutIdPrefix={layoutIdPrefix}
                        isPriority={true}
                        disableLivingEffect={false} 
                    />
                </motion.div>
            </AnimatePresence>
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
    
    const { hydrateContent, pageMap, hydrateIndex, appendToSection } = useContentStore(); // USE STORE

    // --- STATE INITIALIZATION WITH PERSISTENCE ---
    const storedData = pageMap.get('articles');
    const hasStoredData = storedData && storedData.grid && storedData.grid.length >= initialGridArticles.length;
    
    const sourceGrid = hasStoredData ? storedData.grid : initialGridArticles;
    const initialOffset = hasStoredData ? storedData.nextOffset : initialGridArticles.length;

    const initialCards = useMemo(() => sourceGrid.map((item: any) => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[], [sourceGrid]);
    const [allFetchedArticles, setAllFetchedArticles] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    
    // Store Initialization if empty
    useEffect(() => {
        if (!hasStoredData) {
            hydrateIndex('articles', {
                featured: featuredArticles,
                grid: initialGridArticles,
                allGames: allGames,
                allGameTags: allGameTags,
                allArticleTypeTags: allArticleTypeTags,
                nextOffset: initialGridArticles.length
            });
        }
    }, [hasStoredData, hydrateIndex, featuredArticles, initialGridArticles, allGames, allGameTags, allArticleTypeTags]);

    const [isGridReady, setIsGridReady] = useState(false);
    useEffect(() => {
        const t = requestAnimationFrame(() => {
            startTransition(() => setIsGridReady(true));
        });
        return () => cancelAnimationFrame(t);
    }, []);
    
    const [nextOffset, setNextOffset] = useState<number | null>(initialOffset);
    
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
    
    const canLoadMore = nextOffset !== null && !hasActiveFilters && !isLoading && isGridReady;

    const handleLoadMore = useCallback(async () => {
        if (!canLoadMore) return;
        setIsLoading(true);
        const params = new URLSearchParams({ offset: String(nextOffset), limit: '20', sort: sortOrder });
        try {
            const result = await fetchArticles(params);
            const newItems = result.data.filter((newItem: CardProps) => !allFetchedArticles.some(p => p.id === newItem.id));
            
            if (newItems.length > 0) {
                // BLOCKING: Fetch full content before updating UI
                const ids = newItems.map((i: CardProps) => i.id);
                const fullContent = await batchFetchFullContentAction(ids);
                
                // Hydrate & Persist
                hydrateContent(fullContent);
                appendToSection('articles', fullContent, result.nextOffset);

                // Update UI
                setAllFetchedArticles(prev => [...prev, ...newItems]);
            }
            
            setNextOffset(result.nextOffset);

        } catch (error) { 
            console.error("Failed to load more articles:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, [canLoadMore, nextOffset, sortOrder, allFetchedArticles, hydrateContent, appendToSection]);

    const handleGameTagToggle = (tag: SanityTag) => { setSelectedGameTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAllFilters = () => { setSelectedGame(null); setSelectedGameTags([]); setSelectedArticleType(null); setSearchTerm(''); setSortOrder('latest'); };
    
    const featuredForShowcase = useMemo(() => featuredArticles.map(item => adaptToCardProps(item, { width: 800 })).filter(Boolean) as CardProps[], [featuredArticles]);
    const activeBackgroundUrl = featuredForShowcase[activeIndex]?.imageUrl;

    return (
        <React.Fragment>
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
                    
                    {isGridReady ? (
                        <div className={styles.gridSection}>
                            <ArticleFilters sortOrder={sortOrder} onSortChange={setSortOrder} searchTerm={searchTerm} onSearchChange={setSearchTerm} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allGameTags={allGameTags} selectedGameTags={selectedGameTags} onGameTagToggle={handleGameTagToggle} allArticleTypeTags={allArticleTypeTags} selectedArticleType={selectedArticleType} onArticleTypeSelect={setSelectedArticleType} onClearAllFilters={handleClearAllFilters} />
                            
                            <ContentBlock title="كل المقالات" Icon={ArticleIcon}>
                                <motion.div layout className="content-grid gpu-cull">
                                    <AnimatePresence mode="popLayout">
                                        {gridArticles.map((article, index) => (
                                            <motion.div
                                                key={article.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ArticleCard 
                                                    key={article.id} 
                                                    article={article} 
                                                    layoutIdPrefix="articles-grid" 
                                                    isPriority={index < 3} 
                                                />
                                            </motion.div>
                                        ))}
                                        
                                        {isLoading && (
                                            <>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <ArticleCardSkeleton variant="no-score" />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <ArticleCardSkeleton variant="no-score" />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <ArticleCardSkeleton variant="no-score" />
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <InfiniteScrollSentinel onIntersect={handleLoadMore} />

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
                    ) : (
                         <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="spinner" />
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}