// app/reviews/ReviewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { SanityReview, SanityGame, SanityTag } from '@/types/sanity';
import { motion, useInView } from 'framer-motion';

import FeaturedReviewHero from '@/components/FeaturedReviewHero';
import ReviewFilters from '@/components/filters/ReviewFilters';
import FilteredReviewsGrid from '@/components/FilteredReviewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
import { adaptToCardProps } from '@/lib/adapters';

// The incorrect import that caused the build error has been removed.

export default function ReviewsPageClient({ heroReview, otherReviews, allGames, allTags }: { heroReview: SanityReview, otherReviews: SanityReview[], allGames: SanityGame[], allTags: SanityTag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScoreRange, setSelectedScoreRange] = useState<'الكل' | '9-10' | '8-8.9' | '7-7.9' | '<7'>(() => (searchParams.get('score') as 'الكل' | '9-10' | '8-8.9' | '7-7.9' | '<7') || 'الكل');
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
    if (score !== 'الكل') params.set('score', score);
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
    setSelectedScoreRange('الكل');
    setSelectedGame(null);
    setSelectedTags([]);
    setSearchTerm('');
    updateURLParams(activeSort, 'الكل', null, []);
  };
  
  const filteredAndSortedReviews = useMemo(() => {
    let reviews = [...otherReviews];

    if (searchTerm) {
        reviews = reviews.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedScoreRange !== 'الكل') {
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
      <FeaturedReviewHero review={heroReview} />
      
      <div className="container page-container" style={{paddingTop: '4rem'}}>
        <motion.div ref={filtersRef} variants={animationVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <ReviewFilters
            activeSort={activeSort} onSortChange={handleSortChange}
            selectedScoreRange={selectedScoreRange} onScoreSelect={handleScoreSelect}
            allGames={allGames} selectedGame={selectedGame} onGameSelect={handleGameSelect}
            allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll}
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
          />
        </motion.div>

        <motion.div variants={animationVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'} transition={{ delay: 0.2 }}>
          <ContentBlock title="جميع المراجعات">
             {filteredAndSortedReviews.length > 0 ? (
              <FilteredReviewsGrid reviews={filteredAndSortedReviews} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <p>لا توجد مراجعات تطابق ما اخترت.</p>
              </motion.div>
            )}
          </ContentBlock>
        </motion.div>
      </div>
    </>
  );
}





