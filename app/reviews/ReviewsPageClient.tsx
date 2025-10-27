// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import ReviewFilters, { ScoreFilter } from '@/components/filters/ReviewFilters';
import FilteredReviewsGrid from '@/components/FilteredReviewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
import { useContentFilters, ContentFilters } from '@/hooks/useContentFilters';
import { useUrlState } from '@/hooks/useUrlState';
import styles from './ReviewsPage.module.css';

export default function ReviewsPageClient({ heroReview, otherReviews, allGames, allTags }: { heroReview: SanityReview, otherReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
  const filtersRef = useRef(null);

  const [searchTerm, setSearchTerm] = useUrlState({
    param: 'q',
    defaultValue: '',
    serialize: v => v || undefined,
    deserialize: v => v || '',
  });

  const [activeSort, setActiveSort] = useUrlState({
    param: 'sort',
    defaultValue: 'latest' as 'latest' | 'score',
    serialize: v => v === 'latest' ? undefined : v,
    deserialize: v => (v === 'score' ? 'score' : 'latest'),
  });

  const [selectedScoreRange, setSelectedScoreRange] = useUrlState({
    param: 'score',
    defaultValue: 'All' as ScoreFilter,
    serialize: v => v === 'All' ? undefined : v,
    deserialize: v => (v as ScoreFilter) || 'All',
  });
  
  const deserializeGame = useCallback((v: string | null) => allGames.find(g => g.slug === v) || null, [allGames]);
  const [selectedGame, setSelectedGame] = useUrlState({
    param: 'game',
    defaultValue: null as SanityGame | null,
    serialize: v => v?.slug,
    deserialize: deserializeGame,
  });

  const deserializeTags = useCallback((v: string | null) => v ? v.split(',').map(slug => allTags.find(t => t.slug === slug)).filter((t): t is SanityTag => !!t) : [], [allTags]);
  const [selectedTags, setSelectedTags] = useUrlState({
    param: 'tags',
    defaultValue: [] as SanityTag[],
    serialize: v => v.length > 0 ? v.map(t => t.slug).join(',') : undefined,
    deserialize: deserializeTags,
  });
  
  const handleTagToggle = (tagOrArray: SanityTag | SanityTag[]) => {
    if (Array.isArray(tagOrArray)) {
        setSelectedTags([]);
        return;
    }
    setSelectedTags(prevTags => 
        prevTags.some(t => t._id === tagOrArray._id) 
            ? prevTags.filter(t => t._id !== tagOrArray._id) 
            : [...prevTags, tagOrArray]
    );
  };
  
  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedScoreRange('All');
    setSelectedGame(null);
    setSelectedTags([]);
  };
  
  const filters: ContentFilters = useMemo(() => ({
    sort: activeSort,
    scoreRange: selectedScoreRange,
    game: selectedGame,
    tags: selectedTags,
    searchTerm: searchTerm,
  }), [activeSort, selectedScoreRange, selectedGame, selectedTags, searchTerm]);

  const filteredAndSortedReviews = useContentFilters(otherReviews, filters);
  
  return (
    <>
      <div className={styles.reviewHero}>
        <Image 
            src={heroReview.mainImage.url} 
            alt={`Background for ${heroReview.title}`} 
            fill 
            className={styles.heroBg}
            style={{ objectFit: 'cover' }} 
            priority 
            placeholder='blur'
            blurDataURL={heroReview.mainImage.blurDataURL}
        />
        <div className={styles.heroOverlay} />
        <motion.div 
            className="container"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 5, color: '#fff', textAlign: 'center' }}
            initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}}
        >
            <p style={{fontFamily: 'var(--font-ui)', fontSize: '1.6rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: 0}}>الأعلى تقييمًا</p>
            <h1 className={styles.heroTitle} style={{fontSize: '4.8rem', marginBottom: '1rem'}}>{heroReview.title}</h1>
             <div className={styles.heroMeta}>
                <span className={styles.heroScore}>{heroReview.score?.toFixed(1)}</span>
                {heroReview.game?.title && (
                    <span className={styles.heroGame}>{heroReview.game.title}</span>
                )}
            </div>
            <Link href={`/reviews/${heroReview.slug}`} className="primary-button no-underline" style={{padding: '1rem 2.4rem', fontSize: '1.6rem'}}>اقرأ المراجعة</Link>
        </motion.div>
      </div>
      
      <div className="container" style={{paddingTop: '4rem'}}>
        <div ref={filtersRef}>
          <ReviewFilters
            activeSort={activeSort} onSortChange={setActiveSort}
            selectedScoreRange={selectedScoreRange} onScoreSelect={setSelectedScoreRange}
            allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame}
            allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll}
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
          />
        </div>

        <ContentBlock title="جميع المراجعات">
            {filteredAndSortedReviews.length > 0 ? (
            <FilteredReviewsGrid reviews={filteredAndSortedReviews} />
            ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <p>لا توجد مراجعات تطابق ما اخترت.</p>
            </motion.div>
            )}
        </ContentBlock>
      </div>
    </>
  );
}