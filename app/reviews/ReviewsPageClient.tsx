// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import ReviewFilters, { ScoreFilter } from '@/components/filters/ReviewFilters';
import FilteredReviewsGrid from '@/components/FilteredReviewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
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
    const isIntersecting = useInView(intersectionRef);

    const initialCards = useMemo(() => initialGridReviews.map(adaptToCardProps).filter(Boolean) as CardProps[], [initialGridReviews]);
    
    const [reviews, setReviews] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    const [nextOffset, setNextOffset] = useState<number | null>(initialCards.length === 20 ? 20 : null);
    const [isFeedExhausted, setIsFeedExhausted] = useState(initialCards.length < 20);

    // Replaced useUrlState with standard useState
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSort, setActiveSort] = useState<'latest' | 'score'>('latest');
    const [selectedScoreRange, setSelectedScoreRange] = useState<ScoreFilter>('All');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>([]);

    const currentFilters = useMemo(() => ({ searchTerm, activeSort, selectedScoreRange, selectedGame, selectedTags }), [searchTerm, activeSort, selectedScoreRange, selectedGame, selectedTags]);
    const hasActiveFilters = searchTerm || activeSort !== 'latest' || selectedScoreRange !== 'All' || !!selectedGame || selectedTags.length > 0;

    useEffect(() => {
        const filtersAreDefault = !hasActiveFilters;
        if (filtersAreDefault) {
            setReviews(initialCards);
            setNextOffset(initialCards.length === 20 ? 20 : null);
            setIsFeedExhausted(initialCards.length < 20);
            return;
        }

        const fetchAndReplace = async () => {
            setIsLoading(true);
            setIsFeedExhausted(false);
            const params = new URLSearchParams({ offset: '0', limit: '20' });
            if (searchTerm) params.set('q', searchTerm);
            if (activeSort !== 'latest') params.set('sort', activeSort);
            if (selectedScoreRange !== 'All') params.set('score', selectedScoreRange);
            if (selectedGame) params.set('game', selectedGame.slug);
            if (selectedTags.length > 0) params.set('tags', selectedTags.map(t => t.slug).join(','));

            try {
                const result = await fetchReviews(params);
                const uniqueNewItems = result.data.filter((item: CardProps) => item.id !== heroReview._id);
                setReviews(uniqueNewItems);
                setNextOffset(result.nextOffset);
                if (!result.nextOffset) setIsFeedExhausted(true);
            } catch (error) {
                console.error("Filter change fetch failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndReplace();
    }, [currentFilters, initialCards, heroReview._id, hasActiveFilters]);

    useEffect(() => {
        if (isIntersecting && nextOffset !== null && !isLoading) {
            const loadMore = async () => {
                setIsLoading(true);
                const params = new URLSearchParams({ offset: String(nextOffset), limit: '20' });
                if (searchTerm) params.set('q', searchTerm);
                if (activeSort !== 'latest') params.set('sort', activeSort);
                if (selectedScoreRange !== 'All') params.set('score', selectedScoreRange);
                if (selectedGame) params.set('game', selectedGame.slug);
                if (selectedTags.length > 0) params.set('tags', selectedTags.map(t => t.slug).join(','));

                try {
                    const result = await fetchReviews(params);
                    setReviews(prev => [...prev, ...result.data]);
                    setNextOffset(result.nextOffset);
                    if (!result.nextOffset) setIsFeedExhausted(true);
                } catch (error) {
                    console.error("Failed to load more reviews:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadMore();
        }
    }, [isIntersecting, nextOffset, isLoading, currentFilters]);

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
                
                <ContentBlock title="جميع المراجعات">
                    <FilteredReviewsGrid reviews={reviews} />
                    <AnimatePresence>
                        {(isLoading && nextOffset !== null) && (
                            <motion.div key="loading" style={{display: 'flex', justifyContent: 'center', padding: '4rem'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="spinner" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={intersectionRef} style={{ height: '1px', margin: '1rem 0' }} />
                    <AnimatePresence>
                        {(isFeedExhausted && reviews.length > 0 && !isLoading) && (
                             <motion.p key="end" style={{textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>وصلت إلى نهاية الأرشيف.</motion.p>
                        )}
                    </AnimatePresence>
                    {(!isLoading && reviews.length === 0 && hasActiveFilters) && (
                        <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>لا توجد مراجعات تطابق ما اخترت.</motion.p>
                    )}
                </ContentBlock>
            </div>
        </>
    );
}