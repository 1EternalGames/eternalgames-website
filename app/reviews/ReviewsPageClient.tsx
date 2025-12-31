// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect, startTransition, useCallback } from 'react';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReviewFilters, { ScoreFilter } from '@/components/filters/ReviewFilters';
import ArticleCard from '@/components/ArticleCard';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from './ReviewsPage.module.css';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useRouter } from 'next/navigation';
import { ContentBlock } from '@/components/ContentBlock';
import { ReviewIcon } from '@/components/icons';
import { sanityLoader } from '@/lib/sanity.loader';
import { useContentStore } from '@/lib/contentStore';
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel';
import ArticleCardSkeleton from '@/components/ui/ArticleCardSkeleton';
import { loadMoreReviews } from '@/app/actions/batchActions';

export default function ReviewsPageClient({ heroReview, initialGridReviews, allGames, allTags }: { heroReview: SanityReview, initialGridReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const { openOverlay, hydrateContent, pageMap, appendToSection, hydrateIndex } = useContentStore();

    const storedData = pageMap.get('reviews');
    const hasStoredData = storedData && storedData.grid && storedData.grid.length >= initialGridReviews.length;
    const sourceGrid = hasStoredData ? storedData.grid : initialGridReviews;
    const initialOffset = hasStoredData ? storedData.nextOffset : initialGridReviews.length;

    const initialCards = useMemo(() => sourceGrid.map((item: any) => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[], [sourceGrid]);
    const [allFetchedReviews, setAllFetchedReviews] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- OPTIMIZATION: Deferred Rendering ---
    const [isGridReady, setIsGridReady] = useState(false);
    useEffect(() => {
        const t = requestAnimationFrame(() => {
            startTransition(() => setIsGridReady(true));
        });
        return () => cancelAnimationFrame(t);
    }, []);
    // ----------------------------------------
    
    const [nextOffset, setNextOffset] = useState<number | null>(initialOffset);
    
    useEffect(() => {
        if (!hasStoredData) {
            hydrateIndex('reviews', {
                hero: heroReview,
                grid: initialGridReviews,
                allGames: allGames,
                allTags: allTags,
                nextOffset: initialGridReviews.length
            });
        }
    }, [hasStoredData, hydrateIndex, heroReview, initialGridReviews, allGames, allTags]);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSort, setActiveSort] = useState<'latest' | 'score'>('latest');
    const [selectedScoreRange, setSelectedScoreRange] = useState<ScoreFilter>('All');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>([]);

    const gridReviews = useMemo(() => {
        let items = [...allFetchedReviews];
        
        if (heroReview) {
            items = items.filter(item => item.id !== heroReview._id);
        }
        
        if (searchTerm) items = items.filter(review => review.title.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (selectedScoreRange !== 'All') {
            const rangeMap = { '9-10': [9, 10], '8-8.9': [8, 8.9], '7-7.9': [7, 7.9], '<7': [0, 6.9] };
            if (rangeMap[selectedScoreRange]) {
                const [min, max] = rangeMap[selectedScoreRange];
                items = items.filter(review => review.score! >= min && review.score! <= max);
            }
        }
        if (selectedGame) items = items.filter(review => review.game === selectedGame.title);
        if (selectedTags.length > 0) {
            const selectedTagTitles = new Set(selectedTags.map(t => t.title));
            items = items.filter(review => review.tags.some(t => selectedTagTitles.has(t.title)));
        }

        if (activeSort === 'score') items.sort((a, b) => (b.score || 0) - (a.score || 0));

        return items;
    }, [allFetchedReviews, searchTerm, activeSort, selectedScoreRange, selectedGame, selectedTags, heroReview]);
    
    const hasActiveFilters = useMemo(() => {
        return !!searchTerm || selectedScoreRange !== 'All' || !!selectedGame || selectedTags.length > 0 || activeSort !== 'latest';
    }, [searchTerm, selectedScoreRange, selectedGame, selectedTags, activeSort]);

    const canLoadMore = nextOffset !== null && !hasActiveFilters && !isLoading && isGridReady;

    const handleLoadMore = useCallback(async () => {
        if (!canLoadMore) return;
        setIsLoading(true);
        
        try {
            const result = await loadMoreReviews({
                offset: nextOffset as number,
                limit: 20,
                sort: activeSort,
                scoreRange: selectedScoreRange !== 'All' ? selectedScoreRange : undefined
            });

            if (result.cards.length === 0) {
                setNextOffset(null);
            } else {
                const newCards = result.cards.filter((newItem: CardProps) => !allFetchedReviews.some(p => p.id === newItem.id));
                
                if (newCards.length > 0) {
                    hydrateContent(result.fullContent);
                    // NEW: Hydrate pre-fetched Game Hubs
                    if (result.hubs) {
                        hydrateContent(result.hubs);
                    }
                    
                    appendToSection('reviews', result.fullContent, result.nextOffset);
                    setAllFetchedReviews(prev => [...prev, ...newCards]);
                }
                setNextOffset(result.nextOffset);
            }
        } catch (error) { 
            console.error("Failed to load more reviews:", error);
            setNextOffset(null); 
        } finally {
            setIsLoading(false);
        }
    }, [canLoadMore, nextOffset, activeSort, selectedScoreRange, allFetchedReviews, hydrateContent, appendToSection]);

    const handleTagToggle = (tag: SanityTag) => { setSelectedTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAll = () => { setSearchTerm(''); setSelectedScoreRange('All'); setSelectedGame(null); setSelectedTags([]); setActiveSort('latest'); };

    const handleHeroClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPrefix('reviews-hero');
        const slugStr = typeof heroReview.slug === 'string' ? heroReview.slug : (heroReview.slug as any).current;
        if (slugStr) {
            openOverlay(slugStr, 'reviews', 'reviews-hero', heroReview.mainImage.url);
        }
    };

    return (
        <>
            <motion.div layoutId={`reviews-hero-card-container-${heroReview.legacyId}`} className={styles.reviewHero}>
                <motion.div layoutId={`reviews-hero-card-image-${heroReview.legacyId}`} className={styles.heroBg}>
                    <Image 
                        loader={sanityLoader} 
                        src={heroReview.mainImage.url} 
                        alt={`Background for ${heroReview.title}`} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        priority 
                        // FIX: Conditional blur data
                        placeholder={heroReview.mainImage.blurDataURL ? 'blur' : 'empty'} 
                        blurDataURL={heroReview.mainImage.blurDataURL} 
                    />
                </motion.div>
                <div className={styles.heroOverlay} />
                <motion.div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 5, color: '#fff', textAlign: 'center' }} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}}>
                    <p className={styles.heroCategory}>الأعلى تقييمًا</p>
                    <div className={styles.titleScoreWrapper}>
                        <motion.h1 layoutId={`reviews-hero-card-title-${heroReview.legacyId}`} className={styles.heroTitle}>{heroReview.title}</motion.h1>
                        <span className={styles.heroScore}>{heroReview.score?.toFixed(1)}</span>
                    </div>
                    {heroReview.game?.title && (<span className={styles.heroGame}>{heroReview.game.title}</span>)}
                    <button onClick={handleHeroClick} className="primary-button no-underline" style={{padding: '1rem 2.4rem', fontSize: '1.6rem'}}>اقرأ المراجعة</button>
                </motion.div>
            </motion.div>
            
            <div className="container" style={{paddingTop: '4rem'}}>
                <ReviewFilters activeSort={activeSort} onSortChange={setActiveSort} selectedScoreRange={selectedScoreRange} onScoreSelect={setSelectedScoreRange} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                
                {/* RENDER GRID ONLY AFTER FRAME DELAY */}
                {isGridReady ? (
                    <ContentBlock title="كل المراجعات" Icon={ReviewIcon}>
                        <div className="content-grid gpu-cull">
                            {gridReviews.map((review, index) => (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index % 10 * 0.05 }} 
                                >
                                    <ArticleCard
                                        key={review.id}
                                        article={review}
                                        layoutIdPrefix="reviews"
                                        isPriority={index < 3}
                                    />
                                </motion.div>
                            ))}
                            
                            {isLoading && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><ArticleCardSkeleton /></motion.div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.1 }}><ArticleCardSkeleton /></motion.div>
                                </>
                            )}
                        </div>
                        
                        <InfiniteScrollSentinel onIntersect={handleLoadMore} />

                        <AnimatePresence>
                            {(!isLoading && gridReviews.length > 0 && (nextOffset === null || hasActiveFilters)) && (
                                <motion.p key="end" style={{textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {hasActiveFilters ? 'أزِل المرشحات للمزيد.' : 'بلغتَ المنتهى.'}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {gridReviews.length === 0 && !isLoading && (
                            <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                لا مراجعات توافقُ ما اخترت.
                            </motion.p>
                        )}
                    </ContentBlock>
                ) : (
                    <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                )}
            </div>
        </>
    );
}