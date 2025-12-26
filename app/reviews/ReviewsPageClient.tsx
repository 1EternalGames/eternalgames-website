// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect, startTransition } from 'react';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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

const fetchReviews = async (params: URLSearchParams) => {
    const res = await fetch(`/api/reviews?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
};

export default function ReviewsPageClient({ heroReview, initialGridReviews, allGames, allTags }: { heroReview: SanityReview, initialGridReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
    const intersectionRef = useRef(null);
    const isInView = useInView(intersectionRef, { margin: '400px' });
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const router = useRouter();
    
    const { openOverlay } = useContentStore();

    const initialCards = useMemo(() => initialGridReviews.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[], [initialGridReviews]);
    const [allFetchedReviews, setAllFetchedReviews] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    const [isGridReady, setIsGridReady] = useState(false);
    
    useEffect(() => {
        const t = requestAnimationFrame(() => {
            startTransition(() => setIsGridReady(true));
        });
        return () => cancelAnimationFrame(t);
    }, []);
    
    const [nextOffset, setNextOffset] = useState<number | null>(initialCards.length >= 20 ? 20 : null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSort, setActiveSort] = useState<'latest' | 'score'>('latest');
    const [selectedScoreRange, setSelectedScoreRange] = useState<ScoreFilter>('All');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>([]);

    const gridReviews = useMemo(() => {
        let items = [...allFetchedReviews];
        
        if (searchTerm) {
            items = items.filter(review => review.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedScoreRange !== 'All') {
            const rangeMap = { '9-10': [9, 10], '8-8.9': [8, 8.9], '7-7.9': [7, 7.9], '<7': [0, 6.9] };
            if (rangeMap[selectedScoreRange]) {
                const [min, max] = rangeMap[selectedScoreRange];
                items = items.filter(review => review.score! >= min && review.score! <= max);
            }
        }
        if (selectedGame) {
            items = items.filter(review => review.game === selectedGame.title);
        }
        if (selectedTags.length > 0) {
            const selectedTagTitles = new Set(selectedTags.map(t => t.title));
            items = items.filter(review => review.tags.some(t => selectedTagTitles.has(t.title)));
        }

        if (activeSort === 'score') {
            items.sort((a, b) => (b.score || 0) - (a.score || 0));
        }

        return items;
    }, [allFetchedReviews, searchTerm, activeSort, selectedScoreRange, selectedGame, selectedTags]);
    
    const hasActiveFilters = useMemo(() => {
        return !!searchTerm || selectedScoreRange !== 'All' || !!selectedGame || selectedTags.length > 0 || activeSort !== 'latest';
    }, [searchTerm, selectedScoreRange, selectedGame, selectedTags, activeSort]);

    const canLoadMore = useMemo(() => {
        return nextOffset !== null && !hasActiveFilters;
    }, [nextOffset, hasActiveFilters]);

    useEffect(() => {
        if (isInView && canLoadMore && !isLoading && isGridReady) {
            const loadMore = async () => {
                setIsLoading(true);
                const params = new URLSearchParams({ offset: String(nextOffset), limit: '20', sort: activeSort });
                if(selectedScoreRange !== 'All') params.set('score', selectedScoreRange);
                try {
                    const result = await fetchReviews(params);
                    setAllFetchedReviews(prev => [...prev, ...result.data]);
                    setNextOffset(result.nextOffset);
                } catch (error) { 
                    console.error("Failed to load more reviews:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadMore();
        }
    }, [isInView, canLoadMore, isLoading, nextOffset, activeSort, selectedScoreRange, isGridReady]);

    const handleTagToggle = (tag: SanityTag) => { setSelectedTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAll = () => { setSearchTerm(''); setSelectedScoreRange('All'); setSelectedGame(null); setSelectedTags([]); setActiveSort('latest'); };

    const handleHeroClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPrefix('reviews-hero');
        // FIX: The slug in SanityReview is typed as string, not object with current
        if (heroReview.slug) {
            openOverlay(
                heroReview.slug, 
                'reviews', 
                'reviews-hero', 
                heroReview.mainImage.url
            );
        }
    };

    return (
        <>
            <motion.div
                layoutId={`reviews-hero-card-container-${heroReview.legacyId}`}
                className={styles.reviewHero}
            >
                <motion.div layoutId={`reviews-hero-card-image-${heroReview.legacyId}`} className={styles.heroBg}>
                    <Image 
                        loader={sanityLoader}
                        src={heroReview.mainImage.url} 
                        alt={`Background for ${heroReview.title}`} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        priority 
                        placeholder='blur' 
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
                    <button onClick={handleHeroClick} className="primary-button no-underline" style={{padding: '1rem 2.4rem', fontSize: '1.6rem'}}>
                        اقرأ المراجعة
                    </button>
                </motion.div>
            </motion.div>
            
            <div className="container" style={{paddingTop: '4rem'}}>
                <ReviewFilters activeSort={activeSort} onSortChange={setActiveSort} selectedScoreRange={selectedScoreRange} onScoreSelect={setSelectedScoreRange} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                
                {isGridReady ? (
                    <ContentBlock title="كل المراجعات" Icon={ReviewIcon}>
                        <motion.div 
                            layout 
                            className="content-grid gpu-cull" 
                        >
                            {gridReviews.map((review, index) => (
                                <ArticleCard
                                    key={review.id}
                                    article={review}
                                    layoutIdPrefix="reviews"
                                    isPriority={index < 3}
                                />
                            ))}
                        </motion.div>
                        
                        <div ref={intersectionRef} style={{ height: '1px', margin: '1rem 0' }} />

                        <AnimatePresence>
                            {isLoading && (
                                <motion.div key="loading" style={{display: 'flex', justifyContent: 'center', padding: '4rem'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="spinner" />
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                    <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div className="spinner" />
                    </div>
                )}
            </div>
        </>
    );
}