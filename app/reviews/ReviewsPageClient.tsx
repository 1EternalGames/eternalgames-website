// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReviewFilters, { ScoreFilter } from '@/components/filters/ReviewFilters';
import ArticleCard from '@/components/ArticleCard';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from './ReviewsPage.module.css';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function ReviewsPageClient({ heroReview, initialGridReviews, allGames, allTags }: { heroReview: SanityReview, initialGridReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);

    const gridReviews = useMemo(() => initialGridReviews.map(adaptToCardProps).filter(Boolean) as CardProps[], [initialGridReviews]);
    
    // Initialize filter state from URL search params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [activeSort, setActiveSort] = useState<'latest' | 'score'>((searchParams.get('sort') as any) || 'latest');
    const [selectedScoreRange, setSelectedScoreRange] = useState<ScoreFilter>((searchParams.get('score') as any) || 'All');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(() => {
        const gameSlug = searchParams.get('game');
        return gameSlug ? allGames.find(g => g.slug === gameSlug) || null : null;
    });
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>(() => {
        const tagSlugs = searchParams.get('tags')?.split(',') || [];
        return allTags.filter(t => tagSlugs.includes(t.slug));
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (searchTerm) params.set('q', searchTerm); else params.delete('q');
        if (activeSort !== 'latest') params.set('sort', activeSort); else params.delete('sort');
        if (selectedScoreRange !== 'All') params.set('score', selectedScoreRange); else params.delete('score');
        if (selectedGame) params.set('game', selectedGame.slug); else params.delete('game');
        if (selectedTags.length > 0) params.set('tags', selectedTags.map(t => t.slug).join(',')); else params.delete('tags');
        
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchTerm, activeSort, selectedScoreRange, selectedGame, selectedTags, router, pathname, searchParams]);
    
    const handleTagToggle = (tag: SanityTag) => { setSelectedTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAll = () => { setSearchTerm(''); setSelectedScoreRange('All'); setSelectedGame(null); setSelectedTags([]); setActiveSort('latest'); };

    const handleHeroClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix('reviews-hero');
        router.push(`/reviews/${heroReview.slug}`, { scroll: false });
    };

    return (
        <>
            <motion.div
                layoutId={`reviews-hero-card-container-${heroReview.legacyId}`}
                className={styles.reviewHero}
                onClick={handleHeroClick}
                style={{ cursor: 'pointer' }}
            >
                <motion.div layoutId={`reviews-hero-card-image-${heroReview.legacyId}`} className={styles.heroBg}>
                    <Image src={heroReview.mainImage.url} alt={`Background for ${heroReview.title}`} fill style={{ objectFit: 'cover' }} priority placeholder='blur' blurDataURL={heroReview.mainImage.blurDataURL} />
                </motion.div>
                <div className={styles.heroOverlay} />
                <motion.div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 5, color: '#fff', textAlign: 'center' }} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}}>
                    <p className={styles.heroCategory}>الأعلى تقييمًا</p>
                    <div className={styles.titleScoreWrapper}>
                        <motion.h1 layoutId={`reviews-hero-card-title-${heroReview.legacyId}`} className={styles.heroTitle}>{heroReview.title}</motion.h1>
                        <span className={styles.heroScore}>{heroReview.score?.toFixed(1)}</span>
                    </div>
                    {heroReview.game?.title && (<span className={styles.heroGame}>{heroReview.game.title}</span>)}
                    <div className="primary-button no-underline" style={{padding: '1rem 2.4rem', fontSize: '1.6rem', pointerEvents: 'none'}}>اقرأ المراجعة</div>
                </motion.div>
            </motion.div>
            
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
                    
                    {gridReviews.length === 0 && (
                        <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            لا توجد مراجعات تطابق ما اخترت.
                        </motion.p>
                    )}
                </div>
            </div>
        </>
    );
}