// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import ReviewFilters, { ScoreFilter } from '@/components/filters/ReviewFilters';
import FilteredReviewsGrid from '@/components/FilteredReviewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
import { adaptToCardProps } from '@/lib/adapters';
import styles from './ReviewsPage.module.css';

export default function ReviewsPageClient({ heroReview, otherReviews, allGames, allTags }: { heroReview: SanityReview, otherReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScoreRange, setSelectedScoreRange] = useState<ScoreFilter>(() => (searchParams.get('score') as ScoreFilter) || 'All');
  const [activeSort, setActiveSort] = useState<'latest' | 'score'>(() => (searchParams.get('sort') as 'latest' | 'score') || 'latest');
  const [selectedGame, setSelectedGame] = useState<SanityGame | null>(() => {
    const gameSlug = searchParams.get('game');
    return gameSlug ? allGames.find(g => g.slug === gameSlug) || null : null;
  });
  const [selectedTags, setSelectedTags] = useState<SanityTag[]>(() => {
    const tagSlugs = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    return tagSlugs.map(slug => allTags.find(t => t.slug === slug)).filter((t): t is SanityTag => !!t);
  });

  const filtersRef = useRef(null);
  const isInView = useInView(filtersRef, { once: true, amount: 0.2 });

  const updateURLParams = useCallback((sort: 'latest' | 'score', score: string, game: SanityGame | null, tags: SanityTag[]) => {
    const params = new URLSearchParams();
    if (sort !== 'latest') params.set('sort', sort);
    if (score !== 'All') params.set('score', score);
    if (game) params.set('game', game.slug);
    if (tags.length > 0) params.set('tags', tags.map(t => t.slug).join(','));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const handleSortChange = (sort: 'latest' | 'score') => { setActiveSort(sort); updateURLParams(sort, selectedScoreRange, selectedGame, selectedTags); };
  const handleScoreSelect = (score: string) => { setSelectedScoreRange(score as any); updateURLParams(activeSort, score, selectedGame, selectedTags); };
  const handleGameSelect = (game: SanityGame | null) => { setSelectedGame(game); updateURLParams(activeSort, selectedScoreRange, game, selectedTags); };
  
  const handleTagToggle = (tagOrArray: SanityTag | SanityTag[]) => {
    if (Array.isArray(tagOrArray)) {
        setSelectedTags([]);
        updateURLParams(activeSort, selectedScoreRange, selectedGame, []);
        return;
    }
    const tag = tagOrArray;
    const newTags = selectedTags.some(t => t._id === tag._id) ? selectedTags.filter(t => t._id !== tag._id) : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateURLParams(activeSort, selectedScoreRange, selectedGame, newTags);
  };
  
  const handleClearAll = () => {
    setSelectedScoreRange('All');
    setSelectedGame(null);
    setSelectedTags([]);
    setSearchTerm('');
    updateURLParams(activeSort, 'All', null, []);
  };
  
  const filteredAndSortedReviews = useMemo(() => {
    let reviews = [...otherReviews];

    if (searchTerm) {
        reviews = reviews.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedScoreRange !== 'All') {
      switch (selectedScoreRange) {
        case '9-10': reviews = reviews.filter(r => r.score >= 9 && r.score <= 10); break;
        case '8-8.9': reviews = reviews.filter(r => r.score >= 8 && r.score < 9); break;
        case '7-7.9': reviews = reviews.filter(r => r.score >= 7 && r.score < 8); break;
        case '<7': reviews = reviews.filter(r => r.score < 7); break;
      }
    }

    if (selectedGame) reviews = reviews.filter(r => r.game?._id === selectedGame._id);

    if (selectedTags.length > 0) {
      const selectedTagIds = new Set(selectedTags.map(t => t._id));
      reviews = reviews.filter(r => (r.tags || []).some(tagRef => tagRef && selectedTagIds.has(tagRef._id)));
    }

    if (activeSort === 'score') reviews.sort((a, b) => b.score - a.score);
    else reviews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return reviews.map(adaptToCardProps).filter(Boolean);
  }, [otherReviews, activeSort, selectedScoreRange, selectedGame, selectedTags, searchTerm]);

  const animationVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };

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
            activeSort={activeSort} onSortChange={handleSortChange}
            selectedScoreRange={selectedScoreRange} onScoreSelect={handleScoreSelect}
            allGames={allGames} selectedGame={selectedGame} onGameSelect={handleGameSelect}
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