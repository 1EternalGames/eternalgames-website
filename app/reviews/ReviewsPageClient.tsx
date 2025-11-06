// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import ReviewFilters, { ScoreFilter } from '@/components/filters/ReviewFilters';
import ArticleCard from '@/components/ArticleCard';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from './ReviewsPage.module.css';

const fetchReviews = async (params: URLSearchParams) => {
    const res = await fetch(`/api/reviews?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
};

export default function ReviewsPageClient({ heroReview, initialGridReviews, allGames, allTags }: { heroReview: SanityReview, initialGridReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
    const intersectionRef = useRef(null);
    const isInView = useInView(intersectionRef, { rootMargin: '400px' });

    // --- REFACTORED STATE ---
    const initialCards = useMemo(() => initialGridReviews.map(adaptToCardProps).filter(Boolean) as CardProps[], [initialGridReviews]);
    const [allFetchedReviews, setAllFetchedReviews] = useState<CardProps[]>(initialCards); // Holds ALL items fetched.
    const [isLoading, setIsLoading] = useState(false);
    const [nextOffset, setNextOffset] = useState<number | null>(initialCards.length === 20 ? 20 : null);
    
    // --- FILTER STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSort, setActiveSort] = useState<'latest' | 'score'>('latest');
    const [selectedScoreRange, setSelectedScoreRange] = useState<ScoreFilter>('All');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>([]);

    // --- DERIVED STATE FOR DISPLAY ---
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
        // 'latest' sort is the default from the API, so no client-side sort is needed.

        return items;
    }, [allFetchedReviews, searchTerm, activeSort, selectedScoreRange, selectedGame, selectedTags]);
    
    const canLoadMore = useMemo(() => {
        return nextOffset !== null && !searchTerm && selectedScoreRange === 'All' && !selectedGame && selectedTags.length === 0;
    }, [nextOffset, searchTerm, selectedScoreRange, selectedGame, selectedTags]);

    // --- MODIFIED EFFECT: INFINITE SCROLL ---
    useEffect(() => {
        if (isInView && canLoadMore && !isLoading) {
            const loadMore = async () => {
                setIsLoading(true);
                const params = new URLSearchParams({ offset: String(nextOffset), limit: '20', sort: activeSort });
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
    }, [isInView, canLoadMore, isLoading, nextOffset, activeSort]);

    const handleTagToggle = (tag: SanityTag) => { setSelectedTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAll = () => { setSearchTerm(''); setSelectedScoreRange('All'); setSelectedGame(null); setSelectedTags([]); setActiveSort('latest'); };

    return (
        <>
            <div className={styles.reviewHero}>
                <Image src={heroReview.mainImage.url} alt={`Background for ${heroReview.title}`} fill className={styles.heroBg} style={{ objectFit: 'cover' }} priority placeholder='blur' blurDataURL={heroReview.mainImage.blurDataURL} />
                <div className={styles.heroOverlay} />
                <motion.div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 5, color: '#fff', textAlign: 'center' }} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}}>
                    <p className={styles.heroCategory}>الأعلى تقييمًا</p>
                    <div className={styles.titleScoreWrapper}>
                        <h1 className={styles.heroTitle}>{heroReview.title}</h1>
                        <span className={styles.heroScore}>{heroReview.score?.toFixed(1)}</span>
                    </div>
                    {heroReview.game?.title && (<span className={styles.heroGame}>{heroReview.game.title}</span>)}
                    <Link href={`/reviews/${heroReview.slug}`} className="primary-button no-underline" style={{padding: '1rem 2.4rem', fontSize: '1.6rem'}}>اقرأ المراجعة</Link>
                </motion.div>
            </div>
            
            <div className="container" style={{paddingTop: '4rem'}}>
                <ReviewFilters activeSort={activeSort} onSortChange={setActiveSort} selectedScoreRange={selectedScoreRange} onScoreSelect={setSelectedScoreRange} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                
                <div style={{marginBottom: '6rem'}}>
                    <h2 className="section-title" style={{textAlign: 'right', marginBottom: '3rem', fontSize: 'clamp(2.8rem, 4vw, 3.6rem)'}}>جميع المراجعات</h2>
                    <motion.div layout className="content-grid">
                        <AnimatePresence>
                            {gridReviews.map((review, index) => (
                                <ArticleCard
                                    key={review.id}
                                    article={review}
                                    layoutIdPrefix="reviews"
                                    isPriority={index < 3}
                                />
                            ))}
                        </AnimatePresence>
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
                        {(!canLoadMore && !isLoading && gridReviews.length > 0) && (
                             <motion.p key="end" style={{textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {canLoadMore ? 'وصلت إلى نهاية الأرشيف.' : 'امسح المرشحات لتحميل المزيد.'}
                             </motion.p>
                        )}
                    </AnimatePresence>

                    {gridReviews.length === 0 && !isLoading && (
                        <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            لا توجد مراجعات تطابق ما اخترت.
                        </motion.p>
                    )}
                </div>
            </div>
        </>
    );
}